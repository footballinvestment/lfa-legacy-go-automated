#!/usr/bin/env python3

import asyncio
import sys
import os
sys.path.append('/Users/lovas.zoltan/Seafile/Football Investment/Projects/GanballGames/lfa-legacy-go/backend')

from backend.app.services.password_security import PasswordSecurityService

async def test_password_validation():
    """Test NIST 2024 password validation"""
    service = PasswordSecurityService()
    
    # Test cases
    test_cases = [
        ("weak", "Weak password (should fail)"),
        ("password123", "Short password (should fail)"),
        ("ThisIsAVerySecurePassword2024", "Strong password (should pass)"),
        ("MyExcellentPasswordForTesting!", "Excellent password (should pass)")
    ]
    
    print("🔐 Testing NIST 2024 Password Validation")
    print("=" * 50)
    
    for password, description in test_cases:
        print(f"\n🧪 Testing: {description}")
        print(f"Password: '{password}'")
        
        try:
            result = await service.validate_password_strength(password)
            print(f"✅ Valid: {result['valid']}")
            print(f"Score: {result['score']}/4")
            print(f"Strength: {result['strength_level']}")
            print(f"Breached: {result['is_breached']}")
            if result['feedback']:
                print(f"Feedback: {', '.join(result['feedback'])}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Test password hashing
    print("\n🔒 Testing Password Hashing")
    print("=" * 30)
    
    test_password = "TestPassword123!"
    hashed = service.hash_password(test_password)
    print(f"Password: {test_password}")
    print(f"Hash: {hashed[:50]}...")
    
    # Test verification
    is_valid = service.verify_password(test_password, hashed)
    is_invalid = service.verify_password("wrong_password", hashed)
    
    print(f"✅ Correct password verification: {is_valid}")
    print(f"❌ Wrong password verification: {is_invalid}")

if __name__ == "__main__":
    asyncio.run(test_password_validation())