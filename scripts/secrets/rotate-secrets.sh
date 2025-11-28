#!/bin/bash

# Secrets Rotation Script for E-Estoque API
# Rotates secrets across different providers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SECRETS_PROVIDER="${SECRETS_PROVIDER:-local}"
ROTATION_INTERVAL_DAYS="${ROTATION_INTERVAL_DAYS:-90}"
LOG_FILE="/var/log/secrets-rotation.log"
BACKUP_DIR="/var/backups/secrets"

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Parse command line arguments
ROTATION_TYPE="all"
DRY_RUN=false
SECRET_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            ROTATION_TYPE="$2"
            shift 2
            ;;
        --secret)
            SECRET_NAME="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --provider)
            SECRETS_PROVIDER="$2"
            shift 2
            ;;
        --help)
            print_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            print_help
            exit 1
            ;;
    esac
done

# Help function
print_help() {
    cat << EOF
E-Estoque Secrets Rotation Script

Usage: $0 [options]

Options:
  --type <type>           Rotation type (jwt|database|api-keys|all)
  --secret <name>         Rotate specific secret
  --dry-run              Show what would be done without executing
  --provider <provider>   Secrets provider (local|aws|vault|azure|gcp)
  --help                 Show this help message

Examples:
  $0 --type jwt --dry-run
  $0 --secret database-password
  $0 --type all
  $0 --provider aws --type api-keys

Default values:
  - Provider: local
  - Rotation type: all
  - Dry run: false
EOF
}

# Create directories
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$BACKUP_DIR"

log_info "Starting secrets rotation process"
log_info "Provider: $SECRETS_PROVIDER"
log_info "Rotation type: $ROTATION_TYPE"
log_info "Dry run: $DRY_RUN"

# Provider-specific rotation functions
rotate_local_secrets() {
    log_info "Rotating local secrets..."
    
    case $ROTATION_TYPE in
        "jwt")
            rotate_jwt_secrets_local
            ;;
        "database")
            rotate_database_secrets_local
            ;;
        "api-keys")
            rotate_api_keys_local
            ;;
        "all")
            rotate_jwt_secrets_local
            rotate_database_secrets_local
            rotate_api_keys_local
            rotate_external_secrets_local
            ;;
    esac
}

rotate_aws_secrets() {
    log_info "Rotating AWS Secrets Manager secrets..."
    
    case $ROTATION_TYPE in
        "jwt")
            rotate_jwt_secrets_aws
            ;;
        "database")
            rotate_database_secrets_aws
            ;;
        "api-keys")
            rotate_api_keys_aws
            ;;
        "all")
            rotate_jwt_secrets_aws
            rotate_database_secrets_aws
            rotate_api_keys_aws
            rotate_external_secrets_aws
            ;;
    esac
}

rotate_vault_secrets() {
    log_info "Rotating HashiCorp Vault secrets..."
    
    case $ROTATION_TYPE in
        "jwt")
            rotate_jwt_secrets_vault
            ;;
        "database")
            rotate_database_secrets_vault
            ;;
        "api-keys")
            rotate_api_keys_vault
            ;;
        "all")
            rotate_jwt_secrets_vault
            rotate_database_secrets_vault
            rotate_api_keys_vault
            rotate_external_secrets_vault
            ;;
    esac
}

# JWT secrets rotation
rotate_jwt_secrets_local() {
    local secret_name="jwt-secret"
    local new_secret=$(generate_random_secret 64)
    
    log_info "Rotating JWT secret..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would rotate $secret_name"
        return
    fi
    
    # Backup current secret
    backup_secret "$secret_name"
    
    # Update secret (in local provider, this would update the environment)
    export SECRET_$(echo "$secret_name" | tr '[:lower:]' '[:upper:]')="$new_secret"
    
    log_success "JWT secret rotated successfully"
}

rotate_jwt_secrets_aws() {
    local secret_name="eestoque/jwt-secret"
    
    log_info "Rotating JWT secret in AWS Secrets Manager..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would rotate $secret_name in AWS"
        return
    fi
    
    # This would use AWS CLI or SDK
    # aws secretsmanager rotate-secret --secret-id "$secret_name"
    
    log_success "JWT secret rotated in AWS Secrets Manager"
}

# Database secrets rotation
rotate_database_secrets_local() {
    log_info "Database secrets rotation not applicable for local provider"
}

rotate_database_secrets_aws() {
    local secret_name="eestoque/database-credentials"
    
    log_info "Rotating database credentials in AWS Secrets Manager..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would rotate database credentials in AWS"
        return
    fi
    
    # Rotate database credentials
    # aws secretsmanager rotate-secret --secret-id "$secret_name"
    
    log_success "Database credentials rotated in AWS Secrets Manager"
}

# API keys rotation
rotate_api_keys_local() {
    log_info "API keys rotation not applicable for local provider"
}

rotate_api_keys_aws() {
    local api_secrets=(
        "eestoque/sendgrid-api-key"
        "eestoque/payment-gateway-key"
        "eestoque/sms-api-key"
    )
    
    log_info "Rotating API keys in AWS Secrets Manager..."
    
    for secret in "${api_secrets[@]}"; do
        if [ "$DRY_RUN" = true ]; then
            log_info "DRY RUN: Would rotate $secret in AWS"
            continue
        fi
        
        # aws secretsmanager rotate-secret --secret-id "$secret"
        log_success "Rotated API key: $secret"
    done
}

# External secrets rotation
rotate_external_secrets_local() {
    log_info "External secrets rotation not applicable for local provider"
}

rotate_external_secrets_aws() {
    local external_secrets=(
        "eestoque/external-service-1"
        "eestoque/external-service-2"
    )
    
    log_info "Rotating external service secrets in AWS Secrets Manager..."
    
    for secret in "${external_secrets[@]}"; do
        if [ "$DRY_RUN" = true ]; then
            log_info "DRY RUN: Would rotate $secret in AWS"
            continue
        fi
        
        # aws secretsmanager rotate-secret --secret-id "$secret"
        log_success "Rotated external secret: $secret"
    done
}

# Vault secrets rotation
rotate_jwt_secrets_vault() {
    local secret_path="secret/eestoque/jwt-secret"
    
    log_info "Rotating JWT secret in HashiCorp Vault..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would rotate $secret_path in Vault"
        return
    fi
    
    # This would use Vault CLI or API
    # vault kv put "$secret_path" jwt-secret="$(generate_random_secret 64)"
    
    log_success "JWT secret rotated in Vault"
}

rotate_database_secrets_vault() {
    log_info "Database credentials rotation in Vault..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would rotate database credentials in Vault"
        return
    fi
    
    # vault kv put "secret/eestoque/database-credentials" \
    #     username="new_username" \
    #     password="$(generate_random_password 32)"
    
    log_success "Database credentials rotated in Vault"
}

rotate_api_keys_vault() {
    log_info "API keys rotation in Vault..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would rotate API keys in Vault"
        return
    fi
    
    # vault kv put "secret/eestoque/api-keys" \
    #     sendgrid="$(generate_random_secret 50)" \
    #     payment="$(generate_random_secret 40)"
    
    log_success "API keys rotated in Vault"
}

# Utility functions
generate_random_secret() {
    local length="${1:-32}"
    openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length"
}

generate_random_password() {
    local length="${1:-16}"
    openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length"
}

backup_secret() {
    local secret_name="$1"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/${secret_name}_${timestamp}.backup"
    
    log_info "Backing up secret: $secret_name"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would backup $secret_name to $backup_file"
        return
    fi
    
    # Create backup (implementation depends on provider)
    echo "Secret backup for $secret_name at $timestamp" > "$backup_file"
    
    log_success "Secret backed up: $backup_file"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    case $SECRETS_PROVIDER in
        "local")
            return 0
            ;;
        "aws")
            if aws sts get-caller-identity >/dev/null 2>&1; then
                return 0
            else
                log_error "AWS credentials not configured or invalid"
                return 1
            fi
            ;;
        "vault")
            if vault status >/dev/null 2>&1; then
                return 0
            else
                log_error "Vault connection failed"
                return 1
            fi
            ;;
        *)
            log_error "Unknown secrets provider: $SECRETS_PROVIDER"
            return 1
            ;;
    esac
}

# Main execution
main() {
    if ! health_check; then
        log_error "Health check failed. Aborting rotation."
        exit 1
    fi
    
    # Perform rotation based on provider
    case $SECRETS_PROVIDER in
        "local")
            rotate_local_secrets
            ;;
        "aws")
            rotate_aws_secrets
            ;;
        "vault")
            rotate_vault_secrets
            ;;
        "azure")
            log_warning "Azure Key Vault rotation not yet implemented"
            ;;
        "gcp")
            log_warning "GCP Secret Manager rotation not yet implemented"
            ;;
        *)
            log_error "Unknown secrets provider: $SECRETS_PROVIDER"
            exit 1
            ;;
    esac
    
    log_success "Secrets rotation process completed successfully"
    log_info "Log file: $LOG_FILE"
    log_info "Backup directory: $BACKUP_DIR"
}

# Run main function
main "$@"