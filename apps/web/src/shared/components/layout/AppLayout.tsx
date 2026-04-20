import React from 'react';
import { Sidebar, SidebarPage } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  activePage: SidebarPage;
  onNavigate: (page: SidebarPage) => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  farms?: any[];
  farmers?: any[];
  dbSoilTests?: any[];
  onNavigateToFarm?: (farm: any) => void;
  onNavigateToFarmer?: (farmer: any) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activePage,
  onNavigate,
  onLogout,
  userName,
  userRole,
  userAvatar,
  searchQuery,
  onSearchChange,
  farms,
  farmers,
  dbSoilTests,
  onNavigateToFarm,
  onNavigateToFarmer,
  children,
}) => {
  const isSuperAdmin = userName === 'superadmin';

  return (
    <div className="tanim-app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} isSuperAdmin={isSuperAdmin} />
      <div className="tanim-main-area">
        <Topbar userName={userName} userRole={userRole} userAvatar={userAvatar} searchQuery={searchQuery} onSearchChange={onSearchChange} farms={farms} farmers={farmers} dbSoilTests={dbSoilTests} onNavigateApp={onNavigate} onNavigateToFarm={onNavigateToFarm} onNavigateToFarmer={onNavigateToFarmer} />
        <main className="tanim-content">{children}</main>
      </div>
    </div>
  );
};
