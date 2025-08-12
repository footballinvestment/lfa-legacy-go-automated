#!/usr/bin/env python3
"""
LFA Legacy GO - Credit System Test Script
Tests all credit purchase functionality including packages, payments, and transactions
"""

import requests
import json
from datetime import datetime
import time

# Configuration
BASE_URL = "http://localhost:8001"
TEST_USER = {
    "username": "testuser", 
    "password": "testpass123"
}

class CreditSystemTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.user_info = None
        
    def print_header(self, title):
        print(f"\n{'='*60}")
        print(f"🧪 {title}")
        print(f"{'='*60}")
        
    def print_step(self, step, description):
        print(f"\n{step}. {description}")
        
    def print_success(self, message):
        print(f"✅ {message}")
        
    def print_error(self, message):
        print(f"❌ {message}")
        
    def print_info(self, message):
        print(f"ℹ️  {message}")

    def login(self):
        """Login and get JWT token"""
        self.print_step("1", "Bejelentkezés és token megszerzése")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                data={
                    "username": TEST_USER["username"],
                    "password": TEST_USER["password"]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.print_success(f"Sikeres bejelentkezés!")
                self.print_info(f"Token: {self.token[:50]}...")
                return True
            else:
                self.print_error(f"Bejelentkezés sikertelen: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_error(f"Hiba a bejelentkezés során: {str(e)}")
            return False

    def get_headers(self):
        """Get authentication headers"""
        return {"Authorization": f"Bearer {self.token}"}

    def test_credit_packages(self):
        """Test credit packages endpoint"""
        self.print_step("2", "Credit csomagok lekérése")
        
        try:
            response = requests.get(f"{self.base_url}/api/credits/packages")
            
            if response.status_code == 200:
                packages = response.json()
                self.print_success(f"Sikeres csomag lekérés!")
                self.print_info(f"Talált csomagok: {len(packages)}")
                
                for package in packages:
                    print(f"  📦 {package['name']}")
                    print(f"     💎 {package['credits']} credit + {package['bonus_credits']} bónusz")
                    print(f"     💰 {package['price_huf']} HUF / {package['price_eur']} EUR")
                    if package['popular']:
                        print(f"     ⭐ NÉPSZERŰ CSOMAG")
                
                return packages
            else:
                self.print_error(f"Csomag lekérés sikertelen: {response.status_code}")
                return None
                
        except Exception as e:
            self.print_error(f"Hiba a csomagok lekérése során: {str(e)}")
            return None

    def test_payment_methods(self):
        """Test payment methods endpoint"""
        self.print_step("3", "Fizetési módok lekérése")
        
        try:
            response = requests.get(f"{self.base_url}/api/credits/payment-methods")
            
            if response.status_code == 200:
                methods = response.json()
                self.print_success(f"Sikeres fizetési mód lekérés!")
                self.print_info(f"Elérhető módok: {len(methods)}")
                
                for method in methods:
                    fee_percent = method['processing_fee'] * 100
                    print(f"  {method['icon']} {method['name']} - Díj: {fee_percent:.1f}%")
                
                return methods
            else:
                self.print_error(f"Fizetési mód lekérés sikertelen: {response.status_code}")
                return None
                
        except Exception as e:
            self.print_error(f"Hiba a fizetési módok lekérése során: {str(e)}")
            return None

    def get_current_balance(self):
        """Get current credit balance"""
        self.print_step("4", "Jelenlegi credit egyenleg ellenőrzése")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/credits/balance",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                balance_info = response.json()
                self.print_success("Egyenleg sikeresen lekérve!")
                
                print(f"  👤 Felhasználó: {balance_info['username']}")
                print(f"  💎 Jelenlegi egyenleg: {balance_info['current_balance']} credit")
                print(f"  🛒 Összesen vásárolt: {balance_info['total_purchased']} credit")
                print(f"  🎁 Bónusz credits: {balance_info['total_bonus_earned']} credit")
                print(f"  💰 Összesen költött: {balance_info['total_spent_huf']} HUF")
                print(f"  📊 Tranzakciók száma: {balance_info['transactions_count']}")
                
                return balance_info
            else:
                self.print_error(f"Egyenleg lekérés sikertelen: {response.status_code}")
                return None
                
        except Exception as e:
            self.print_error(f"Hiba az egyenleg lekérése során: {str(e)}")
            return None

    def test_credit_purchase(self, package_id="starter", payment_method="card"):
        """Test credit purchase"""
        self.print_step("5", f"Credit vásárlás tesztelése ({package_id} csomag)")
        
        try:
            # Get current balance first
            balance_before = self.get_current_balance()
            if not balance_before:
                return False
                
            credits_before = balance_before['current_balance']
            
            # Make purchase
            purchase_data = {
                "package_id": package_id,
                "payment_method": payment_method,
                "currency": "HUF"
            }
            
            self.print_info(f"Vásárlási kérés: {purchase_data}")
            
            response = requests.post(
                f"{self.base_url}/api/credits/purchase",
                json=purchase_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                transaction = response.json()
                self.print_success("Sikeres credit vásárlás!")
                
                print(f"  🧾 Tranzakció ID: {transaction['transaction_id']}")
                print(f"  📦 Csomag: {transaction['package_name']}")
                print(f"  💎 Vásárolt credits: {transaction['credits_purchased']}")
                print(f"  🎁 Bónusz credits: {transaction['bonus_credits']}")
                print(f"  ✨ Összesen hozzáadva: {transaction['total_credits_added']}")
                print(f"  💰 Fizetett összeg: {transaction['amount_paid']} {transaction['currency']}")
                print(f"  💳 Fizetési mód: {transaction['payment_method']}")
                print(f"  📊 Új egyenleg: {transaction['new_credit_balance']} credit")
                
                # Verify balance change
                credits_after = transaction['new_credit_balance']
                credits_added = credits_after - credits_before
                expected_credits = transaction['total_credits_added']
                
                if credits_added == expected_credits:
                    self.print_success(f"Credit egyenleg helyesen frissítve! (+{credits_added})")
                else:
                    self.print_error(f"Credit egyenleg hiba! Várt: +{expected_credits}, Kapott: +{credits_added}")
                
                return transaction
            else:
                error_detail = response.json().get('detail', 'Ismeretlen hiba')
                self.print_error(f"Vásárlás sikertelen ({response.status_code}): {error_detail}")
                return None
                
        except Exception as e:
            self.print_error(f"Hiba a vásárlás során: {str(e)}")
            return None

    def test_transaction_history(self):
        """Test transaction history"""
        self.print_step("6", "Tranzakciós történet lekérése")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/credits/history?limit=10",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                history = response.json()
                self.print_success(f"Tranzakciós történet sikeresen lekérve!")
                self.print_info(f"Talált tranzakciók: {len(history)}")
                
                for i, transaction in enumerate(history, 1):
                    print(f"\n  #{i} {transaction['transaction_id']}")
                    print(f"     📦 {transaction['package_name']}")
                    print(f"     💎 {transaction['credits_purchased']} + {transaction['bonus_credits']} bónusz")
                    print(f"     💰 {transaction['amount_paid']} {transaction['currency']}")
                    print(f"     📅 {transaction['created_at']}")
                    print(f"     ✅ Státusz: {transaction['status']}")
                
                return history
            else:
                self.print_error(f"Történet lekérés sikertelen: {response.status_code}")
                return None
                
        except Exception as e:
            self.print_error(f"Hiba a történet lekérése során: {str(e)}")
            return None

    def test_multiple_purchases(self):
        """Test multiple different purchases"""
        self.print_step("7", "Több különböző vásárlás tesztelése")
        
        test_purchases = [
            {"package_id": "value", "payment_method": "paypal"},
            {"package_id": "premium", "payment_method": "apple_pay"},
        ]
        
        successful_purchases = 0
        
        for i, purchase in enumerate(test_purchases, 1):
            self.print_info(f"Vásárlás #{i}: {purchase['package_id']} csomag, {purchase['payment_method']}")
            
            # Small delay between purchases
            time.sleep(1)
            
            result = self.test_credit_purchase(
                package_id=purchase["package_id"],
                payment_method=purchase["payment_method"]
            )
            
            if result:
                successful_purchases += 1
                self.print_success(f"Vásárlás #{i} sikeres!")
            else:
                self.print_error(f"Vásárlás #{i} sikertelen!")
        
        self.print_info(f"Sikeres vásárlások: {successful_purchases}/{len(test_purchases)}")
        return successful_purchases == len(test_purchases)

    def run_complete_test(self):
        """Run complete credit system test"""
        self.print_header("LFA Legacy GO - Credit System Complete Test")
        
        # Step 1: Login
        if not self.login():
            self.print_error("Teszt megszakítva - bejelentkezés sikertelen")
            return False
        
        # Step 2: Test credit packages
        packages = self.test_credit_packages()
        if not packages:
            self.print_error("Teszt megszakítva - csomagok lekérése sikertelen")
            return False
        
        # Step 3: Test payment methods
        methods = self.test_payment_methods()
        if not methods:
            self.print_error("Teszt megszakítva - fizetési módok lekérése sikertelen")
            return False
        
        # Step 4: Get initial balance
        initial_balance = self.get_current_balance()
        if initial_balance is None:
            self.print_error("Teszt megszakítva - egyenleg lekérése sikertelen")
            return False
        
        # Step 5: Test single purchase
        first_purchase = self.test_credit_purchase("starter", "card")
        if not first_purchase:
            self.print_error("Teszt megszakítva - első vásárlás sikertelen")
            return False
        
        # Step 6: Test transaction history
        history = self.test_transaction_history()
        if history is None:
            self.print_error("Teszt megszakítva - történet lekérése sikertelen")
            return False
        
        # Step 7: Test multiple purchases
        multiple_success = self.test_multiple_purchases()
        
        # Final balance check
        self.print_step("8", "Végső egyenleg ellenőrzése")
        final_balance = self.get_current_balance()
        
        if final_balance:
            credits_gained = final_balance['current_balance'] - initial_balance['current_balance']
            self.print_success(f"Összesen szerzett credits: {credits_gained}")
            
        # Test summary
        self.print_header("TESZT ÖSSZEFOGLALÓ")
        
        results = {
            "✅ Bejelentkezés": "SIKERES",
            "✅ Credit csomagok": "SIKERES", 
            "✅ Fizetési módok": "SIKERES",
            "✅ Egyenleg lekérés": "SIKERES",
            "✅ Credit vásárlás": "SIKERES" if first_purchase else "SIKERTELEN",
            "✅ Tranzakció történet": "SIKERES" if history else "SIKERTELEN",
            "✅ Többszörös vásárlás": "SIKERES" if multiple_success else "SIKERTELEN"
        }
        
        for test, result in results.items():
            if "SIKERES" in result:
                self.print_success(f"{test}: {result}")
            else:
                self.print_error(f"{test}: {result}")
        
        all_passed = all("SIKERES" in result for result in results.values())
        
        if all_passed:
            self.print_success("🎉 MINDEN TESZT SIKERES! Credit rendszer 100% működőképes!")
        else:
            self.print_error("⚠️ Néhány teszt sikertelen volt. Ellenőrizd a részleteket.")
        
        return all_passed

def main():
    """Main test function"""
    print("🚀 LFA Legacy GO - Credit System Test Indítása")
    print("📅 Teszt időpont:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("\n⚠️ FONTOS: Győződj meg róla, hogy a backend fut a http://localhost:8000 címen!")
    
    # Wait for user confirmation
    input("\n▶️ Nyomj ENTER-t a teszt indításához...")
    
    # Run tests
    tester = CreditSystemTester()
    success = tester.run_complete_test()
    
    if success:
        print("\n🏆 CREDIT RENDSZER TESZT: TELJES SIKER!")
        print("💰 A credit vásárlási rendszer production-ready!")
    else:
        print("\n❌ CREDIT RENDSZER TESZT: RÉSZLEGES SIKER")
        print("🔧 Néhány funkció további fejlesztést igényel.")

if __name__ == "__main__":
    main()