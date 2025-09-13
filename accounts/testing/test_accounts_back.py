#!/usr/bin/env python3
"""
纯后端API测试脚本 - Accounts应用
专门测试Django后端API，不涉及前端逻辑
"""

import requests
import json
import time
import random
import string
from typing import Dict, Optional, Any

class AccountsAPITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.session = requests.Session()
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.test_user_data: Dict[str, Any] = {}
        
    def get_headers(self) -> Dict[str, str]:
        """获取请求头，包含认证信息"""
        headers = {'Content-Type': 'application/json'}
        if self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        return headers
    
    def log_test(self, test_name: str, status: str, details: str = ""):
        """记录测试结果"""
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {test_name}: {status}")
        if details:
            print(f"   {details}")
        print()
    
    def generate_test_data(self) -> Dict[str, Any]:
        """生成测试用户数据"""
        timestamp = str(int(time.time()))[-6:]
        random_suffix = ''.join(random.choices(string.ascii_lowercase, k=3))
        
        return {
            'username': f'testuser_{timestamp}_{random_suffix}',
            'email': f'test_{timestamp}_{random_suffix}@example.com',
            'password': 'TestPassword123!',
            'password2': 'TestPassword123!',
            'first_name': 'Test',
            'last_name': 'User',
            'sid': f'123{timestamp[-5:]}',  # 确保8位以内
            'program': 'FINA',
            'year': 'Year 2',
            'phone': '+1234567890',
            'offered_help': [
                {
                    "category": "Course Tutoring",
                    "subjects": ["FINA3102", "FINA2203"]
                }
            ],
            'seeking_help': [
                {
                    "category": "Course Tutoring", 
                    "subjects": ["FINA3303"]
                }
            ]
        }
    
    def test_api_health(self) -> bool:
        """测试API服务是否可用"""
        try:
            response = self.session.get(f"{self.api_base}/auth/check/")
            if response.status_code in [200, 401]:  # 401也表示API正常，只是未认证
                self.log_test("API Health Check", "PASS", f"API服务正常运行")
                return True
            else:
                self.log_test("API Health Check", "FAIL", f"状态码: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Health Check", "FAIL", f"连接错误: {str(e)}")
            return False
    
    def test_user_registration(self) -> bool:
        """测试用户注册"""
        self.test_user_data = self.generate_test_data()
        
        try:
            response = self.session.post(
                f"{self.api_base}/auth/register/",
                json=self.test_user_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                data = response.json()
                if 'tokens' in data and 'user' in data:
                    self.access_token = data['tokens']['access']
                    self.refresh_token = data['tokens']['refresh']
                    self.log_test("用户注册", "PASS", 
                                f"用户: {data['user']['username']}, "
                                f"SID: {data['user']['sid']}")
                    return True
                else:
                    self.log_test("用户注册", "FAIL", "响应格式错误，缺少tokens或user")
                    return False
            else:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = json.dumps(error_json, indent=2, ensure_ascii=False)
                except:
                    pass
                self.log_test("用户注册", "FAIL", 
                            f"状态码: {response.status_code}, 错误: {error_detail}")
                return False
                
        except Exception as e:
            self.log_test("用户注册", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def test_user_login(self) -> bool:
        """测试用户登录"""
        if not self.test_user_data:
            self.log_test("用户登录", "FAIL", "没有测试用户数据")
            return False
        
        login_data = {
            'username': self.test_user_data['username'],
            'password': self.test_user_data['password']
        }
        
        try:
            response = self.session.post(
                f"{self.api_base}/auth/login/",
                json=login_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'tokens' in data:
                    # 更新token（测试token刷新）
                    old_token = self.access_token
                    self.access_token = data['tokens']['access']
                    self.refresh_token = data['tokens']['refresh']
                    self.log_test("用户登录", "PASS", 
                                f"用户: {data['user']['username']}, "
                                f"Token已更新")
                    return True
                else:
                    self.log_test("用户登录", "FAIL", "响应中缺少tokens")
                    return False
            else:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = json.dumps(error_json, indent=2, ensure_ascii=False)
                except:
                    pass
                self.log_test("用户登录", "FAIL", 
                            f"状态码: {response.status_code}, 错误: {error_detail}")
                return False
                
        except Exception as e:
            self.log_test("用户登录", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def test_get_profile(self) -> bool:
        """测试获取用户资料"""
        if not self.access_token:
            self.log_test("获取用户资料", "FAIL", "没有访问令牌")
            return False
        
        try:
            response = self.session.get(
                f"{self.api_base}/auth/profile/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'username', 'email', 'first_name', 'last_name', 'sid']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("获取用户资料", "PASS", 
                                f"用户ID: {data['id']}, "
                                f"用户名: {data['username']}, "
                                f"邮箱: {data['email']}")
                    return True
                else:
                    self.log_test("获取用户资料", "FAIL", 
                                f"响应缺少字段: {missing_fields}")
                    return False
            else:
                self.log_test("获取用户资料", "FAIL", 
                            f"状态码: {response.status_code}, 响应: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("获取用户资料", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def test_update_profile(self) -> bool:
        """测试更新用户资料"""
        if not self.access_token:
            self.log_test("更新用户资料", "FAIL", "没有访问令牌")
            return False
        
        update_data = {
            'first_name': 'UpdatedFirst',
            'last_name': 'UpdatedLast',
            'program': 'QFIN',  # 添加必需字段
            'year': 'Year 3',   # 添加必需字段
            'phone': '+9876543210',
            'bio': 'Updated bio for testing',
            'offered_help': [
                {
                    "category": "Course Tutoring",
                    "subjects": ["FINA3102", "FINA2203", "FINA3303"]
                }
            ]
        }
        
        try:
            response = self.session.put(
                f"{self.api_base}/auth/profile/",
                json=update_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if (data.get('first_name') == 'UpdatedFirst' and 
                    data.get('last_name') == 'UpdatedLast'):
                    self.log_test("更新用户资料", "PASS", 
                                f"姓名已更新: {data['first_name']} {data['last_name']}")
                    return True
                else:
                    self.log_test("更新用户资料", "FAIL", "更新的数据未正确保存")
                    return False
            else:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = json.dumps(error_json, indent=2, ensure_ascii=False)
                except:
                    pass
                self.log_test("更新用户资料", "FAIL", 
                            f"状态码: {response.status_code}, 错误: {error_detail}")
                return False
                
        except Exception as e:
            self.log_test("更新用户资料", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def test_get_users_list(self) -> bool:
        """测试获取用户列表"""
        if not self.access_token:
            self.log_test("获取用户列表", "FAIL", "没有访问令牌")
            return False
        
        try:
            response = self.session.get(
                f"{self.api_base}/auth/users/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("获取用户列表", "PASS", 
                                f"获取到 {len(data)} 个用户")
                    return True
                elif isinstance(data, dict) and 'results' in data:
                    # 分页响应
                    users = data['results']
                    self.log_test("获取用户列表", "PASS", 
                                f"获取到 {len(users)} 个用户 (分页)")
                    return True
                else:
                    self.log_test("获取用户列表", "FAIL", "响应格式错误或无用户数据")
                    return False
            else:
                self.log_test("获取用户列表", "FAIL", 
                            f"状态码: {response.status_code}, 响应: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("获取用户列表", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def test_users_filtering(self) -> bool:
        """测试用户列表过滤功能"""
        if not self.access_token:
            self.log_test("用户列表过滤", "FAIL", "没有访问令牌")
            return False
        
        test_filters = [
            {'program': 'FINA'},
            {'year': 'Year 2'},
            {'help_type': 'tutor'},
            {'program': 'FINA', 'year': 'Year 2'}
        ]
        
        all_passed = True
        
        for filter_params in test_filters:
            try:
                response = self.session.get(
                    f"{self.api_base}/auth/users/",
                    params=filter_params,
                    headers=self.get_headers()
                )
                
                if response.status_code == 200:
                    data = response.json()
                    users = data if isinstance(data, list) else data.get('results', [])
                    filter_str = ', '.join([f"{k}={v}" for k, v in filter_params.items()])
                    self.log_test("用户列表过滤", "PASS", 
                                f"过滤条件: {filter_str}, 结果: {len(users)} 个用户")
                else:
                    filter_str = ', '.join([f"{k}={v}" for k, v in filter_params.items()])
                    self.log_test("用户列表过滤", "FAIL", 
                                f"过滤条件: {filter_str}, 状态码: {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                filter_str = ', '.join([f"{k}={v}" for k, v in filter_params.items()])
                self.log_test("用户列表过滤", "FAIL", 
                            f"过滤条件: {filter_str}, 异常: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_change_password(self) -> bool:
        """测试修改密码"""
        if not self.access_token:
            self.log_test("修改密码", "FAIL", "没有访问令牌")
            return False
        
        new_password = "NewTestPassword456!"
        password_data = {
            'old_password': self.test_user_data['password'],
            'new_password': new_password,
            'new_password2': new_password
        }
        
        try:
            response = self.session.post(
                f"{self.api_base}/auth/change-password/",
                json=password_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                # 更新测试数据中的密码
                self.test_user_data['password'] = new_password
                self.log_test("修改密码", "PASS", "密码修改成功")
                return True
            else:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = json.dumps(error_json, indent=2, ensure_ascii=False)
                except:
                    pass
                self.log_test("修改密码", "FAIL", 
                            f"状态码: {response.status_code}, 错误: {error_detail}")
                return False
                
        except Exception as e:
            self.log_test("修改密码", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def test_check_auth(self) -> bool:
        """测试认证状态检查"""
        if not self.access_token:
            self.log_test("认证状态检查", "FAIL", "没有访问令牌")
            return False
        
        try:
            response = self.session.get(
                f"{self.api_base}/auth/check/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('authenticated') is True and 'user' in data:
                    self.log_test("认证状态检查", "PASS", 
                                f"用户已认证: {data['user']['username']}")
                    return True
                else:
                    self.log_test("认证状态检查", "FAIL", "响应格式错误")
                    return False
            else:
                self.log_test("认证状态检查", "FAIL", 
                            f"状态码: {response.status_code}, 响应: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("认证状态检查", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def test_invalid_requests(self) -> bool:
        """测试无效请求的处理"""
        test_cases = [
            {
                'name': '无效登录凭据',
                'endpoint': '/auth/login/',
                'method': 'POST',
                'data': {'username': 'invalid', 'password': 'invalid'},
                'expected_status': 401
            },
            {
                'name': '未认证访问受保护资源',
                'endpoint': '/auth/profile/',
                'method': 'GET',
                'data': None,
                'expected_status': 401,
                'use_auth': False
            },
            {
                'name': '注册重复用户名',
                'endpoint': '/auth/register/',
                'method': 'POST',
                'data': {
                    'username': self.test_user_data['username'],  # 重复用户名
                    'email': 'new@example.com',
                    'password': 'TestPassword123!',
                    'password2': 'TestPassword123!',
                    'first_name': 'Test',
                    'last_name': 'User',
                    'sid': '87654321',
                    'program': 'QFIN',
                    'year': 'Year 1'
                },
                'expected_status': 400
            }
        ]
        
        all_passed = True
        
        for case in test_cases:
            try:
                headers = self.get_headers() if case.get('use_auth', True) else {'Content-Type': 'application/json'}
                
                if case['method'] == 'POST':
                    response = self.session.post(
                        f"{self.api_base}{case['endpoint']}",
                        json=case['data'],
                        headers=headers
                    )
                else:
                    response = self.session.get(
                        f"{self.api_base}{case['endpoint']}",
                        headers=headers
                    )
                
                if response.status_code == case['expected_status']:
                    self.log_test("无效请求处理", "PASS", 
                                f"{case['name']}: 正确返回 {response.status_code}")
                else:
                    self.log_test("无效请求处理", "FAIL", 
                                f"{case['name']}: 期望 {case['expected_status']}, 实际 {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test("无效请求处理", "FAIL", 
                            f"{case['name']}: 异常 {str(e)}")
                all_passed = False
        
        return all_passed
    
    def run_all_tests(self):
        """运行所有测试"""
        print("🚀 开始Accounts API纯后端测试")
        print("=" * 50)
        
        test_results = []
        
        # 测试列表
        tests = [
            ("API服务健康检查", self.test_api_health),
            ("用户注册", self.test_user_registration),
            ("用户登录", self.test_user_login),
            ("获取用户资料", self.test_get_profile),
            ("更新用户资料", self.test_update_profile),
            ("获取用户列表", self.test_get_users_list),
            ("用户列表过滤", self.test_users_filtering),
            ("修改密码", self.test_change_password),
            ("认证状态检查", self.test_check_auth),
            ("无效请求处理", self.test_invalid_requests),
        ]
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                test_results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name}: 测试执行异常 - {str(e)}")
                test_results.append((test_name, False))
        
        # 测试总结
        print("=" * 50)
        print("📊 测试总结")
        print("=" * 50)
        
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\n🎯 测试结果: {passed}/{total} 通过")
        
        if passed == total:
            print("🎉 所有测试通过！你的Accounts API工作正常！")
        else:
            print("⚠️  有测试失败，请检查后端实现")
        
        return passed == total

def main():
    """主函数"""
    print("Accounts API 纯后端测试工具")
    print("测试目标: Django后端API (不涉及前端)")
    print()
    
    # 创建测试实例
    tester = AccountsAPITester()
    
    # 运行所有测试
    success = tester.run_all_tests()
    
    if success:
        exit(0)
    else:
        exit(1)

if __name__ == "__main__":
    main()
