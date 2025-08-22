#!/usr/bin/env python3
"""
LFA Legacy GO Security Audit Script
Validates security configuration and identifies potential vulnerabilities
"""

import os
import sys
import secrets
from typing import List, Dict, Any
from pathlib import Path

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent))

from app.core.config import get_settings

def audit_environment_variables() -> List[Dict[str, Any]]:
    """Audit environment variables for security issues."""
    issues = []
    settings = get_settings()
    
    # Check admin password
    if not settings.ADMIN_PASSWORD:
        issues.append({
            "severity": "CRITICAL",
            "category": "Authentication",
            "issue": "ADMIN_PASSWORD not set",
            "recommendation": "Set ADMIN_PASSWORD environment variable with a strong password"
        })
    elif settings.ADMIN_PASSWORD in ["admin", "admin123", "password", "123456"]:
        issues.append({
            "severity": "CRITICAL", 
            "category": "Authentication",
            "issue": "Weak admin password detected",
            "recommendation": "Use a strong password (8+ chars, mixed case, numbers, symbols)"
        })
    elif len(settings.ADMIN_PASSWORD) < 8:
        issues.append({
            "severity": "HIGH",
            "category": "Authentication", 
            "issue": "Admin password too short",
            "recommendation": "Use password with at least 8 characters"
        })

    # Check JWT secret
    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if not jwt_secret:
        issues.append({
            "severity": "HIGH",
            "category": "Authentication",
            "issue": "JWT_SECRET_KEY not set",
            "recommendation": "Set JWT_SECRET_KEY with a secure random string (64+ chars)"
        })
    elif len(jwt_secret) < 32:
        issues.append({
            "severity": "HIGH",
            "category": "Authentication",
            "issue": "JWT_SECRET_KEY too short",
            "recommendation": "Use JWT_SECRET_KEY with at least 32 characters"
        })

    # Check database configuration
    if settings.ENVIRONMENT == "production" and "sqlite" in settings.DATABASE_URL.lower():
        issues.append({
            "severity": "MEDIUM",
            "category": "Database",
            "issue": "SQLite used in production",
            "recommendation": "Use PostgreSQL for production deployments"
        })

    # Check debug mode
    if settings.DEBUG and settings.ENVIRONMENT == "production":
        issues.append({
            "severity": "HIGH",
            "category": "Configuration",
            "issue": "Debug mode enabled in production",
            "recommendation": "Set DEBUG=false for production"
        })

    # Check CORS origins
    if "*" in settings.CORS_ORIGINS:
        issues.append({
            "severity": "HIGH",
            "category": "CORS",
            "issue": "Wildcard CORS origin detected",
            "recommendation": "Specify exact allowed origins instead of using '*'"
        })

    return issues

def audit_file_permissions() -> List[Dict[str, Any]]:
    """Audit file permissions for security issues."""
    issues = []
    
    # Check for sensitive files with loose permissions
    sensitive_files = [
        ".env",
        ".env.production", 
        ".env.local",
        "config.py",
        "secrets.py"
    ]
    
    for filename in sensitive_files:
        filepath = Path(filename)
        if filepath.exists():
            # Check if file is readable by others (on Unix systems)
            try:
                stat = filepath.stat()
                # Check if file has world-readable permissions (mode & 0o004)
                if stat.st_mode & 0o004:
                    issues.append({
                        "severity": "MEDIUM",
                        "category": "File Permissions",
                        "issue": f"{filename} is world-readable",
                        "recommendation": f"Change permissions: chmod 600 {filename}"
                    })
            except OSError:
                # Permission check not possible on this system
                pass
    
    return issues

def audit_dependencies() -> List[Dict[str, Any]]:
    """Audit dependencies for known security vulnerabilities."""
    issues = []
    
    # Check for requirements.txt
    requirements_file = Path("requirements.txt")
    if requirements_file.exists():
        with open(requirements_file, 'r') as f:
            requirements = f.read()
            
        # Check for potentially vulnerable packages (examples)
        vulnerable_patterns = [
            ("django<", "3.2", "Django versions < 3.2 have known security issues"),
            ("flask<", "2.0", "Flask versions < 2.0 have known security issues"),
            ("pillow<", "8.3", "Pillow versions < 8.3 have known security issues"),
        ]
        
        for pattern, min_version, message in vulnerable_patterns:
            if pattern in requirements.lower():
                issues.append({
                    "severity": "MEDIUM",
                    "category": "Dependencies",
                    "issue": f"Potentially vulnerable dependency detected",
                    "recommendation": f"Update to {min_version}+: {message}"
                })
    
    return issues

def audit_code_practices() -> List[Dict[str, Any]]:
    """Audit code for security best practices."""
    issues = []
    
    # Check for hardcoded secrets in Python files (exclude venv and third-party)
    code_files = []
    for py_file in Path(".").rglob("*.py"):
        # Skip virtual environment, third-party packages, and test files
        if not any(part in str(py_file) for part in ["venv", "site-packages", "__pycache__", ".git"]):
            code_files.append(py_file)
    
    secret_patterns = [
        "password = \"",
        "secret = \"", 
        "api_key = \"",
        "token = \"",
        "passwd = \"",
    ]
    
    for filepath in code_files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read().lower()
                
            for pattern in secret_patterns:
                if pattern in content and "example" not in content and "test" not in content:
                    # Check if it's not just a variable assignment to None or empty string
                    if f'{pattern}""' not in content and f"{pattern}''" not in content:
                        issues.append({
                            "severity": "HIGH",
                            "category": "Code Security",
                            "issue": f"Potential hardcoded secret in {filepath}",
                            "recommendation": "Move secrets to environment variables"
                        })
                        break  # Only report once per file
        except (UnicodeDecodeError, PermissionError):
            continue
    
    return issues

def generate_secure_config() -> Dict[str, str]:
    """Generate secure configuration values."""
    return {
        "JWT_SECRET_KEY": secrets.token_urlsafe(64),
        "ADMIN_PASSWORD": secrets.token_urlsafe(16),
        "SESSION_SECRET": secrets.token_urlsafe(32),
    }

def print_audit_results(all_issues: List[Dict[str, Any]]):
    """Print formatted audit results."""
    if not all_issues:
        print("🎉 Security audit passed! No issues found.")
        return
    
    # Group issues by severity
    critical = [i for i in all_issues if i["severity"] == "CRITICAL"]
    high = [i for i in all_issues if i["severity"] == "HIGH"]
    medium = [i for i in all_issues if i["severity"] == "MEDIUM"]
    
    print("\n🔒 LFA Legacy GO Security Audit Results")
    print("=" * 50)
    
    if critical:
        print(f"\n🚨 CRITICAL Issues ({len(critical)}):")
        for issue in critical:
            print(f"  • {issue['category']}: {issue['issue']}")
            print(f"    Recommendation: {issue['recommendation']}\n")
    
    if high:
        print(f"\n⚠️  HIGH Issues ({len(high)}):")
        for issue in high:
            print(f"  • {issue['category']}: {issue['issue']}")
            print(f"    Recommendation: {issue['recommendation']}\n")
    
    if medium:
        print(f"\n📋 MEDIUM Issues ({len(medium)}):")
        for issue in medium:
            print(f"  • {issue['category']}: {issue['issue']}")
            print(f"    Recommendation: {issue['recommendation']}\n")
    
    # Summary
    print(f"📊 Summary: {len(critical)} critical, {len(high)} high, {len(medium)} medium")
    
    if critical:
        print("\n❌ CRITICAL issues must be resolved before production deployment!")
        return False
    elif high:
        print("\n⚠️  HIGH priority issues should be resolved soon.")
        return False
    else:
        print("\n✅ No critical or high priority issues found.")
        return True

def main():
    """Run complete security audit."""
    print("🔍 Running LFA Legacy GO Security Audit...")
    
    # Run all audit checks
    all_issues = []
    all_issues.extend(audit_environment_variables())
    all_issues.extend(audit_file_permissions())
    all_issues.extend(audit_dependencies())
    all_issues.extend(audit_code_practices())
    
    # Print results
    passed = print_audit_results(all_issues)
    
    # Generate secure config if requested
    if "--generate-config" in sys.argv:
        print("\n🔑 Generated Secure Configuration:")
        secure_config = generate_secure_config()
        for key, value in secure_config.items():
            print(f"export {key}='{value}'")
    
    # Exit with appropriate code
    sys.exit(0 if passed else 1)

if __name__ == "__main__":
    main()