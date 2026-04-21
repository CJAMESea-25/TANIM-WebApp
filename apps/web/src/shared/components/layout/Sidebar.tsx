import React from 'react';
import {
  LayoutDashboard,
  Tractor,
  Users,
  Map,
  FlaskConical,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';

export type SidebarPage =
  | 'dashboard'
  | 'farms'
  | 'farmers'
  | 'gis-mapping'
  | 'fertilizer'
  | 'admin-management'
  | 'admin-profile';

export interface TanimNavItem {
  id: SidebarPage;
  label: string;
  icon: React.ReactNode;
}

export const TANIM_PRIMARY_NAV: TanimNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'farms', label: 'Farms', icon: <Tractor size={18} /> },
  { id: 'farmers', label: 'Farmers', icon: <Users size={18} /> },
  { id: 'gis-mapping', label: 'GIS Mapping', icon: <Map size={18} /> },
  { id: 'fertilizer', label: 'Fertilizer Management', icon: <FlaskConical size={18} /> },
];

export const TANIM_BOTTOM_NAV: TanimNavItem[] = [
  { id: 'admin-management', label: 'Admin Management', icon: <ShieldCheck size={18} /> },
  { id: 'admin-profile', label: 'Admin Profile', icon: <UserCircle size={18} /> },
];
