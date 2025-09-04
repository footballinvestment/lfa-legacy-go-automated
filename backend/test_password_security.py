#!/usr/bin/env python3
"""
Test script for password security implementation
Run this to verify Phase 1 is working correctly
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.services.password_security import PasswordSecurityService

async def test_password_security():
    print("🔐 Testing Password Security Implementation")
    print("=" * 50)
    
    service = PasswordSecurityService()
    
    # Test 1: Weak password rejection
    print("\n📝 Test 1: Weak password validation")
    weak_result = await service.validate_password_strength("123456")
    print(f"Weak password valid: {weak_result['valid']} (should be False)")
    print(f"Feedback: {weak_result['feedback']}")
    
    # Test 2: Strong password acceptance
    print("\n✅ Test 2: Strong password validation")
    strong_result = await service.validate_password_strength("ThisIsAVerySecurePassword2024!")
    print(f"Strong password valid: {strong_result['valid']} (should be True)")
    print(f"Strength level: {strong_result['strength_level']}")
    print(f"Score: {strong_result['score']}")
    
    # Test 3: NIST length requirement
    print("\n📏 Test 3: NIST 12-character minimum")
    medium_result = await service.validate_password_strength("GoodPass2024")
    print(f"12-char password valid: {medium_result['valid']} (should be True)")
    print(f"Strength: {medium_result['strength_level']}")
    
    # Test 4: Breach detection test (common password)
    print("\n🔍 Test 4: Breach detection")
    breached_result = await service.validate_password_strength("password123456")
    print(f"Common password valid: {breached_result['valid']} (should be False)")
    print(f"Is breached: {breached_result['is_breached']}")
    
    print("\n🎯 Phase 1 Password Security Test Complete!")
    
    if (not weak_result['valid'] and 
        strong_result['valid'] and 
        medium_result['valid'] and
        not breached_result['valid']):
        print("✅ ALL TESTS PASSED - Phase 1 Ready!")
        return True
    else:
        print("❌ TESTS FAILED - Fix issues before proceeding")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_password_security())
    sys.exit(0 if result else 1)