from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta

# Fixed help types that tutors can offer
HELP_TYPE_CHOICES = [
    ('course_tutoring', 'Course Tutoring'),
    ('case_competition', 'Case Competition Preparation'),
    ('profile_coaching', 'Profile Coaching Sessions'),
    ('market_news', 'Market News Sharing'),
    ('fina_chat', 'FINA Free Chat'),
    ('course_selection', 'Course Selection'),
    ('books_sharing', 'Books Sharing'),
    ('internship_sharing', 'Internship Sharing'),
]

class Availability(models.Model):
    tutor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='availabilities')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    help_type = models.CharField(max_length=30, choices=HELP_TYPE_CHOICES)
    description = models.TextField(blank=True)
    max_students = models.PositiveIntegerField(default=1)
    is_booked = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']
        verbose_name_plural = 'Availabilities'

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError('End time must be after start time.')
        # Allow past availabilities if explicitly set for testing/historical data (by setting _is_validating_for_past=True on the instance)
        if self.start_time <= timezone.now() and not getattr(self, '_is_validating_for_past', False):
            raise ValidationError('Start time must be in the future.')

    def save(self, *args, **kwargs):
        # Temporarily set _is_validating_for_past if passed as a keyword argument
        is_validating_for_past = kwargs.pop('_is_validating_for_past', False)
        if is_validating_for_past:
            self._is_validating_for_past = True

        self.clean()
        super().save(*args, **kwargs)
        
        # Clean up the temporary flag after saving
        if is_validating_for_past and hasattr(self, '_is_validating_for_past'):
            del self._is_validating_for_past

    @property
    def is_past_due(self):
        return self.end_time <= timezone.now()

    def __str__(self):
        help_type_display = dict(HELP_TYPE_CHOICES)[self.help_type]
        return f"{self.tutor.username} - {help_type_display} ({self.start_time.strftime('%Y-%m-%d %H:%M')})"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]
    
    availability = models.OneToOneField(Availability, on_delete=models.CASCADE, related_name='booking')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings_as_student')
    tutor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings_as_tutor')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    student_attended = models.BooleanField(default=False)
    tutor_confirmed = models.BooleanField(default=False)
    student_notes = models.TextField(blank=True)  # Notes from student after session
    tutor_notes = models.TextField(blank=True)    # Notes from tutor after session
    rating = models.PositiveIntegerField(blank=True, null=True)  # 1-5 rating
    # Profile exchange - both parties can see each other's profile after confirmation
    profile_exchanged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def clean(self):
        if self.student == self.tutor:
            raise ValidationError('Student and tutor cannot be the same person.')
        if self.availability.tutor != self.tutor:
            raise ValidationError('Tutor must match the availability tutor.')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        help_type_display = dict(HELP_TYPE_CHOICES)[self.availability.help_type]
        return f"{self.student.username} -> {self.tutor.username} ({help_type_display})"

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('booking_created', 'Booking Created'),
        ('booking_confirmed', 'Booking Confirmed'),
        ('booking_cancelled', 'Booking Cancelled'),
        ('booking_reminder', 'Booking Reminder'),
        ('availability_created', 'Availability Created'),
        ('system', 'System Notification'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, blank=True, null=True, related_name='notifications')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"

class Feedback(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='feedback')
    student_rating = models.PositiveIntegerField(blank=True, null=True)  # 1-5 rating from student
    tutor_rating = models.PositiveIntegerField(blank=True, null=True)    # 1-5 rating from tutor
    student_comment = models.TextField(blank=True)
    tutor_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.student_rating and (self.student_rating < 1 or self.student_rating > 5):
            raise ValidationError('Student rating must be between 1 and 5.')
        if self.tutor_rating and (self.tutor_rating < 1 or self.tutor_rating > 5):
            raise ValidationError('Tutor rating must be between 1 and 5.')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Feedback for {self.booking}"
