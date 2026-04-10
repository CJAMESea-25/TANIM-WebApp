import React from 'react';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { FarmerInterface } from '@/features/farmers/components/FarmerInterface';
import { AdminDashboard } from '@/features/dashboard/components/AdminDashboard';
import { useGlobalAuth } from '@/features/auth/hooks/useGlobalAuth';

console.log('Index.tsx module loaded successfully');

const Index = () => {
  const { session, profile, loading } = useGlobalAuth();

  console.log('Index component rendered, session:', session ? 'logged in' : 'null');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-earth flex items-center justify-center p-4">
        <div className="text-xl font-medium text-muted-foreground animate-pulse">Loading TANIM...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!session) {
    console.log('Showing LoginPage - not authenticated');
    return <LoginPage />;
  }

  // Show appropriate interface based on user role
  if (profile?.role === 'farmer') {
    console.log('Showing FarmerInterface');
    return <FarmerInterface />;
  }

  if (profile?.role === 'admin') {
    console.log('Showing AdminDashboard');
    return <AdminDashboard />;
  }

  // Fallback - should not reach here unless profile is incomplete
  console.log('Fallback to Admin Dashboard - no role detected');
  return <AdminDashboard />;
};

export default Index;
