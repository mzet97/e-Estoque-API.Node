#!/bin/bash

# Health check script for E-Estoque API Docker container
set -e

# Default values
PORT=${PORT:-3000}
HEALTH_ENDPOINT=${HEALTH_ENDPOINT:-http://localhost:${PORT}/health}
DETAILED_ENDPOINT=${DETAILED_ENDPOINT:-http://localhost:${PORT}/health/detailed}
TIMEOUT=${HEALTH_CHECK_TIMEOUT:-10}
MAX_ATTEMPTS=${HEALTH_CHECK_MAX_ATTEMPTS:-3}
RETRIES=${HEALTH_CHECK_RETRIES:-3}

echo "🏥 E-Estoque API Health Check"
echo "Endpoint: $HEALTH_ENDPOINT"
echo "Timeout: ${TIMEOUT}s"
echo "Max Attempts: $MAX_ATTEMPTS"

# Function to check basic health
check_basic_health() {
    echo "🔍 Checking basic health..."
    
    local response=$(curl -f -s --max-time $TIMEOUT "$HEALTH_ENDPOINT" 2>/dev/null || echo "")
    
    if [ -z "$response" ]; then
        echo "❌ Basic health check failed - no response"
        return 1
    fi
    
    # Check if response contains status field
    if echo "$response" | grep -q '"status"'; then
        local status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        echo "📊 Health status: $status"
        
        case $status in
            "healthy"|"ok")
                echo "✅ Application is healthy"
                return 0
                ;;
            "degraded")
                echo "⚠️ Application is degraded but functional"
                return 0
                ;;
            "unhealthy"|"down")
                echo "❌ Application is unhealthy"
                return 1
                ;;
            *)
                echo "⚠️ Unknown health status: $status"
                return 1
                ;;
        esac
    else
        echo "⚠️ Health response format unexpected"
        return 1
    fi
}

# Function to check detailed health
check_detailed_health() {
    echo "🔍 Checking detailed health..."
    
    local response=$(curl -f -s --max-time $TIMEOUT "$DETAILED_ENDPOINT" 2>/dev/null || echo "")
    
    if [ -z "$response" ]; then
        echo "⚠️ Detailed health check unavailable"
        return 0  # Don't fail on detailed check
    fi
    
    # Parse individual service checks if available
    if echo "$response" | grep -q '"checks"'; then
        echo "📊 Detailed health check results:"
        
        # Check database
        if echo "$response" | grep -q '"database"'; then
            local db_status=$(echo "$response" | grep -o '"database":{[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
            echo "  🗃️ Database: $db_status"
        fi
        
        # Check Redis
        if echo "$response" | grep -q '"redis"'; then
            local redis_status=$(echo "$response" | grep -o '"redis":{[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
            echo "  💾 Redis: $redis_status"
        fi
        
        # Check RabbitMQ
        if echo "$response" | grep -q '"rabbitmq"'; then
            local rabbit_status=$(echo "$response" | grep -o '"rabbitmq":{[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
            echo "  🐰 RabbitMQ: $rabbit_status"
        fi
        
        # Check memory
        if echo "$response" | grep -q '"memory"'; then
            local memory_status=$(echo "$response" | grep -o '"memory":{[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
            echo "  🧠 Memory: $memory_status"
        fi
    fi
    
    return 0
}

# Function to check application responsiveness
check_responsiveness() {
    echo "⚡ Checking application responsiveness..."
    
    local start_time=$(date +%s%3N)
    local response=$(curl -f -s --max-time $TIMEOUT "$HEALTH_ENDPOINT" 2>/dev/null || echo "")
    local end_time=$(date +%s%3N)
    
    if [ -z "$response" ]; then
        echo "❌ Responsiveness check failed"
        return 1
    fi
    
    local response_time=$((end_time - start_time))
    echo "⏱️ Response time: ${response_time}ms"
    
    # Health check should respond quickly (less than 5 seconds)
    if [ $response_time -gt 5000 ]; then
        echo "⚠️ Response time is too slow: ${response_time}ms"
        return 1
    else
        echo "✅ Response time is acceptable"
        return 0
    fi
}

# Function to check process status
check_process() {
    echo "🔍 Checking process status..."
    
    # Check if Node.js process is running
    if pgrep -f "node.*GatewayServer" > /dev/null; then
        local pid=$(pgrep -f "node.*GatewayServer")
        echo "✅ Node.js process is running (PID: $pid)"
        return 0
    else
        echo "❌ Node.js process not found"
        return 1
    fi
}

# Function to check resource usage
check_resources() {
    echo "📊 Checking resource usage..."
    
    # Check memory usage
    local memory_usage=$(ps -o pid,ppid,pcpu,pmem,cmd -p $$ | tail -1 | awk '{print $4}')
    echo "🧠 Memory usage: ${memory_usage}%"
    
    # Check CPU usage
    local cpu_usage=$(ps -o pid,ppid,pcpu,pmem,cmd -p $$ | tail -1 | awk '{print $3}')
    echo "💻 CPU usage: ${cpu_usage}%"
    
    # Basic resource limits (adjust as needed)
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        echo "⚠️ High memory usage detected"
        return 1
    fi
    
    if (( $(echo "$cpu_usage > 90" | bc -l) )); then
        echo "⚠️ High CPU usage detected"
        return 1
    fi
    
    return 0
}

# Main health check function
main() {
    echo "🏥 Starting E-Estoque API health check..."
    
    local attempts=0
    local max_attempts=$MAX_ATTEMPTS
    
    while [ $attempts -lt $max_attempts ]; do
        attempts=$((attempts + 1))
        echo ""
        echo "🔍 Attempt $attempts/$max_attempts"
        
        # Run all health checks
        local failed_checks=0
        
        # Basic health check
        if ! check_basic_health; then
            failed_checks=$((failed_checks + 1))
        fi
        
        # Process check
        if ! check_process; then
            failed_checks=$((failed_checks + 1))
        fi
        
        # Responsiveness check
        if ! check_responsiveness; then
            failed_checks=$((failed_checks + 1))
        fi
        
        # Resource check
        if ! check_resources; then
            failed_checks=$((failed_checks + 1))
        fi
        
        # Detailed health check (non-blocking)
        check_detailed_health || true
        
        # Determine overall health
        if [ $failed_checks -eq 0 ]; then
            echo ""
            echo "✅ All health checks passed!"
            exit 0
        else
            echo ""
            echo "❌ Health check failed ($failed_checks checks failed)"
            
            if [ $attempts -eq $max_attempts ]; then
                echo "❌ Maximum attempts reached, health check failed"
                exit 1
            else
                echo "⏳ Retrying in 5 seconds..."
                sleep 5
            fi
        fi
    done
}

# Run main function
main "$@"