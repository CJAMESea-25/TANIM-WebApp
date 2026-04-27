import React from 'react';
import { Bell } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface TopbarProps {
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  farms?: any[];
  farmers?: any[];
  onNavigateApp?: (page: any) => void;
  onNavigateToFarm?: (farm: any) => void;
  onNavigateToFarmer?: (farmer: any) => void;
  dbSoilTests?: any[];
}

export const Topbar: React.FC<TopbarProps> = ({
  userName = 'Admin',
  userRole = 'Regional Admin',
  userAvatar,
  searchQuery = '',
  onSearchChange,
  farms = [],
  farmers = [],
  dbSoilTests = [],
  onNavigateApp,
  onNavigateToFarm,
  onNavigateToFarmer,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [showNotifs, setShowNotifs] = React.useState(false);

  const matchedFarms = farms.filter(f => {
     if (!searchQuery) return false;
     const q = searchQuery.toLowerCase();
     
     const rawLoc = f.farm_location || f.location;
     const locStr = typeof rawLoc === 'object' && rawLoc !== null ? (rawLoc.address || rawLoc.name || '') : (rawLoc || '');
     
     return (f.farm_name || f.name || '').toLowerCase().includes(q) || String(locStr).toLowerCase().includes(q);
  }).slice(0, 5);

  const matchedFarmers = farmers.filter(f => {
     if (!searchQuery) return false;
     const q = searchQuery.toLowerCase();
     return (f.username || f.name || f.first_name || '').toLowerCase().includes(q) || (f.email || '').toLowerCase().includes(q);
  }).slice(0, 5);

  const hasResults = matchedFarms.length > 0 || matchedFarmers.length > 0;
  const showDropdown = isFocused && searchQuery.length > 0;

  const notifications = React.useMemo(() => {
    const list: any[] = [];
    farms.forEach(f => {
      if (f.created_at) list.push({ icon: '🌾', model: 'Farm', label: `New farm added: ${f.farm_name || 'Unnamed Farm'}`, date: new Date(f.created_at), payload: f, type: 'farm' });
    });
    farmers.forEach(f => {
      if (f.created_at) list.push({ icon: '🧑‍🌾', model: 'Farmer', label: `New farmer added: ${f.username || f.first_name || 'Unnamed'}`, date: new Date(f.created_at), payload: f, type: 'farmer' });
    });
    dbSoilTests.forEach(t => {
      const farm = farms.find(f => f.farm_id === t.farm_id || f.id === t.farm_id);
      const farmName = farm?.farm_name || `#${t.farm_id}`;
      if (t.created_at) list.push({ icon: '🧪', model: 'Soil Test', label: `New soil test recorded for ${farmName}`, date: new Date(t.created_at), payload: farm, type: 'test' });
    });
    return list.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [farms, farmers, dbSoilTests]);

  return (
    <header className="tanim-topbar">
      <SidebarTrigger className="tanim-topbar-menu-trigger shrink-0 md:hidden" />
      <div className="tanim-topbar-search min-w-0 flex-1" style={{ position: 'relative' }}>
        <svg className="tanim-topbar-search-icon" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width={16} height={16}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search agricultural data..."
          className="tanim-topbar-search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        />
        
        {/* Floating Results Dropdown */}
        {showDropdown && (
          <div style={{
            position: 'absolute', top: '110%', left: 0, width: '100%', maxWidth: 'min(100vw - 32px, 400px)', minWidth: 0, background: '#fff', borderRadius: 12,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #e0dacf', overflow: 'hidden', zIndex: 1000
          }}>
            {hasResults ? (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {matchedFarms.length > 0 && (
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0ece4' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#8aaa7a', textTransform: 'uppercase', marginBottom: 8 }}>Farms</div>
                    {matchedFarms.map(f => (
                      <div key={f.farm_id || f.id} onClick={() => { onNavigateToFarm ? onNavigateToFarm(f) : onNavigateApp?.('farms'); onSearchChange?.(''); }} style={{
                        padding: '8px 12px', borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s'
                      }} onMouseEnter={e => e.currentTarget.style.background = '#f4fbf0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2e3a28' }}>{f.farm_name || f.name}</div>
                        <div style={{ fontSize: 11, color: '#9aaa8a', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>🌾</span>
                          {(() => {
                             const raw = f.farm_location || f.location;
                             if (typeof raw === 'object' && raw !== null) return raw.address || raw.name || 'Unknown Location';
                             return raw || 'Unknown Location';
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {matchedFarmers.length > 0 && (
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#8aaa7a', textTransform: 'uppercase', marginBottom: 8 }}>Farmers</div>
                    {matchedFarmers.map(f => (
                      <div key={f.farmer_id || f.id} onClick={() => { onNavigateToFarmer ? onNavigateToFarmer(f) : onNavigateApp?.('farmers'); onSearchChange?.(''); }} style={{
                        padding: '8px 12px', borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s'
                      }} onMouseEnter={e => e.currentTarget.style.background = '#f4fbf0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2e3a28' }}>{f.username || f.name || f.first_name}</div>
                        <div style={{ fontSize: 11, color: '#9aaa8a' }}>{f.email || 'No email provided'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#8a9880', fontSize: 13 }}>
                No results found for "{searchQuery}"
              </div>
            )}
           </div>
        )}
      </div>

      {/* Right section */}
      <div className="tanim-topbar-right">
        <div style={{ position: 'relative' }}>
          <button 
            className="tanim-topbar-icon-btn" 
            title="Notifications"
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#e53935', borderRadius: '50%' }} />
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 'min(100vw - 24px, 320px)', maxWidth: '100vw', background: '#fff', borderRadius: 12,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #e0dacf', overflow: 'hidden', zIndex: 1000
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0ece4', fontSize: 14, fontWeight: 700, color: '#2e3a28' }}>
                Recent Notifications
              </div>
              <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                {notifications.length > 0 ? notifications.map((notif, idx) => (
                  <div key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid #f9f8f6', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f4fbf0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => {
                        if (notif.type === 'farmer' && onNavigateToFarmer) onNavigateToFarmer(notif.payload);
                        if ((notif.type === 'farm' || notif.type === 'test') && onNavigateToFarm && notif.payload) onNavigateToFarm(notif.payload);
                        setShowNotifs(false);
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ fontSize: 16 }}>{notif.icon}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#3a5a40' }}>{notif.model}</div>
                        <div style={{ fontSize: 13, color: '#2e3a28', marginTop: 2, lineHeight: 1.3 }}>{notif.label}</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#8a9880', fontSize: 13 }}>No recent notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="tanim-topbar-divider" />

        <div className="tanim-topbar-user">
          <div className="tanim-topbar-user-info">
            <span className="tanim-topbar-user-name">{userName}</span>
            <span className="tanim-topbar-user-role">{userRole}</span>
          </div>
          <div className="tanim-topbar-avatar">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} />
            ) : (
              <span>{userName?.charAt(0)?.toUpperCase() || 'A'}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
