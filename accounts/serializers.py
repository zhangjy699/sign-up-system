"""
this file is used to serialize the user model, transform into json format
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2', 
                 'first_name', 'last_name', 'sid', 'program', 'year', 
                 'phone', 'offered_help', 'seeking_help')
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'sid': {'required': True},
            'program': {'required': True},
            'year': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    is_tutor = serializers.ReadOnlyField()
    is_student = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'full_name',
                 'sid', 'program', 'year', 'phone', 
                 'offered_help', 'seeking_help', 
                 'is_verified', 'is_tutor', 'is_student', 'created_at')
        read_only_fields = ('username', 'email', 'sid', 'is_verified', 'created_at')

class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    is_tutor = serializers.ReadOnlyField()
    is_student = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'full_name', 'program', 'year', 
                  'offered_help', 'seeking_help', 
                 'is_tutor', 'is_student')

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct.")
        return value
