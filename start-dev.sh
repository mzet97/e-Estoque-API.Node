#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=0

    print_status "Waiting for $service_name to be ready..."

    while [ $attempt -lt $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    print_error "$service_name failed to start within expected time"
    return 1
}

# Function to check if PostgreSQL is ready
wait_for_postgres() {
    print_status "Waiting for PostgreSQL..."
    local max_attempts=40
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker exec estoque_postgres pg_isready -U estoque_user -d estoque_db >/dev/null 2>&1; then
            print_success "PostgreSQL is ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 3
    done

    print_error "PostgreSQL failed to start within expected time"
    return 1
}

# Function to create .env file if it doesn't exist
create_env_file() {
    if [ ! -f .env ]; then
        if [ -f .env.development ]; then
            print_status "Copying .env.development to .env..."
            cp .env.development .env
            print_success ".env file created"
        else
            print_warning ".env file does not exist and .env.development not found"
        fi
    fi
}

# Function to start infrastructure services
start_infrastructure() {
    print_status "Starting infrastructure services (PostgreSQL, Redis, RabbitMQ, Keycloak)..."
    
    # Start Docker services
    docker-compose up -d postgres redis rabbitmq keycloak
    
    if [ $? -eq 0 ]; then
        print_success "Infrastructure services started"
        
        # Wait for services to be ready
        wait_for_postgres
        wait_for_service localhost 6379 "Redis"
        wait_for_service localhost 5672 "RabbitMQ"
        wait_for_service localhost 8080 "Keycloak"
        
        print_success "All infrastructure services are ready!"
    else
        print_error "Failed to start infrastructure services"
        exit 1
    fi
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Check if database is accessible
    if ! docker exec estoque_postgres pg_isready -U estoque_user -d estoque_db >/dev/null 2>&1; then
        print_error "Database is not ready"
        exit 1
    fi
    
    # Generate migration if needed
    print_status "Generating TypeORM migration..."
    pnpm typeorm migration:generate -d src/shared/typeorm/index.ts src/shared/typeorm/migrations/AutoMigration
    
    # Run migrations
    print_status "Running migrations..."
    pnpm typeorm migration:run -d src/shared/typeorm/index.ts
    
    if [ $? -eq 0 ]; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi
}

# Function to start the application
start_application() {
    print_status "Starting the application..."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        pnpm install
    fi
    
    # Build the application
    print_status "Building the application..."
    pnpm build
    
    # Start the development server
    print_success "Starting development server..."
    pnpm dev
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    echo "======================================"
    
    # Check Docker services
    if command_exists docker && command_exists docker-compose; then
        print_status "Docker Services:"
        docker-compose ps
        echo ""
    fi
    
    # Check if ports are open
    print_status "Port Status:"
    netstat -tuln | grep -E ':3000|:5432|:6379|:5672|:8080' || echo "No services detected on standard ports"
}

# Function to stop all services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down
    pkill -f "ts-node-dev" 2>/dev/null || true
    print_success "All services stopped"
}

# Function to clean everything
clean_all() {
    print_warning "This will stop and remove all containers and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v --remove-orphans
        rm -rf node_modules
        rm -rf dist
        print_success "All cleaned up"
    fi
}

# Function to show help
show_help() {
    echo "e-Estoque API Development Helper"
    echo "================================"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services and the application"
    echo "  infra       Start only infrastructure services"
    echo "  app         Start only the application"
    echo "  migrate     Run database migrations"
    echo "  status      Show service status"
    echo "  stop        Stop all services"
    echo "  clean       Clean all containers and volumes"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start    # Full development setup"
    echo "  $0 infra    # Start just the database and services"
    echo "  $0 status   # Check what's running"
}

# Main script logic
case "${1:-}" in
    "start")
        create_env_file
        start_infrastructure
        run_migrations
        start_application
        ;;
    "infra")
        create_env_file
        start_infrastructure
        ;;
    "app")
        create_env_file
        start_application
        ;;
    "migrate")
        run_migrations
        ;;
    "status")
        show_status
        ;;
    "stop")
        stop_services
        ;;
    "clean")
        clean_all
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: ${1:-}"
        echo ""
        show_help
        exit 1
        ;;
esac
