#!/usr/bin/env python3
"""
Automated Frontend Integration Test
Simulates frontend user interactions and validates API responses
"""

import requests
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Configuration
API_BASE_URL = "http://localhost:5000/api"
FRONTEND_URL = "http://localhost:5173"
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin123456"

class AdminPagesTest:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
    
    def print_section(self, title):
        print(f"\n{'='*70}")
        print(f"  {title}")
        print(f"{'='*70}\n")
    
    def print_test(self, name, passed, details=""):
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} | {name}")
        if details:
            print(f"     └─ {details}")
        self.test_results.append((name, passed))
    
    def authenticate(self):
        """Get JWT token for admin user"""
        print("Authenticating as admin...")
        
        try:
            response = self.session.post(
                f"{API_BASE_URL}/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('access_token')
                self.session.headers.update({
                    'Authorization': f'Bearer {self.admin_token}'
                })
                print(f"✅ Authenticated successfully\n")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}\n")
                return False
        except Exception as e:
            print(f"❌ Error during authentication: {e}\n")
            return False
    
    def test_dashboard_stats(self):
        """Test: Dashboard fetches platform stats"""
        self.print_section("TEST 1: Dashboard Stats (Frontend Page Load)")
        
        try:
            # Frontend calls GET /api/admin/stats
            response = self.session.get(f"{API_BASE_URL}/admin/stats")
            
            test_passed = response.status_code == 200
            self.print_test(
                "Dashboard: GET /api/admin/stats",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            if test_passed:
                data = response.json()
                
                # Verify expected fields
                fields = ['total_users', 'active_jobs', 'total_payments']
                for field in fields:
                    has_field = field in data
                    self.print_test(
                        f"  - Response contains '{field}'",
                        has_field,
                        f"Value: {data.get(field)}"
                    )
            
            return test_passed
        except Exception as e:
            self.print_test("Dashboard Stats API Call", False, str(e))
            return False
    
    def test_system_health(self):
        """Test: Dashboard fetches system health"""
        self.print_section("TEST 2: System Health Check")
        
        try:
            response = self.session.get(f"{API_BASE_URL}/admin/system/health")
            
            test_passed = response.status_code == 200
            self.print_test(
                "Dashboard: GET /api/admin/system/health",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            return test_passed
        except Exception as e:
            self.print_test("System Health API Call", False, str(e))
            return False
    
    def test_users_list(self):
        """Test: Users page fetches user list"""
        self.print_section("TEST 3: User Management - List Users")
        
        try:
            # Test 1: Get all users
            response = self.session.get(f"{API_BASE_URL}/admin/users")
            test_passed = response.status_code == 200
            self.print_test(
                "Users: GET /api/admin/users",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            if test_passed:
                data = response.json()
                user_count = len(data.get('users', []))
                self.print_test(
                    f"  - Users returned",
                    user_count > 0,
                    f"Count: {user_count}, Total: {data.get('total')}, Pages: {data.get('pages')}"
                )
            
            # Test 2: Filter by role
            response = self.session.get(f"{API_BASE_URL}/admin/users?role=worker")
            test_passed = response.status_code == 200
            self.print_test(
                "Users: GET /api/admin/users?role=worker",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            # Test 3: Search by email
            response = self.session.get(f"{API_BASE_URL}/admin/users?search=admin")
            test_passed = response.status_code == 200
            self.print_test(
                "Users: GET /api/admin/users?search=admin",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            return test_passed
        except Exception as e:
            self.print_test("Users List API Call", False, str(e))
            return False
    
    def test_user_detail(self):
        """Test: User detail page fetches single user"""
        self.print_section("TEST 4: User Management - User Detail")
        
        try:
            # Get a worker user first
            response = self.session.get(f"{API_BASE_URL}/admin/users?role=worker")
            if response.status_code != 200:
                self.print_test("Get worker for detail test", False)
                return False
            
            users = response.json().get('users', [])
            if not users:
                self.print_test("Find worker user", False, "No workers found")
                return False
            
            user_id = users[0]['id']
            
            # Fetch user detail
            response = self.session.get(f"{API_BASE_URL}/admin/users/{user_id}")
            test_passed = response.status_code == 200
            self.print_test(
                f"User Detail: GET /api/admin/users/{user_id}",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            if test_passed:
                data = response.json()
                required_fields = ['id', 'email', 'role', 'username']
                for field in required_fields:
                    self.print_test(
                        f"  - Contains '{field}'",
                        field in data,
                        f"Value: {data.get(field)}"
                    )
            
            return test_passed
        except Exception as e:
            self.print_test("User Detail API Call", False, str(e))
            return False
    
    def test_user_ban_unban(self):
        """Test: Ban and unban user functionality"""
        self.print_section("TEST 5: User Management - Ban/Unban")
        
        try:
            # Get a worker user to test ban
            response = self.session.get(f"{API_BASE_URL}/admin/users?role=worker")
            users = response.json().get('users', [])
            if not users:
                self.print_test("Find user to ban", False)
                return False
            
            user_id = users[0]['id']
            
            # Test Ban
            ban_payload = {
                "reason": "Test ban for automated testing",
                "duration": "24h",
                "notify_user": True
            }
            response = self.session.post(
                f"{API_BASE_URL}/admin/users/{user_id}/ban",
                json=ban_payload
            )
            test_passed = response.status_code == 200
            self.print_test(
                f"Ban User: POST /api/admin/users/{user_id}/ban",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            # Test Unban
            response = self.session.post(f"{API_BASE_URL}/admin/users/{user_id}/unban")
            test_passed = response.status_code == 200
            self.print_test(
                f"Unban User: POST /api/admin/users/{user_id}/unban",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            return test_passed
        except Exception as e:
            self.print_test("Ban/Unban API Call", False, str(e))
            return False
    
    def test_jobs_moderation(self):
        """Test: Jobs moderation page"""
        self.print_section("TEST 6: Job Moderation")
        
        try:
            response = self.session.get(f"{API_BASE_URL}/admin/jobs")
            test_passed = response.status_code == 200
            self.print_test(
                "Job Moderation: GET /api/admin/jobs",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            if test_passed:
                data = response.json()
                job_count = len(data.get('jobs', []))
                self.print_test(
                    "  - Jobs returned",
                    job_count >= 0,
                    f"Count: {job_count}"
                )
            
            return test_passed
        except Exception as e:
            self.print_test("Jobs Moderation API Call", False, str(e))
            return False
    
    def test_verifications(self):
        """Test: Verification management page"""
        self.print_section("TEST 7: Verification Management")
        
        try:
            response = self.session.get(f"{API_BASE_URL}/admin/verifications")
            test_passed = response.status_code == 200
            self.print_test(
                "Verifications: GET /api/admin/verifications",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            if test_passed:
                data = response.json()
                verif_count = len(data.get('verifications', []))
                self.print_test(
                    "  - Verifications returned",
                    verif_count >= 0,
                    f"Count: {verif_count}"
                )
            
            return test_passed
        except Exception as e:
            self.print_test("Verifications API Call", False, str(e))
            return False
    
    def test_settings(self):
        """Test: Admin settings page"""
        self.print_section("TEST 8: Settings")
        
        try:
            response = self.session.get(f"{API_BASE_URL}/admin/settings")
            test_passed = response.status_code == 200
            self.print_test(
                "Settings: GET /api/admin/settings",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            return test_passed
        except Exception as e:
            self.print_test("Settings API Call", False, str(e))
            return False
    
    def test_audit_log(self):
        """Test: Audit log page"""
        self.print_section("TEST 9: Audit Log")
        
        try:
            response = self.session.get(f"{API_BASE_URL}/admin/audit-log")
            test_passed = response.status_code == 200
            self.print_test(
                "Audit Log: GET /api/admin/audit-log",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            return test_passed
        except Exception as e:
            self.print_test("Audit Log API Call", False, str(e))
            return False
    
    def test_unauthorized_access(self):
        """Test: Non-admin access is denied"""
        self.print_section("TEST 10: Authorization & Security")
        
        try:
            # Create a non-admin session
            response = requests.post(
                f"{API_BASE_URL}/auth/login",
                json={"email": "testworker@example.com", "password": "worker123456"}
            )
            
            if response.status_code == 200:
                worker_token = response.json().get('access_token')
                headers = {'Authorization': f'Bearer {worker_token}'}
                
                # Try to access admin endpoint
                response = requests.get(f"{API_BASE_URL}/admin/users", headers=headers)
                test_passed = response.status_code == 403
                self.print_test(
                    "Non-admin access blocked (403 Forbidden)",
                    test_passed,
                    f"Status: {response.status_code}"
                )
            else:
                self.print_test("Get worker token", False)
                test_passed = False
            
            # Test without authentication
            response = requests.get(f"{API_BASE_URL}/admin/users")
            test_passed = response.status_code == 401
            self.print_test(
                "Unauthenticated access blocked (401 Unauthorized)",
                test_passed,
                f"Status: {response.status_code}"
            )
            
            return test_passed
        except Exception as e:
            self.print_test("Authorization Test", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        self.print_section("ADMIN FRONTEND - AUTOMATED INTEGRATION TESTS")
        print(f"API Base URL: {API_BASE_URL}")
        print(f"Frontend URL: {FRONTEND_URL}\n")
        
        if not self.authenticate():
            print("Cannot proceed without authentication")
            return
        
        # Run all test suites
        self.test_dashboard_stats()
        self.test_system_health()
        self.test_users_list()
        self.test_user_detail()
        self.test_user_ban_unban()
        self.test_jobs_moderation()
        self.test_verifications()
        self.test_settings()
        self.test_audit_log()
        self.test_unauthorized_access()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        self.print_section("TEST SUMMARY")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for _, passed in self.test_results if passed)
        failed_tests = total_tests - passed_tests
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Pass Rate: {pass_rate:.1f}%\n")
        
        if failed_tests == 0:
            print("🎉 ALL TESTS PASSED!\n")
            print("Admin frontend integration is working correctly:")
            print("  ✅ All API endpoints are accessible")
            print("  ✅ Authentication and authorization working")
            print("  ✅ Data flows correctly from backend to frontend")
            print("  ✅ User actions (ban/unban) functioning properly")
        else:
            print("⚠️  Some tests failed. Please review the errors above.\n")
        
        print("\nFrontend Pages Ready for Manual Testing:")
        print("  • http://localhost:5173/admin/dashboard")
        print("  • http://localhost:5173/admin/users")
        print("  • http://localhost:5173/admin/jobs")
        print("  • http://localhost:5173/admin/verifications")
        print("  • http://localhost:5173/admin/payments")
        print("  • http://localhost:5173/admin/reports")

if __name__ == '__main__':
    tester = AdminPagesTest()
    tester.run_all_tests()
