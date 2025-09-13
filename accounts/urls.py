from django.urls import path
from .views import (
    RegisterView, 
    UserProfileView, 
    UserListView,
    check_auth, 
    ChangePasswordView,
    login_view,
    verify_email,
    resend_verification,
    verification_status
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', login_view, name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('check/', check_auth, name='check_auth'),
    
    # 邮箱验证相关端点
    path('verify-email/<str:token>/', verify_email, name='verify_email'),
    path('resend-verification/', resend_verification, name='resend_verification'),
    path('verification-status/', verification_status, name='verification_status'),
]
