"""
utils that verify email address
"""
import secrets
import string
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def generate_verification_token():
    """生成32位随机验证令牌"""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))

def send_verification_email(user, token):
    """
    发送验证邮件
    """
    # 构建验证URL
    if hasattr(settings, 'FRONTEND_URL') and settings.FRONTEND_URL:
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}"
    else:
        # 如果没有配置前端URL，使用后端API
        verification_url = f"{settings.BACKEND_URL or 'http://localhost:8000'}/api/auth/verify-email/{token}/"
    
    subject = 'FIN/QFIN tutoring platform - email verification'
    
    # HTML邮件模板
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container {{
                max-width: 600px;
                margin: 0 auto;
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }}
            .content {{
                padding: 30px;
                background: #f9f9f9;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }}
            .footer {{
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
                background: #f0f0f0;
                border-radius: 0 0 8px 8px;
            }}
            .warning {{
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎓 FIN/QFIN 学习互助平台</h1>
                <p>邮箱验证确认</p>
            </div>
            
            <div class="content">
                <h2>亲爱的 {user.first_name} {user.last_name}，</h2>
                
                <p>欢迎加入FIN/QFIN学习互助平台！</p>
                
                <p>您的账户信息：</p>
                <ul>
                    <li><strong>用户名：</strong>{user.username}</li>
                    <li><strong>学号：</strong>{user.sid}</li>
                    <li><strong>专业：</strong>{user.program}</li>
                    <li><strong>年级：</strong>{user.year}</li>
                </ul>
                
                <p>请点击下方按钮验证您的邮箱地址：</p>
                
                <div style="text-align: center;">
                    <a href="{verification_url}" class="button">验证我的邮箱</a>
                </div>
                
                <p>或者复制以下链接到浏览器中打开：</p>
                <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 3px;">
                    {verification_url}
                </p>
                
                <div class="warning">
                    <p><strong>⚠️ 重要提醒：</strong></p>
                    <ul>
                        <li>此验证链接将在24小时后过期</li>
                        <li>如果您没有注册此账户，请忽略此邮件</li>
                        <li>验证完成后，您将能够使用平台的所有功能</li>
                    </ul>
                </div>
                
                <p>如有任何问题，请联系我们的支持团队。</p>
                
                <p>祝您学习愉快！<br>
                FIN/QFIN团队</p>
            </div>
            
            <div class="footer">
                <p>此邮件由系统自动发送，请勿直接回复。</p>
                <p>© 2025 FIN/QFIN 学习互助平台</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # 纯文本版本（作为备选）
    plain_message = f"""
    亲爱的 {user.first_name} {user.last_name}，
    
    欢迎加入FIN/QFIN学习互助平台！
    
    您的账户信息：
    - 用户名：{user.username}
    - 学号：{user.sid}
    - 专业：{user.program}
    - 年级：{user.year}
    
    请点击以下链接验证您的邮箱地址：
    {verification_url}
    
    重要提醒：
    - 此验证链接将在24小时后过期
    - 如果您没有注册此账户，请忽略此邮件
    - 验证完成后，您将能够使用平台的所有功能
    
    如有任何问题，请联系我们的支持团队。
    
    祝您学习愉快！
    FIN/QFIN团队
    
    ---
    此邮件由系统自动发送，请勿直接回复。
    © 2025 FIN/QFIN 学习互助平台
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@finqfin.com'),
            recipient_list=[user.email],
            fail_silently=False,
            html_message=html_message,
        )
        return True
    except Exception as e:
        print(f"发送验证邮件失败: {e}")
        return False

def send_welcome_email(user):
    """
    发送欢迎邮件（验证成功后）
    """
    subject = 'FIN/QFIN 学习互助平台 - 欢迎您！'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container {{
                max-width: 600px;
                margin: 0 auto;
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .header {{
                background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }}
            .content {{
                padding: 30px;
                background: #f9f9f9;
            }}
            .feature {{
                background: white;
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
                border-left: 4px solid #667eea;
            }}
            .footer {{
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
                background: #f0f0f0;
                border-radius: 0 0 8px 8px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 验证成功！</h1>
                <p>欢迎来到FIN/QFIN学习互助平台</p>
            </div>
            
            <div class="content">
                <h2>恭喜您，{user.first_name}！</h2>
                
                <p>您的邮箱已成功验证，现在可以使用平台的所有功能了！</p>
                
                <h3>🚀 您现在可以：</h3>
                
                <div class="feature">
                    <h4>📚 寻找学习帮助</h4>
                    <p>浏览其他同学提供的课程辅导和学习资源</p>
                </div>
                
                <div class="feature">
                    <h4>🎓 提供学习帮助</h4>
                    <p>分享您的知识，帮助其他同学学习</p>
                </div>
                
                <div class="feature">
                    <h4>📅 预约学习时间</h4>
                    <p>与其他同学安排学习会话和辅导时间</p>
                </div>
                
                <div class="feature">
                    <h4>💬 互动交流</h4>
                    <p>与同专业同学交流学习心得和经验</p>
                </div>
                
                <p><strong>下一步：</strong></p>
                <ol>
                    <li>完善您的个人资料</li>
                    <li>设置您可以提供的帮助类型</li>
                    <li>浏览可用的学习资源</li>
                    <li>开始您的学习互助之旅！</li>
                </ol>
                
                <p>如有任何问题或建议，欢迎随时联系我们。</p>
                
                <p>祝您在平台上学习愉快，收获满满！</p>
                
                <p>最好的祝愿，<br>
                FIN/QFIN团队</p>
            </div>
            
            <div class="footer">
                <p>© 2025 FIN/QFIN 学习互助平台</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    恭喜您，{user.first_name}！
    
    您的邮箱已成功验证，现在可以使用FIN/QFIN学习互助平台的所有功能了！
    
    您现在可以：
    - 📚 寻找学习帮助
    - 🎓 提供学习帮助  
    - 📅 预约学习时间
    - 💬 互动交流
    
    下一步：
    1. 完善您的个人资料
    2. 设置您可以提供的帮助类型
    3. 浏览可用的学习资源
    4. 开始您的学习互助之旅！
    
    祝您在平台上学习愉快，收获满满！
    
    最好的祝愿，
    FIN/QFIN团队
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@finqfin.com'),
            recipient_list=[user.email],
            fail_silently=False,
            html_message=html_message,
        )
        return True
    except Exception as e:
        print(f"发送欢迎邮件失败: {e}")
        return False
