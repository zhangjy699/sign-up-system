from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractUser):
    objects = UserManager()
    PROGRAM_CHOICES = [
        ('FINA', 'FINA'),
        ('QFIN', 'QFIN'),
    ]
    
    YEAR_CHOICES = [
        ('Year 1', 'Year 1'),
        ('Year 2', 'Year 2'),
        ('Year 3', 'Year 3'),
        ('Year 4', 'Year 4'),
    ]
    
    sid = models.CharField(max_length=8, unique=True, verbose_name='Student ID')
    program = models.CharField(max_length=10, choices=PROGRAM_CHOICES)
    year = models.CharField(max_length=15, choices=YEAR_CHOICES)
    phone = models.CharField(max_length=15, blank=True)
    bio = models.TextField(blank=True, verbose_name='Brief Introduction')
    
    # Fields for what kind of help they can offer/seek
    offered_help = models.JSONField(default=list, blank=True)  # Store categories and subjects
    seeking_help = models.JSONField(default=list, blank=True)
    
    # Verification status
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.sid})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def is_tutor(self):
        """Check if user offers any help (is a tutor)"""
        return len(self.offered_help) > 0
    
    @property
    def is_student(self):
        """Check if user seeks any help (is a student)"""
        return len(self.seeking_help) > 0
