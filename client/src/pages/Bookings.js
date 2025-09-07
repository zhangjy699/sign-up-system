import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Bookings = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Booking Management
          </h2>
          <p className="text-gray-600">
            This page will display all user bookings with features for:
          </p>
          <ul className="text-left text-gray-600 mt-4 space-y-2">
            <li>• View upcoming and past bookings</li>
            <li>• Cancel bookings</li>
            <li>• Confirm attendance</li>
            <li>• Submit feedback and ratings</li>
            <li>• View session details and tutor information</li>
            <li>• Join online sessions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
