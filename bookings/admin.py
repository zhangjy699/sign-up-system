from django.contrib import admin
from .models import Availability, Booking, Notification, Feedback

@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ('tutor', 'help_type', 'start_time', 'end_time', 'is_booked', 'is_active')
    list_filter = ('is_booked', 'is_active', 'help_type')
    search_fields = ('tutor__username', 'help_type', 'description')
    ordering = ('-start_time',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('student', 'tutor', 'availability', 'status', 'created_at')
    list_filter = ('status', 'student_attended', 'tutor_confirmed', 'created_at')
    search_fields = ('student__username', 'tutor__username', 'availability__help_type')
    ordering = ('-created_at',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'title', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'title', 'message')
    ordering = ('-created_at',)

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('booking', 'student_rating', 'tutor_rating', 'created_at')
    list_filter = ('student_rating', 'tutor_rating', 'created_at')
    search_fields = ('booking__student__username', 'booking__tutor__username')
    ordering = ('-created_at',)
