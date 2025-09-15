"use client";
import React from 'react';
import AlphaPaymentRequests from '../../../components/AlphaPaymentRequests';

const AlphaPaymentsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <AlphaPaymentRequests />
      </div>
    </div>
  );
};

export default AlphaPaymentsPage;