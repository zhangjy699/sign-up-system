"""
views.py is for analyzing the user request and response
"""

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta
from .serializers import UserSerializer, UserProfileSerializer, UserListSerializer, ChangePasswordSerializer
from .email_utils import generate_verification_token, send_verification_email, send_welcome_email

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # 生成验证令牌并设置用户为未验证状态
        verification_token = generate_verification_token()
        user.verification_token = verification_token
        user.is_verified = False
        user.save()
        
        # 发送验证邮件
        email_sent = send_verification_email(user, verification_token)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Registration successful! Please check your email to verify your account.',
            'email_sent': email_sent
        }
        
        if not email_sent:
            response_data['warning'] = 'Registration successful, but verification email could not be sent. Please contact support.'
        
        return Response(response_data, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = User.objects.all()
        
        # Filter by program if provided
        program = self.request.query_params.get('program', None)
        if program:
            queryset = queryset.filter(program=program)
        
        # Filter by year if provided
        year = self.request.query_params.get('year', None)
        if year:
            queryset = queryset.filter(year=year)
        
        # Filter by help type if provided
        help_type = self.request.query_params.get('help_type', None)
        if help_type == 'tutor':
            queryset = queryset.filter(offered_help__isnull=False).exclude(offered_help=[])
        elif help_type == 'student':
            queryset = queryset.filter(seeking_help__isnull=False).exclude(seeking_help=[])
        
        return queryset

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_auth(request):
    """Check if user is authenticated"""
    return Response({
        'authenticated': True, 
        'user': UserProfileSerializer(request.user).data
    })

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Custom login view that returns user data with tokens"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
    else:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST', 'GET'])
@permission_classes([permissions.AllowAny])
def verify_email(request, token):
    """
    验证邮箱
    支持POST和GET请求，方便从邮件链接直接访问
    """
    try:
        user = User.objects.get(verification_token=token)
        
        # 检查令牌是否过期 (24小时)
        if user.created_at < timezone.now() - timedelta(hours=24):
            return Response({
                'error': 'Verification token has expired. Please request a new one.',
                'code': 'TOKEN_EXPIRED'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 检查是否已经验证过
        if user.is_verified:
            return Response({
                'message': 'Email is already verified.',
                'code': 'ALREADY_VERIFIED'
            }, status=status.HTTP_200_OK)
        
        # 验证成功
        user.is_verified = True
        user.verification_token = ''  # 清空令牌
        user.save()
        
        # 发送欢迎邮件
        send_welcome_email(user)
        
        return Response({
            'message': 'Email verified successfully! Your account is now active.',
            'code': 'VERIFICATION_SUCCESS',
            'user': {
                'username': user.username,
                'email': user.email,
                'is_verified': user.is_verified
            }
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': 'Invalid verification token.',
            'code': 'INVALID_TOKEN'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resend_verification(request):
    """
    重新发送验证邮件
    """
    user = request.user
    
    if user.is_verified:
        return Response({
            'message': 'Your account is already verified.',
            'code': 'ALREADY_VERIFIED'
        }, status=status.HTTP_200_OK)
    
    # 检查是否频繁请求（防止滥用）
    if hasattr(user, '_last_verification_sent'):
        time_since_last = timezone.now() - user._last_verification_sent
        if time_since_last < timedelta(minutes=5):
            return Response({
                'error': 'Please wait 5 minutes before requesting another verification email.',
                'code': 'TOO_FREQUENT'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    # 生成新的验证令牌
    verification_token = generate_verification_token()
    user.verification_token = verification_token
    user._last_verification_sent = timezone.now()
    user.save()
    
    # 重新发送邮件
    email_sent = send_verification_email(user, verification_token)
    
    if email_sent:
        return Response({
            'message': 'Verification email sent successfully.',
            'code': 'EMAIL_SENT'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Failed to send verification email. Please try again later.',
            'code': 'EMAIL_FAILED'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def verification_status(request):
    """
    检查当前用户的验证状态
    """
    user = request.user
    
    return Response({
        'is_verified': user.is_verified,
        'email': user.email,
        'has_verification_token': bool(user.verification_token),
        'created_at': user.created_at,
        'username': user.username
    }, status=status.HTTP_200_OK)
