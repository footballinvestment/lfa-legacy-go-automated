#!/usr/bin/env python3

import asyncio
import aiohttp
import hashlib
import argon2
import re
from typing import Dict

class PasswordSecurityService:
    def __init__(self):
        self.argon2_hasher = argon2.PasswordHasher(
            memory_cost=19456,
            time_cost=2,
            parallelism=1,
            hash_len=32
        )
    
    async def validate_password_strength(self, password: str) -> Dict:
        result = {
            "valid": False,
            "score": 0,
            "feedback": [],
            "is_breached": False,
            "strength_level": "weak"
        }
        
        if len(password) < 12:
            result["feedback"].append("Password must be at least 12 characters long")
            return result
        
        try:
            result["is_breached"] = await self.check_password_breached(password)
            if result["is_breached"]:
                result["feedback"].append("Password found in data breach database - please choose a different password")
                return result
        except Exception as e:
            print(f"Breach check failed: {e}")
        
        if len(password) >= 20:
            result["score"] = 4
            result["strength_level"] = "excellent"
        elif len(password) >= 16:
            result["score"] = 3
            result["strength_level"] = "strong"
        elif len(password) >= 12:
            result["score"] = 2
            result["strength_level"] = "good"
        
        if self._has_common_patterns(password):
            result["feedback"].append("Consider avoiding common patterns like repeated characters or keyboard sequences")
        
        result["valid"] = True
        return result
    
    async def check_password_breached(self, password: str) -> bool:
        sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"https://api.pwnedpasswords.com/range/{prefix}") as response:
                    if response.status == 200:
                        hashes = await response.text()
                        return suffix in hashes
            except Exception as e:
                print(f"Breach database check failed: {e}")
                return False
        
        return False
    
    def _has_common_patterns(self, password: str) -> bool:
        if re.search(r'(.)\1{2,}', password):
            return True
        
        keyboard_sequences = ['123456', 'qwerty', 'asdfgh', 'zxcvbn']
        for seq in keyboard_sequences:
            if seq in password.lower():
                return True
        
        return False
    
    def hash_password(self, password: str) -> str:
        return self.argon2_hasher.hash(password)
    
    def verify_password(self, password: str, hash_str: str) -> bool:
        try:
            self.argon2_hasher.verify(hash_str, password)
            return True
        except argon2.exceptions.VerifyMismatchError:
            return False

async def test_password_validation():
    """Test NIST 2024 password validation"""
    service = PasswordSecurityService()
    
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