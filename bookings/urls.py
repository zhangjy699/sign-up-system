from django.urls import path
from .views import (
    AvailabilityListCreateView,
    AvailabilityDetailView,
    BookingListCreateView,
    BookingDetailView,
    NotificationListView,
    FeedbackCreateView,
    mark_notification_read,
    unread_notifications_count,
    dashboard_stats,
    help_types_list,
    calendar_view,
    availability_conflicts,
    get_booking_partner_profile
)

urlpatterns = [
    # Availability URLs
    path('availabilities/', AvailabilityListCreateView.as_view(), name='availability_list_create'),
    path('availabilities/<int:pk>/', AvailabilityDetailView.as_view(), name='availability_detail'),
    
    # Booking URLs
    path('bookings/', BookingListCreateView.as_view(), name='booking_list_create'),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name='booking_detail'),
    
    # Notification URLs
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:notification_id>/read/', mark_notification_read, name='mark_notification_read'),
    path('notifications/unread-count/', unread_notifications_count, name='unread_notifications_count'),
    
    # Feedback URLs
    path('bookings/<int:booking_id>/feedback/', FeedbackCreateView.as_view(), name='feedback_create'),
    
    # Dashboard
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    
    # Calendar URLs
    path('help-types/', help_types_list, name='help_types_list'),
    path('calendar/', calendar_view, name='calendar_view'),
    path('availabilities/<int:availability_id>/conflicts/', availability_conflicts, name='availability_conflicts'),
    
    # Profile exchange
    path('bookings/<int:booking_id>/partner-profile/', get_booking_partner_profile, name='get_booking_partner_profile'),
]