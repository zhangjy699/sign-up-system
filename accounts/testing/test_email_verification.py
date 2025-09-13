#!/usr/bin/env python3
"""
邮箱验证功能测试脚本
测试新增的邮箱验证API端点
"""

import requests
import json
import time
import random
import string
from typing import Dict, Optional, Any
import re

class EmailVerificationTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.session = requests.Session()
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.test_user_data: Dict[str, Any] = {}
        self.verification_token: Optional[str] = None
        
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
            'username': f'emailtest_{timestamp}_{random_suffix}',
            'email': f'emailtest_{timestamp}_{random_suffix}@example.com',
            'password': 'TestPassword123!',
            'password2': 'TestPassword123!',
            'first_name': 'Email',
            'last_name': 'Test',
            'sid': f'567{timestamp[-5:]}',
            'program': 'QFIN',
            'year': 'Year 3',
            'phone': '+1234567890',
            'bio': 'Testing email verification functionality'
        }
    
    def test_api_health(self) -> bool:
        """测试API服务是否可用"""
        try:
            response = self.session.get(f"{self.api_base}/auth/check/")
            if response.status_code in [200, 401]:
                self.log_test("API Health Check", "PASS", f"API服务正常运行")
                return True
            else:
                self.log_test("API Health Check", "FAIL", f"状态码: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Health Check", "FAIL", f"连接错误: {str(e)}")
            return False
    
    def test_user_registration_with_email(self) -> bool:
        """测试用户注册（包含邮箱验证）"""
        self.test_user_data = self.generate_test_data()
        
        try:
            response = self.session.post(
                f"{self.api_base}/auth/register/",
                json=self.test_user_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                data = response.json()
                
                # 检查响应中的必要字段
                required_fields = ['user', 'tokens', 'message', 'email_sent']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("注册（含邮箱验证）", "FAIL", 
                                f"响应缺少字段: {missing_fields}")
                    return False
                
                # 保存tokens
                self.access_token = data['tokens']['access']
                self.refresh_token = data['tokens']['refresh']
                
                # 保存当前用户的验证令牌（从用户数据中获取）
                user = data['user']
                if hasattr(user, 'verification_token'):
                    self.verification_token = user['verification_token']
                else:
                    # 如果没有直接返回，从验证状态接口获取
                    try:
                        status_response = self.session.get(
                            f"{self.api_base}/auth/verification-status/",
                            headers=self.get_headers()
                        )
                        if status_response.status_code == 200:
                            status_data = status_response.json()
                            # 这里我们无法直接获取token，需要从邮件中提取
                            pass
                    except:
                        pass
                
                # 检查用户验证状态
                if user.get('is_verified', True):  # 应该是False
                    self.log_test("注册（含邮箱验证）", "FAIL", 
                                "新注册用户不应该已验证")
                    return False
                
                self.log_test("注册（含邮箱验证）", "PASS", 
                            f"用户: {user['username']}, "
                            f"已验证: {user['is_verified']}, "
                            f"邮件发送: {data['email_sent']}")
                return True
            else:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = json.dumps(error_json, indent=2, ensure_ascii=False)
                except:
                    pass
                self.log_test("注册（含邮箱验证）", "FAIL", 
                            f"状态码: {response.status_code}, 错误: {error_detail}")
                return False
                
        except Exception as e:
            self.log_test("注册（含邮箱验证）", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def test_verification_status(self) -> bool:
        """测试验证状态检查"""
        if not self.access_token:
            self.log_test("验证状态检查", "FAIL", "没有访问令牌")
            return False
        
        try:
            response = self.session.get(
                f"{self.api_base}/auth/verification-status/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['is_verified', 'email', 'has_verification_token', 'username']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("验证状态检查", "PASS", 
                                f"已验证: {data['is_verified']}, "
                                f"有令牌: {data['has_verification_token']}")
                    return True
                else:
                    self.log_test("验证状态检查", "FAIL", 
                                f"响应缺少字段: {missing_fields}")
                    return False
            else:
                self.log_test("验证状态检查", "FAIL", 
                            f"状态码: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("验证状态检查", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def test_resend_verification(self) -> bool:
        """测试重新发送验证邮件"""
        if not self.access_token:
            self.log_test("重发验证邮件", "FAIL", "没有访问令牌")
            return False
        
        try:
            response = self.session.post(
                f"{self.api_base}/auth/resend-verification/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 'EMAIL_SENT':
                    self.log_test("重发验证邮件", "PASS", 
                                f"消息: {data.get('message')}")
                    return True
                else:
                    self.log_test("重发验证邮件", "FAIL", 
                                f"意外响应: {data}")
                    return False
            elif response.status_code == 429:
                # 频率限制是正常的
                self.log_test("重发验证邮件", "PASS", 
                            "频率限制正常工作")
                return True
            else:
                self.log_test("重发验证邮件", "FAIL", 
                            f"状态码: {response.status_code}, 响应: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("重发验证邮件", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def extract_verification_token_from_console(self) -> Optional[str]:
        """
        从控制台输出中提取验证令牌
        注意：这需要用户手动从Django控制台输出中复制令牌
        """
        print("📧 邮件已发送到控制台！")
        print("请查看Django服务器的控制台输出，找到验证邮件内容。")
        print("验证链接格式类似: http://localhost:3000/verify-email/[TOKEN]")
        print()
        print("💡 提示：从终端输出中复制最新的验证令牌")
        print("   例如：FbWjrFtO1ua4hBWweo711mm7CaZ7CfYJ")
        print()
        
        while True:
            token = input("请输入验证令牌（从邮件链接中提取，或输入'skip'跳过）: ").strip()
            
            if token.lower() == 'skip':
                return None
            
            if len(token) == 32 and token.isalnum():
                return token
            
            print("❌ 令牌格式不正确，应该是32位字母数字组合。请重试。")
            print("   请确保从邮件链接中正确提取令牌部分")
    
    def test_email_verification(self, token: str) -> bool:
        """测试邮箱验证"""
        try:
            # 测试GET请求（从邮件链接访问）
            response = self.session.get(
                f"{self.api_base}/auth/verify-email/{token}/"
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 'VERIFICATION_SUCCESS':
                    self.log_test("邮箱验证", "PASS", 
                                f"验证成功: {data.get('message')}")
                    return True
                elif data.get('code') == 'ALREADY_VERIFIED':
                    self.log_test("邮箱验证", "PASS", 
                                "邮箱已经验证过了")
                    return True
                else:
                    self.log_test("邮箱验证", "FAIL", 
                                f"意外响应: {data}")
                    return False
            else:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = json.dumps(error_json, indent=2, ensure_ascii=False)
                except:
                    pass
                self.log_test("邮箱验证", "FAIL", 
                            f"状态码: {response.status_code}, 错误: {error_detail}")
                return False
                
        except Exception as e:
            self.log_test("邮箱验证", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def test_invalid_verification_token(self) -> bool:
        """测试无效验证令牌"""
        invalid_token = "invalidtoken12345678901234567890"
        
        try:
            response = self.session.get(
                f"{self.api_base}/auth/verify-email/{invalid_token}/"
            )
            
            if response.status_code == 400:
                data = response.json()
                if data.get('code') == 'INVALID_TOKEN':
                    self.log_test("无效令牌处理", "PASS", 
                                "正确识别无效令牌")
                    return True
                else:
                    self.log_test("无效令牌处理", "FAIL", 
                                f"错误代码不正确: {data.get('code')}")
                    return False
            else:
                self.log_test("无效令牌处理", "FAIL", 
                            f"状态码错误: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("无效令牌处理", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def test_verification_status_after_verification(self) -> bool:
        """测试验证后的状态"""
        if not self.access_token:
            self.log_test("验证后状态检查", "FAIL", "没有访问令牌")
            return False
        
        # 等待一下让数据库更新
        import time
        time.sleep(1)
        
        try:
            response = self.session.get(
                f"{self.api_base}/auth/verification-status/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   调试信息: 验证状态响应 = {data}")
                
                if data.get('is_verified', False):
                    self.log_test("验证后状态检查", "PASS", 
                                "用户状态已更新为已验证")
                    return True
                else:
                    # 尝试重新获取用户信息
                    profile_response = self.session.get(
                        f"{self.api_base}/auth/profile/",
                        headers=self.get_headers()
                    )
                    if profile_response.status_code == 200:
                        profile_data = profile_response.json()
                        print(f"   调试信息: 用户资料响应 = {profile_data}")
                        if profile_data.get('is_verified', False):
                            self.log_test("验证后状态检查", "PASS", 
                                        "用户状态已更新为已验证（通过profile接口）")
                            return True
                    
                    self.log_test("验证后状态检查", "FAIL", 
                                f"用户状态未更新。当前状态: {data}")
                    return False
            else:
                self.log_test("验证后状态检查", "FAIL", 
                            f"状态码: {response.status_code}, 响应: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("验证后状态检查", "FAIL", f"请求异常: {str(e)}")
            return False
    
    def run_all_tests(self):
        """运行所有邮箱验证测试"""
        print("🚀 开始邮箱验证功能测试")
        print("=" * 50)
        
        test_results = []
        
        # 基础测试
        tests_phase1 = [
            ("API服务健康检查", self.test_api_health),
            ("注册（含邮箱验证）", self.test_user_registration_with_email),
            ("验证状态检查", self.test_verification_status),
            ("重发验证邮件", self.test_resend_verification),
            ("无效令牌处理", self.test_invalid_verification_token),
        ]
        
        for test_name, test_func in tests_phase1:
            try:
                result = test_func()
                test_results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name}: 测试执行异常 - {str(e)}")
                test_results.append((test_name, False))
        
        # 邮箱验证测试（需要手动输入令牌）
        print("=" * 50)
        print("🔍 邮箱验证测试")
        print("=" * 50)
        
        # 首先尝试从当前用户获取验证令牌
        verification_token = None
        if self.access_token:
            try:
                # 尝试从验证状态获取令牌信息
                status_response = self.session.get(
                    f"{self.api_base}/auth/verification-status/",
                    headers=self.get_headers()
                )
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    if status_data.get('has_verification_token', False):
                        print("✅ 检测到当前用户有验证令牌")
                        print("💡 请从Django控制台输出中复制最新的验证令牌")
                        verification_token = self.extract_verification_token_from_console()
                    else:
                        print("⚠️  当前用户没有验证令牌，跳过验证测试")
            except Exception as e:
                print(f"⚠️  无法获取验证状态: {e}")
                verification_token = self.extract_verification_token_from_console()
        else:
            verification_token = self.extract_verification_token_from_console()
        
        if verification_token:
            verification_tests = [
                ("邮箱验证", lambda: self.test_email_verification(verification_token)),
                ("验证后状态检查", self.test_verification_status_after_verification),
            ]
            
            for test_name, test_func in verification_tests:
                try:
                    result = test_func()
                    test_results.append((test_name, result))
                except Exception as e:
                    print(f"❌ {test_name}: 测试执行异常 - {str(e)}")
                    test_results.append((test_name, False))
        else:
            print("⚠️  跳过邮箱验证测试")
            test_results.append(("邮箱验证", None))
            test_results.append(("验证后状态检查", None))
        
        # 测试总结
        print("=" * 50)
        print("📊 测试总结")
        print("=" * 50)
        
        passed = sum(1 for _, result in test_results if result is True)
        failed = sum(1 for _, result in test_results if result is False)
        skipped = sum(1 for _, result in test_results if result is None)
        total = len(test_results)
        
        for test_name, result in test_results:
            if result is True:
                status = "✅ PASS"
            elif result is False:
                status = "❌ FAIL"
            else:
                status = "⏭️  SKIP"
            print(f"{status} {test_name}")
        
        print(f"\n🎯 测试结果: {passed} 通过, {failed} 失败, {skipped} 跳过 (总计 {total})")
        
        if failed == 0:
            print("🎉 邮箱验证功能测试完成！")
        else:
            print("⚠️  有测试失败，请检查实现")
        
        return failed == 0

def main():
    """主函数"""
    print("📧 邮箱验证功能测试工具")
    print("测试目标: Django后端邮箱验证API")
    print()
    
    # 创建测试实例
    tester = EmailVerificationTester()
    
    # 运行所有测试
    success = tester.run_all_tests()
    
    print("\n📝 测试说明:")
    print("1. 邮件当前配置为输出到控制台（开发模式）")
    print("2. 生产环境需要配置真实的SMTP服务器")
    print("3. 验证链接24小时后过期")
    print("4. 重发验证邮件有5分钟频率限制")
    
    if success:
        exit(0)
    else:
        exit(1)

if __name__ == "__main__":
    main()
