import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const CreateSession = () => {
  const { user } = useAuth();

  if (!user?.canTutor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only tutors can create sessions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Session</h1>
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Session Creation Form
          </h2>
          <p className="text-gray-600">
            This page will contain a comprehensive form for creating tutoring sessions with:
          </p>
          <ul className="text-left text-gray-600 mt-4 space-y-2">
            <li>• Session title and description</li>
            <li>• Category selection</li>
            <li>• Date and time picker</li>
            <li>• Location settings (Online/On-campus/Off-campus)</li>
            <li>• Capacity management</li>
            <li>• Materials and requirements</li>
            <li>• Recurring session options</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
