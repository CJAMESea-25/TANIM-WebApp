import React from 'react';
import {
  LayoutDashboard,
  Tractor,
  Users,
  Map,
  FlaskConical,
  ShieldCheck,
  UserCircle,
  LogOut,
} from 'lucide-react';

export type SidebarPage =
  | 'dashboard'
  | 'farms'
  | 'farmers'
  | 'gis-mapping'
  | 'fertilizer'
  | 'admin-management'
  | 'admin-profile';

interface NavItem {
  id: SidebarPage;
  label: string;
  icon: React.ReactNode;
}

const primaryNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'farms', label: 'Farms', icon: <Tractor size={18} /> },
  { id: 'farmers', label: 'Farmers', icon: <Users size={18} /> },
  { id: 'gis-mapping', label: 'GIS Mapping', icon: <Map size={18} /> },
  { id: 'fertilizer', label: 'Fertilizer Management', icon: <FlaskConical size={18} /> },
];

const bottomNav: NavItem[] = [
  { id: 'admin-management', label: 'Admin Management', icon: <ShieldCheck size={18} /> },
  { id: 'admin-profile', label: 'Admin Profile', icon: <UserCircle size={18} /> },
];

interface SidebarProps {
  activePage: SidebarPage;
  onNavigate: (page: SidebarPage) => void;
  onLogout: () => void;
  isSuperAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout, isSuperAdmin }) => {
  const visibleBottomNav = bottomNav.filter(item => {
    if (item.id === 'admin-management') return isSuperAdmin;
    return true;
  });
  return (
    <aside className="tanim-sidebar">
      <div className="tanim-sidebar-logo">
        <div style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src="/tanim_logo.png" alt="TANIM Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div className="tanim-sidebar-logo-text">
          <span className="tanim-sidebar-logo-title">TANIM</span>
          <span className="tanim-sidebar-logo-sub">AGRICULTURAL FRAMEWORK</span>
        </div>
      </div>

      {/* Primary navigation */}
      <nav className="tanim-sidebar-nav">
        {primaryNav.map((item) => (
          <button
            key={item.id}
            className={`tanim-sidebar-item${activePage === item.id ? ' tanim-sidebar-item--active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={item.label}
          >
            <span className="tanim-sidebar-item-icon">{item.icon}</span>
            <span className="tanim-sidebar-item-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="tanim-sidebar-spacer" />

      {/* Bottom navigation */}
      <nav className="tanim-sidebar-bottom">
        {visibleBottomNav.map((item) => (
          <button
            key={item.id}
            className={`tanim-sidebar-item${activePage === item.id ? ' tanim-sidebar-item--active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={item.label}
          >
            <span className="tanim-sidebar-item-icon">{item.icon}</span>
            <span className="tanim-sidebar-item-label">{item.label}</span>
          </button>
        ))}
        <button
          className="tanim-sidebar-item tanim-sidebar-item--logout"
          onClick={onLogout}
          title="Logout"
        >
          <span className="tanim-sidebar-item-icon">
            <LogOut size={18} />
          </span>
          <span className="tanim-sidebar-item-label">Logout</span>
        </button>
      </nav>
    </aside>
  );
};
