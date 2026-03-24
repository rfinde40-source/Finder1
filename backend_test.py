#!/usr/bin/env python3
"""
Backend API Testing for Finde R Room Rental Marketplace
Tests all core APIs including health, seed, rooms, and OTP authentication
"""

import requests
import sys
import json
from datetime import datetime

class FindeRAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.test_otp = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', response.text)
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except requests.exceptions.RequestException as e:
            error_msg = f"Request failed: {str(e)}"
            self.log_test(name, False, error_msg)
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_seed_data(self):
        """Test seed data endpoint"""
        success, response = self.run_test(
            "Seed Data",
            "POST", 
            "api/seed",
            200
        )
        if success and 'rooms_count' in response:
            print(f"   Seeded {response.get('rooms_count', 0)} rooms")
        return success

    def test_get_rooms(self):
        """Test get rooms listing"""
        success, response = self.run_test(
            "Get Rooms Listing",
            "GET",
            "api/rooms",
            200
        )
        if success and 'rooms' in response:
            print(f"   Found {len(response['rooms'])} rooms")
            print(f"   Total: {response.get('total', 0)}")
        return success, response

    def test_send_otp(self):
        """Test OTP send flow"""
        test_phone = "+91 9876543210"
        success, response = self.run_test(
            "Send OTP",
            "POST",
            "api/auth/send-otp",
            200,
            data={"phone": test_phone}
        )
        if success and 'otp_for_testing' in response:
            self.test_otp = response['otp_for_testing']
            print(f"   Test OTP: {self.test_otp}")
        return success

    def test_verify_otp(self):
        """Test OTP verify flow"""
        if not self.test_otp:
            self.log_test("Verify OTP", False, "No OTP available from send-otp test")
            return False
            
        test_phone = "+91 9876543210"
        success, response = self.run_test(
            "Verify OTP",
            "POST",
            "api/auth/verify-otp",
            200,
            data={"phone": test_phone, "otp": self.test_otp}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   User authenticated: {response.get('user', {}).get('phone')}")
            print(f"   Is new user: {response.get('is_new_user', False)}")
        return success

    def test_get_room_details(self, room_id=None):
        """Test get room details"""
        if not room_id:
            # First get a room ID from rooms listing
            success, rooms_data = self.test_get_rooms()
            if not success or not rooms_data.get('rooms'):
                self.log_test("Get Room Details", False, "No rooms available to test")
                return False
            room_id = rooms_data['rooms'][0]['id']
        
        success, response = self.run_test(
            "Get Room Details",
            "GET",
            f"api/rooms/{room_id}",
            200
        )
        if success and 'room' in response:
            room = response['room']
            print(f"   Room: {room.get('title', 'Unknown')}")
            print(f"   Price: ₹{room.get('price', 0)}")
            print(f"   Location: {room.get('location', {}).get('city', 'Unknown')}")
        return success

    def test_authenticated_endpoints(self):
        """Test endpoints that require authentication"""
        if not self.token:
            print("\n⚠️  Skipping authenticated endpoint tests - no token available")
            return
        
        print("\n🔐 Testing authenticated endpoints...")
        
        # Test get user profile
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            f"api/auth/me?token={self.token}",
            200
        )
        
        # Test get favorites
        success, response = self.run_test(
            "Get Favorites",
            "GET",
            f"api/favorites?token={self.token}",
            200
        )
        
        # Test get bookings
        success, response = self.run_test(
            "Get Bookings",
            "GET",
            f"api/bookings?token={self.token}",
            200
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Finde R API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 50)
        
        # Core API tests
        self.test_health_check()
        self.test_seed_data()
        
        # Room listing tests
        self.test_get_rooms()
        self.test_get_room_details()
        
        # Authentication flow tests
        self.test_send_otp()
        self.test_verify_otp()
        
        # Authenticated endpoint tests
        self.test_authenticated_endpoints()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

    def get_test_report(self):
        """Get detailed test report"""
        return {
            "summary": f"Backend API testing completed - {self.tests_passed}/{self.tests_run} tests passed",
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": round((self.tests_passed/self.tests_run*100), 1) if self.tests_run > 0 else 0,
            "test_results": self.test_results,
            "timestamp": datetime.now().isoformat()
        }

def main():
    """Main test execution"""
    tester = FindeRAPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save test report
        report = tester.get_test_report()
        with open('/app/test_reports/backend_test_results.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())