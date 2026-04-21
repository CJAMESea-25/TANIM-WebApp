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
    <div className="tanim-app-shell" style={{ height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', position: 'fixed', inset: 0 }}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} isSuperAdmin={isSuperAdmin} />
      <div className="tanim-main-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100vh' }}>
        <Topbar userName={userName} userRole={userRole} userAvatar={userAvatar} searchQuery={searchQuery} onSearchChange={onSearchChange} farms={farms} farmers={farmers} dbSoilTests={dbSoilTests} onNavigateApp={onNavigate} onNavigateToFarm={onNavigateToFarm} onNavigateToFarmer={onNavigateToFarmer} />
        <main className="tanim-content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>{children}</main>
      </div>
    </div>
  );
};
