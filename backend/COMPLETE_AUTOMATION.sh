#!/bin/bash
# === LFA Legacy GO - COMPLETE DEPLOYMENT AUTOMATION CONTROLLER ===
# This script orchestrates the complete deployment process

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Symbols
ROCKET="🚀"
CHECK="✅"
ERROR="❌"
WARNING="⚠️"
INFO="ℹ️"
GEAR="⚙️"
CLOCK="⏰"

print_banner() {
    echo -e "${PURPLE}"
    echo "================================================================"
    echo "🚀 LFA LEGACY GO - COMPLETE CLOUD RUN AUTOMATION 🚀"
    echo "================================================================"
    echo "🎯 ULTIMATE DEPLOYMENT AUTOMATION SYSTEM"
    echo "⏰ Expected Duration: 15-20 minutes"
    echo "🎉 Target: Full production deployment + frontend config"
    echo "================================================================"
    echo -e "${NC}"
}

print_step() { echo -e "${BLUE}${GEAR} $1${NC}"; }
print_success() { echo -e "${GREEN}${CHECK} $1${NC}"; }
print_error() { echo -e "${RED}${ERROR} $1${NC}"; }
print_warning() { echo -e "${YELLOW}${WARNING} $1${NC}"; }
print_info() { echo -e "${CYAN}${INFO} $1${NC}"; }

# Add gcloud to PATH
export PATH="/Users/lovas.zoltan/google-cloud-sdk/bin:$PATH"

print_banner

# Phase 1: Authentication Status Check
print_step "Phase 1: Authentication Status Check"

if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud SDK not found!"
    print_info "Please ensure gcloud is installed and in PATH"
    exit 1
fi

if ! gcloud auth list --format="value(account)" | head -n1 | grep -q "@"; then
    print_warning "Authentication required!"
    echo ""
    echo -e "${YELLOW}🔐 AUTHENTICATION REQUIRED${NC}"
    echo "================================================================"
    echo "To complete the deployment, you need to authenticate with Google Cloud."
    echo ""
    echo "Please run the following commands in order:"
    echo ""
    echo -e "${CYAN}1. Authenticate with Google Cloud:${NC}"
    echo "   gcloud auth login"
    echo ""
    echo -e "${CYAN}2. Set the project:${NC}"
    echo "   gcloud config set project lfa-legacy-go"
    echo ""
    echo -e "${CYAN}3. Run the ultimate deployment:${NC}"
    echo "   ./ULTIMATE_DEPLOY.sh"
    echo ""
    echo "================================================================"
    echo -e "${GREEN}After authentication, run: ./ULTIMATE_DEPLOY.sh${NC}"
    echo "================================================================"
    exit 0
else
    ACTIVE_ACCOUNT=$(gcloud auth list --format="value(account)" | head -n1)
    print_success "Authenticated as: $ACTIVE_ACCOUNT"
    
    # Phase 2: Direct Ultimate Deployment
    print_step "Phase 2: Executing Ultimate Deployment"
    print_info "Launching comprehensive deployment automation..."
    
    # Execute the ultimate deployment script
    ./ULTIMATE_DEPLOY.sh
fi