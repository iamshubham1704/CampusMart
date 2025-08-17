
"use client";
import React from 'react';
import SellerPaymentRequests from '../../../components/SellerPaymentRequests';

const SellerPaymentsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <SellerPaymentRequests />
      </div>
    </div>
  );
};

export default SellerPaymentsPage;