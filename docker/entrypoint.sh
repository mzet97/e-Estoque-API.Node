#!/bin/bash

# Docker entrypoint script for e-Estoque API
set -e

echo "🚀 Starting E-Estoque API..."

# Function to wait for service dependencies
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_attempts=${3:-30}
    local delay=${4:-2}
    
    echo "⏳ Waiting for $service_name..."
    
    for i in $(seq 1 $max_attempts); do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready"
            return 0
        fi
        
        if [ $i -eq $max_attempts ]; then
            echo "❌ $service_name failed to start after $max_attempts attempts"
            return 1
        fi
        
        echo "Attempt $i/$max_attempts failed, retrying in ${delay}s..."
        sleep $delay
    done
}

# Function to run database migrations
run_migrations() {
    echo "🗃️ Running database migrations..."
    
    if [ -f "./dist/typeorm/migrate.js" ]; then
        node ./dist/typeorm/migrate.js
    else
        echo "⚠️ Migration script not found, skipping..."
    fi
}

# Function to seed database (if enabled)
seed_database() {
    if [ "$SEED_DATABASE" = "true" ]; then
        echo "🌱 Seeding database..."
        node ./dist/typeorm/seed.js
    fi
}

# Function to initialize services
initialize_services() {
    echo "🔧 Initializing services..."
    
    # Wait for Redis
    if [ -n "$REDIS_URL" ]; then
        wait_for_service "Redis" "${REDIS_URL}/health" 20 3
    fi
    
    # Wait for RabbitMQ
    if [ -n "$RABBITMQ_URL" ]; then
        wait_for_service "RabbitMQ" "http://localhost:15672" 20 3
    fi
    
    # Wait for Database
    if [ -n "$DATABASE_URL" ]; then
        # Extract host and port from DATABASE_URL
        db_host=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
        db_port=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\).*|\1|p')
        
        if [ -n "$db_host" ] && [ -n "$db_port" ]; then
            wait_for_service "Database" "tcp://$db_host:$db_port" 30 2
        fi
    fi
    
    # Run migrations
    run_migrations
    
    # Seed database if enabled
    seed_database
}

# Function to setup logging
setup_logging() {
    echo "📝 Setting up logging..."
    
    # Ensure log directory exists
    mkdir -p /app/logs
    
    # Set appropriate permissions
    chmod 755 /app/logs
}

# Function to setup health checks
setup_health_checks() {
    echo "🏥 Setting up health checks..."
    
    # Create health check endpoint script
    cat > /tmp/health-check.sh << 'EOF'
#!/bin/sh
curl -f http://localhost:$PORT/health || exit 1
EOF
    
    chmod +x /tmp/health-check.sh
}

# Function to validate environment variables
validate_environment() {
    echo "🔍 Validating environment..."
    
    required_vars=("NODE_ENV")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo "❌ Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    echo "✅ Environment validation passed"
}

# Function to cleanup on shutdown
cleanup() {
    echo "🧹 Cleaning up..."
    
    # Close database connections
    if [ -f "./dist/shared/typeorm/disconnect.js" ]; then
        node ./dist/shared/typeorm/disconnect.js || true
    fi
    
    # Close Redis connections
    if [ -f "./dist/shared/redis/disconnect.js" ]; then
        node ./dist/shared/redis/disconnect.js || true
    fi
    
    # Close RabbitMQ connections
    if [ -f "./dist/shared/services/disconnect.js" ]; then
        node ./dist/shared/services/disconnect.js || true
    fi
    
    echo "✅ Cleanup completed"
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

# Main execution
main() {
    echo "🏗️ E-Estoque API Production Startup"
    echo "Environment: $NODE_ENV"
    echo "Port: $PORT"
    
    # Validate environment
    validate_environment
    
    # Setup logging
    setup_logging
    
    # Setup health checks
    setup_health_checks
    
    # Initialize services if not in skip mode
    if [ "$SKIP_SERVICE_INIT" != "true" ]; then
        initialize_services
    fi
    
    # Change to app directory
    cd /app
    
    # Execute the main application
    echo "🎯 Starting application..."
    exec "$@"
}

# Run main function with all arguments
main "$@"