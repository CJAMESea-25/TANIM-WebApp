import React from 'react';
import { LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import { Topbar } from './Topbar';
import {
  SidebarPage,
  TANIM_BOTTOM_NAV,
  TANIM_PRIMARY_NAV,
  TanimNavItem,
} from './Sidebar';

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

function TanimSidebarNav({
  activePage,
  onNavigate,
  onLogout,
  isSuperAdmin,
}: {
  activePage: SidebarPage;
  onNavigate: (page: SidebarPage) => void;
  onLogout: () => void;
  isSuperAdmin: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  const go = (page: SidebarPage) => {
    onNavigate(page);
    if (isMobile) setOpenMobile(false);
  };

  const handleLogout = () => {
    onLogout();
    if (isMobile) setOpenMobile(false);
  };

  const bottomItems: TanimNavItem[] = TANIM_BOTTOM_NAV.filter((item) => {
    if (item.id === 'admin-management') return isSuperAdmin;
    return true;
  });

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border/50 p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-sidebar-primary p-1">
            <img src="/tanim_logo.png" alt="TANIM" className="h-full w-full object-contain" />
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-[15px] font-extrabold tracking-wide text-sidebar-foreground">TANIM</span>
            <span className="text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#8faa78]">
              Agricultural framework
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-0 py-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {TANIM_PRIMARY_NAV.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activePage === item.id}
                    onClick={() => go(item.id)}
                    className="h-9 text-[13px] font-medium data-[active=true]:bg-[#4f6e45] data-[active=true]:text-[#e8ead0]"
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-2">
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={activePage === item.id}
                onClick={() => go(item.id)}
                className="h-9 text-[13px] font-medium data-[active=true]:bg-[#4f6e45] data-[active=true]:text-[#e8ead0]"
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="h-9 text-[13px] font-medium text-red-300 hover:bg-red-950/25 hover:text-red-200"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
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
    <SidebarProvider className="min-h-dvh w-full bg-[#f5f0e8] supports-[height:100dvh]:min-h-dvh">
      <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
        <TanimSidebarNav
          activePage={activePage}
          onNavigate={onNavigate}
          onLogout={onLogout}
          isSuperAdmin={isSuperAdmin}
        />
      </Sidebar>
      <SidebarInset className="flex min-h-dvh min-w-0 flex-col bg-[#f5f0e8] supports-[height:100dvh]:min-h-dvh">
        <Topbar
          userName={userName}
          userRole={userRole}
          userAvatar={userAvatar}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          farms={farms}
          farmers={farmers}
          dbSoilTests={dbSoilTests}
          onNavigateApp={onNavigate}
          onNavigateToFarm={onNavigateToFarm}
          onNavigateToFarmer={onNavigateToFarmer}
        />
        <div className="tanim-content flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};
