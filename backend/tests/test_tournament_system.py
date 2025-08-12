#!/usr/bin/env python3
"""
LFA Legacy GO - Tournament System Test Suite
Comprehensive testing for tournament functionality
"""

import requests
import json
from datetime import datetime, timedelta
import time
import random

# API Configuration
API_BASE = "http://localhost:8000"
TEST_USER = {
    "username": "testuser",
    "password": "testpass123",
    "email": "test@lfago.com",
    "full_name": "Test User"
}

class TournamentSystemTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.test_tournament_id = None
        self.test_location_id = None
        self.test_participants = []
    
    def print_header(self, title):
        print(f"\n{'='*80}")
        print(f"🏆 {title}")
        print(f"{'='*80}")
    
    def print_step(self, step, description):
        print(f"\n{step}. {description}")
    
    def print_success(self, message):
        print(f"✅ {message}")
    
    def print_error(self, message):
        print(f"❌ {message}")
    
    def print_info(self, message):
        print(f"ℹ️  {message}")
    
    def setup_test_environment(self):
        """Setup test environment and users"""
        self.print_step("1", "Setting up test environment")
        
        # Login as admin user
        try:
            response = self.session.post(
                f"{API_BASE}/api/auth/login",
                data={
                    "username": TEST_USER["username"],
                    "password": TEST_USER["password"]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.user_id = data["user"]["id"]
                self.session.headers.update({
                    "Authorization": f"Bearer {self.token}"
                })
                self.print_success(f"Logged in as admin user (ID: {self.user_id})")
                self.print_info(f"Credits: {data['user']['credits']}")
            else:
                self.print_error(f"Login failed: {response.status_code}")
                return False
        except Exception as e:
            self.print_error(f"Login error: {str(e)}")
            return False
        
        # Ensure user is admin
        try:
            response = self.session.post(f"{API_BASE}/api/auth/make-admin", params={"username": TEST_USER["username"]})
            if response.status_code == 200:
                self.print_success("User is admin")
            else:
                self.print_info("User already admin or admin setup skipped")
        except:
            pass
        
        # Initialize location data
        try:
            response = self.session.post(f"{API_BASE}/api/locations/admin/init-data")
            if response.status_code == 200:
                self.print_success("Location data initialized")
            else:
                self.print_info("Location data already exists")
        except:
            pass
        
        # Get test location
        try:
            response = self.session.get(f"{API_BASE}/api/locations")
            if response.status_code == 200:
                locations = response.json()
                if locations:
                    self.test_location_id = locations[0]["id"]