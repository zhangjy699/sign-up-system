from rest_framework import serializers
from django.utils import timezone
from .models import Availability, Booking, Notification, Feedback, HELP_TYPE_CHOICES
from accounts.serializers import UserListSerializer
from accounts.models import User

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile information (for profile exchange)"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'sid', 
                 'program', 'year', 'phone', 'bio', 'is_tutor', 'is_student')

class AvailabilitySerializer(serializers.ModelSerializer):
    tutor = UserListSerializer(read_only=True)
    help_type_display = serializers.CharField(source='get_help_type_display', read_only=True)
    is_available = serializers.SerializerMethodField()
    
    class Meta:
        model = Availability
        fields = ('id', 'tutor', 'help_type', 'help_type_display', 'start_time', 'end_time', 
                 'description', 'max_students', 'is_booked', 'is_active', 
                 'is_available', 'created_at', 'updated_at')
        read_only_fields = ('is_booked', 'created_at', 'updated_at')

    def get_is_available(self, obj):
        return obj.is_active and not obj.is_booked and obj.start_time > timezone.now()

    def validate(self, data):
        # For partial updates, start_time and end_time might not be present
        start_time = data.get('start_time', self.instance.start_time if self.instance else None)
        end_time = data.get('end_time', self.instance.end_time if self.instance else None)

        if start_time and end_time:
            if start_time >= end_time:
                raise serializers.ValidationError("End time must be after start time.")
            if start_time <= timezone.now() and not getattr(self.instance, '_is_validating_for_past', False):
                raise serializers.ValidationError("Start time must be in the future.")
        return data

class AvailabilityCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ('help_type', 'start_time', 'end_time', 'description', 'max_students')

    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if start_time and end_time:
            if start_time >= end_time:
                raise serializers.ValidationError("End time must be after start time.")
            if start_time <= timezone.now() and not getattr(self, '_is_validating_for_past', False):
                raise serializers.ValidationError("Start time must be in the future.")
        return data

class BookingSerializer(serializers.ModelSerializer):
    student = UserListSerializer(read_only=True)
    tutor = UserListSerializer(read_only=True)
    availability = AvailabilitySerializer(read_only=True)
    availability_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Booking
        fields = ('id', 'student', 'tutor', 'availability', 'availability_id',
                 'status', 'notes', 'student_attended', 'tutor_confirmed',
                 'student_notes', 'tutor_notes', 'rating', 'profile_exchanged',
                 'created_at', 'updated_at')
        read_only_fields = ('student', 'tutor', 'created_at', 'updated_at')

class BookingCreateSerializer(serializers.ModelSerializer):
    availability_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Booking
        fields = ('availability_id', 'notes')

    def validate_availability_id(self, value):
        try:
            availability = Availability.objects.get(id=value)
            if availability.is_booked:
                raise serializers.ValidationError("This availability is already booked.")
            if not availability.is_active:
                raise serializers.ValidationError("This availability is not active.")
            if availability.start_time <= timezone.now():
                raise serializers.ValidationError("This availability has already passed.")
        except Availability.DoesNotExist:
            raise serializers.ValidationError("Availability not found.")
        return value

class BookingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ('status', 'notes', 'student_attended', 'tutor_confirmed',
                 'student_notes', 'tutor_notes', 'rating')

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'notification_type', 'title', 'message', 
                 'is_read', 'booking', 'created_at')
        read_only_fields = ('created_at',)

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ('id', 'student_rating', 'tutor_rating', 'student_comment', 
                 'tutor_comment', 'created_at')
        read_only_fields = ('created_at',)

    def validate_student_rating(self, value):
        if value and (value < 1 or value > 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_tutor_rating(self, value):
        if value and (value < 1 or value > 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

# Help type choices for frontend
class HelpTypeSerializer(serializers.Serializer):
    """Serializer for help type choices"""
    value = serializers.CharField()
    label = serializers.CharField()

# Calendar event for frontend display
class CalendarEventSerializer(serializers.Serializer):
    """Serializer for calendar events"""
    id = serializers.IntegerField()
    title = serializers.CharField()
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()
    allDay = serializers.BooleanField(default=False)
    color = serializers.CharField()
    extendedProps = serializers.DictField()