"""
this file is used to customize the user admin with student information
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'sid', 'program', 'year', 'is_verified', 'is_staff')
    list_filter = ('program', 'year', 'is_verified', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'sid', 'first_name', 'last_name')
    ordering = ('username',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Student Information', {
            'fields': ('sid', 'program', 'year', 'phone', 'bio')
        }),
        ('Help Preferences', {
            'fields': ('offered_help', 'seeking_help')
        }),
        ('Profile', {
            'fields': ('profile_image',)
        }),
        ('Verification', {
            'fields': ('is_verified', 'verification_token')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Student Information', {
            'fields': ('email', 'first_name', 'last_name', 'sid', 'program', 'year', 'phone')
        }),
    )
