import React from 'react';
import { useCropStore } from '@/stores/cropStore';
import { LoginPage } from '@/components/LoginPage';
import { FarmerInterface } from '@/components/FarmerInterface';
import { AdminDashboard } from '@/components/AdminDashboard';

console.log('Index.tsx module loaded successfully');

const Index = () => {
  const { auth } = useCropStore();

  console.log('Index component rendered, auth state:', auth);

  // Show login page if not authenticated
  if (!auth.isAuthenticated) {
    console.log('Showing LoginPage - not authenticated');
    return <LoginPage />;
  }

  // Show appropriate interface based on user role
  if (auth.currentUser?.role === 'farmer') {
    console.log('Showing FarmerInterface');
    return <FarmerInterface />;
  }

  if (auth.currentUser?.role === 'admin') {
    console.log('Showing AdminDashboard');
    return <AdminDashboard />;
  }

  // Fallback - should not reach here
  console.log('Fallback to LoginPage');
  return <LoginPage />;
};

export default Index;
