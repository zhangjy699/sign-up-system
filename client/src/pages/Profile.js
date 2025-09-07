import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Profile Management
          </h2>
          <p className="text-gray-600">
            This page will contain comprehensive profile management with:
          </p>
          <ul className="text-left text-gray-600 mt-4 space-y-2">
            <li>• Personal information editing</li>
            <li>• Academic details update</li>
            <li>• Tutoring preferences management</li>
            <li>• Privacy settings configuration</li>
            <li>• Password change functionality</li>
            <li>• Profile picture upload</li>
            <li>• Contact information settings</li>
            <li>• Account deactivation option</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
