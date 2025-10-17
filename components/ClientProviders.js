"use client";
import React from 'react';
import { CollegeProvider } from './contexts/CollegeContext';

const ClientProviders = ({ children }) => {
  return (
    <CollegeProvider>
      {children}
    </CollegeProvider>
  );
};

export default ClientProviders;
