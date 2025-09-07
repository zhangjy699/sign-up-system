import React from 'react';

export const Tutors = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Find Tutors</h1>
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Tutor Directory
          </h2>
          <p className="text-gray-600">
            This page will display all available tutors with features for:
          </p>
          <ul className="text-left text-gray-600 mt-4 space-y-2">
            <li>• Browse tutor profiles</li>
            <li>• Filter by program and expertise</li>
            <li>• View tutor ratings and reviews</li>
            <li>• Search by name or category</li>
            <li>• View tutor availability</li>
            <li>• Contact tutors directly</li>
            <li>• View tutor's session history</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
