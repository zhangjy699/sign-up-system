from rest_framework import generics, permissions, status, serializers, exceptions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters
from django.utils import timezone
from django.db.models import Q
from accounts.models import User
from .models import Availability, Booking, Notification, Feedback, HELP_TYPE_CHOICES
from .serializers import (
    AvailabilitySerializer, AvailabilityCreateSerializer,
    BookingSerializer, BookingCreateSerializer, BookingUpdateSerializer,
    NotificationSerializer, FeedbackSerializer,
    CalendarEventSerializer, HelpTypeSerializer, UserProfileSerializer
)
from accounts.serializers import UserListSerializer

class AvailabilityFilter(filters.FilterSet):
    help_type = filters.ChoiceFilter(choices=HELP_TYPE_CHOICES)
    tutor = filters.NumberFilter(field_name='tutor__id')
    start_time_after = filters.DateTimeFilter(field_name='start_time', lookup_expr='gte')
    start_time_before = filters.DateTimeFilter(field_name='start_time', lookup_expr='lte')
    is_available = filters.BooleanFilter(method='filter_is_available')

    class Meta:
        model = Availability
        fields = ['help_type', 'tutor', 'start_time_after', 'start_time_before', 'is_available']

    def filter_is_available(self, queryset, name, value):
        if value:
            return queryset.filter(
                is_active=True,
                is_booked=False,
                start_time__gt=timezone.now()
            )
        return queryset

class AvailabilityListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = AvailabilityFilter

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AvailabilityCreateSerializer
        return AvailabilitySerializer

    def get_queryset(self):
        return Availability.objects.filter(
            is_active=True,
            start_time__gt=timezone.now()
        ).select_related('tutor')

    def perform_create(self, serializer):
        serializer.save(tutor=self.request.user)

class AvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Allow students to retrieve active and unbooked availabilities
        # Tutors can retrieve all their own availabilities (active or inactive, booked or unbooked)
        if self.request.user.is_authenticated:
            if hasattr(self.request.user, 'is_tutor') and self.request.user.is_tutor:
                return Availability.objects.filter(tutor=self.request.user)
            else:
                return Availability.objects.filter(is_active=True, is_booked=False, start_time__gt=timezone.now())
        return Availability.objects.none()

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.tutor != self.request.user:
            raise exceptions.PermissionDenied("You do not have permission to edit this availability.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.tutor != self.request.user:
            raise exceptions.PermissionDenied("You do not have permission to delete this availability.")
        # Soft delete - just mark as inactive
        instance.is_active = False
        instance.save()

class BookingListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingSerializer

    def get_queryset(self):
        user = self.request.user
        return Booking.objects.filter(
            Q(student=user) | Q(tutor=user)
        ).select_related('student', 'tutor', 'availability')

    def perform_create(self, serializer):
        availability_id = serializer.validated_data['availability_id']
        availability = Availability.objects.get(id=availability_id)
        
        # Check if already booked
        if availability.is_booked:
            raise serializers.ValidationError("This availability is already booked.")
        
        # Create booking
        booking = serializer.save(
            student=self.request.user,
            tutor=availability.tutor,
            availability=availability
        )
        
        # Mark availability as booked
        availability.is_booked = True
        availability.save()
        
        # Create notification for tutor
        Notification.objects.create(
            user=availability.tutor,
            notification_type='booking_created',
            title='New Booking Request',
            message=f"{self.request.user.full_name} has requested a booking for {availability.get_help_type_display()}",
            booking=booking
        )

class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookingUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Booking.objects.filter(
            Q(student=user) | Q(tutor=user)
        ).select_related('student', 'tutor', 'availability')

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return BookingUpdateSerializer
        return BookingSerializer

    def perform_update(self, serializer):
        booking = self.get_object()
        old_status = booking.status
        new_status = serializer.validated_data.get('status', old_status)
        
        # Update booking
        booking = serializer.save()
        
        # Create notifications based on status change
        if old_status != new_status:
            if new_status == 'confirmed':
                # Enable profile exchange when booking is confirmed
                booking.profile_exchanged = True
                booking.save()
                
                Notification.objects.create(
                    user=booking.student,
                    notification_type='booking_confirmed',
                    title='Booking Confirmed',
                    message=f"Your booking for {booking.availability.get_help_type_display()} has been confirmed. You can now view each other's profiles.",
                    booking=booking
                )
            elif new_status == 'cancelled':
                # Notify the other party
                other_user = booking.student if booking.tutor == self.request.user else booking.tutor
                Notification.objects.create(
                    user=other_user,
                    notification_type='booking_cancelled',
                    title='Booking Cancelled',
                    message=f"Your booking for {booking.availability.get_help_type_display()} has been cancelled",
                    booking=booking
                )
                
                # Make availability available again
                booking.availability.is_booked = False
                booking.availability.save()

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_notifications_count(request):
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({'unread_count': count})

class FeedbackCreateView(generics.CreateAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Feedback.objects.all()

    def perform_create(self, serializer):
        booking_id = self.kwargs.get('booking_id')
        try:
            booking = Booking.objects.get(id=booking_id)
            # Check if user is involved in this booking
            if booking.student != self.request.user and booking.tutor != self.request.user:
                raise serializers.ValidationError("You are not authorized to provide feedback for this booking.")
            
            # Check if feedback already exists
            if Feedback.objects.filter(booking=booking).exists():
                raise serializers.ValidationError("Feedback already exists for this booking.")
            
            serializer.save(booking=booking)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found.")

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    
    # Get user's bookings
    user_bookings = Booking.objects.filter(
        Q(student=user) | Q(tutor=user)
    )
    
    # Get user's availabilities
    user_availabilities = Availability.objects.filter(tutor=user)
    
    stats = {
        'total_bookings': user_bookings.count(),
        'upcoming_bookings': user_bookings.filter(
            availability__start_time__gt=timezone.now(),
            status__in=['pending', 'confirmed']
        ).count(),
        'completed_bookings': user_bookings.filter(status='completed').count(),
        'total_availabilities': user_availabilities.count(),
        'active_availabilities': user_availabilities.filter(
            is_active=True,
            start_time__gt=timezone.now()
        ).count(),
        'unread_notifications': Notification.objects.filter(
            user=user,
            is_read=False
        ).count(),
    }
    
    return Response(stats)

# Calendar-specific views for Google Calendar-like interface
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def help_types_list(request):
    """List all available help types"""
    help_types = [{'value': choice[0], 'label': choice[1]} for choice in HELP_TYPE_CHOICES]
    return Response(help_types)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def calendar_view(request):
    """Get calendar data for different views (month, week, day)"""
    view_type = request.query_params.get('view', 'month')  # month, week, day
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    help_type = request.query_params.get('help_type')
    tutor_id = request.query_params.get('tutor_id')
    
    # Parse dates
    if start_date and end_date:
        from datetime import datetime
        start_dt = datetime.fromisoformat(start_date.split(' ')[0])
        end_dt = datetime.fromisoformat(end_date.split(' ')[0])
    else:
        # Default to current month
        now = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        start_dt = now.replace(day=1)
        if now.month == 12:
            end_dt = now.replace(year=now.year + 1, month=1, day=1) - timezone.timedelta(days=1)
        else:
            end_dt = now.replace(month=now.month + 1, day=1) - timezone.timedelta(days=1)

    # Convert to UTC to ensure consistency
    start_dt = timezone.make_aware(start_dt) if timezone.is_naive(start_dt) else start_dt
    end_dt = timezone.make_aware(end_dt) if timezone.is_naive(end_dt) else end_dt

    # Get availabilities in date range
    availabilities = Availability.objects.filter(
        start_time__date__gte=start_dt.date(),
        start_time__date__lte=end_dt.date(),
        is_active=True
    ).select_related('tutor')
    
    # Apply filters
    if help_type:
        availabilities = availabilities.filter(help_type=help_type)
    if tutor_id:
        availabilities = availabilities.filter(tutor_id=tutor_id)
    
    # Generate calendar events
    events = []
    for availability in availabilities:
        help_type_display = dict(HELP_TYPE_CHOICES)[availability.help_type]
        events.append({
            'id': availability.id,
            'title': f"{help_type_display} - {availability.tutor.full_name}",
            'start': availability.start_time.isoformat(),
            'end': availability.end_time.isoformat(),
            'allDay': False,
            'color': '#3788d8' if not availability.is_booked else '#d32f2f',
            'extendedProps': {
                'availability_id': availability.id,
                'tutor_id': availability.tutor.id,
                'tutor_name': availability.tutor.full_name,
                'help_type': availability.help_type,
                'help_type_display': help_type_display,
                'description': availability.description,
                'is_available': not availability.is_booked and availability.is_active,
                'max_students': availability.max_students,
                'start_time_iso': availability.start_time.isoformat(),
                'end_time_iso': availability.end_time.isoformat(),
            }
        })
    
    # Get related data
    tutors = User.objects.filter(
        id__in=availabilities.values_list('tutor_id', flat=True)
    ).distinct()
    
    help_types = [{'value': choice[0], 'label': choice[1]} for choice in HELP_TYPE_CHOICES]
    
    calendar_data = {
        'events': events,
        'tutors': UserListSerializer(tutors, many=True).data,
        'help_types': help_types
    }
    
    return Response(calendar_data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def availability_conflicts(request, availability_id):
    """Check for conflicts with existing availabilities"""
    try:
        availability = Availability.objects.get(id=availability_id, tutor=request.user)
        
        # Find overlapping availabilities
        conflicts = Availability.objects.filter(
            tutor=request.user,
            start_time__lt=availability.end_time,
            end_time__gt=availability.start_time,
            is_active=True
        ).exclude(id=availability.id)
        
        conflict_data = []
        for conflict in conflicts:
            help_type_display = dict(HELP_TYPE_CHOICES)[conflict.help_type]
            conflict_data.append({
                'id': conflict.id,
                'help_type': conflict.help_type,
                'help_type_display': help_type_display,
                'start_time': conflict.start_time,
                'end_time': conflict.end_time,
                'overlap_start': max(availability.start_time, conflict.start_time),
                'overlap_end': min(availability.end_time, conflict.end_time)
            })
        
        return Response({
            'has_conflicts': len(conflict_data) > 0,
            'conflicts': conflict_data
        })
        
    except Availability.DoesNotExist:
        return Response({'error': 'Availability not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_booking_partner_profile(request, booking_id):
    """Get the profile of the other party in a confirmed booking"""
    try:
        booking = Booking.objects.get(id=booking_id)
        
        # Check if user is involved in this booking
        if booking.student != request.user and booking.tutor != request.user:
            return Response({'error': 'You are not authorized to view this booking.'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Check if booking is confirmed and profile exchange is enabled
        if booking.status != 'confirmed' or not booking.profile_exchanged:
            return Response({'error': 'Profile exchange is only available for confirmed bookings.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Get the other party's profile
        other_user = booking.tutor if booking.student == request.user else booking.student
        profile_data = UserProfileSerializer(other_user).data
        
        return Response({
            'booking_id': booking.id,
            'partner_profile': profile_data,
            'help_type': booking.availability.get_help_type_display(),
            'booking_time': booking.availability.start_time
        })
        
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)