import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Download, Users, Edit2, Trash2, User, Phone, Tractor, MapPin } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const farmerInitials = (name: string) => {
  const parts = (name || '?').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0][0] + (parts[0][1] || '')).toUpperCase();
};

const avatarColor = (name: string) => {
  const palette = ['#4a7c59', '#3a6b8a', '#7a5c3a', '#6b3a7a', '#3a7a6b', '#7a3a3a', '#5c7a3a', '#3a4f7a'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % palette.length;
  return palette[h];
};

const formatFarmerId = (id: any) =>
  `TNM-F-${String(id || '0000').slice(-4).padStart(4, '0')}`;

const farmerStatus = (idx: number): string => {
  if (idx % 11 === 5) return 'INACTIVE';
  return 'ACTIVE';
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  'ACTIVE': { bg: '#eaf5e9', color: '#2e7d32', border: '#b5ddb3' },
  'INACTIVE': { bg: '#f5f5f5', color: '#757575', border: '#d8d8d8' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = statusStyles[status] || statusStyles['ACTIVE'];
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', fontSize: 11, fontWeight: 700,
      borderRadius: 6, letterSpacing: '0.04em',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {status}
    </span>
  );
};

// ─── FarmersRegistryView ──────────────────────────────────────────────────────

const FarmersRegistryView = ({
  farms, farmers, searchQuery = '', onAddFarmer, onAddFarm,
  onEditFarmer, onDeleteFarmer,
  initialViewFarmerId, onInitialViewConsumed
}: {
  farms: any[]; farmers: any[]; searchQuery?: string;
  onAddFarmer: () => void; onAddFarm: (id: string) => void;
  onEditFarmer: (farmer: any) => void; onDeleteFarmer: (farmer: any) => void;
  initialViewFarmerId?: string | null; onInitialViewConsumed?: () => void;
}) => {
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 8;
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('name');
  const [viewingFarmer, setViewingFarmer] = React.useState<any>(null);

  React.useEffect(() => {
    if (initialViewFarmerId && farmers.length > 0) {
      const target = farmers.find(
        (f: any) => (f.farmer_id || f.id) === initialViewFarmerId
      );
      if (target) {
        setViewingFarmer(target);
        if (onInitialViewConsumed) onInitialViewConsumed();
      }
    }
  }, [initialViewFarmerId, farmers, onInitialViewConsumed]);

  const handleExportCSV = () => {
    const headers = [
      'Farmer ID', 'Username', 'First Name', 'Last Name',
      'Phone Number', 'Status', 'Associated Farms', 'Farm Locations',
      'Total Farm Area (ha)', 'Registration Date'
    ];

    const rows = farmers.map((farmer: any, idx: number) => {
      const assignedFarms = farms.filter(
        (f: any) => f.farmer_id === farmer.farmer_id || f.farmer_id === farmer.id
      );
      const farmNames = assignedFarms.map((f: any) => f.farm_name || f.name || '').join('; ');
      const farmLocs = assignedFarms.map((f: any) => f.farm_location || f.farmLocation || '').join('; ');
      const totalArea = assignedFarms.reduce((acc: number, f: any) => acc + Number(f.farm_measurement || 0), 0);
      const phone = farmer.phone_number || farmer.phone || '';
      const status = farmerStatus(idx);
      const regDate = farmer.created_at
        ? new Date(farmer.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '';

      // Wrap fields in quotes to handle commas inside values
      const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

      return [
        escape(formatFarmerId(farmer.farmer_id || farmer.id)),
        escape(farmer.username || ''),
        escape(farmer.first_name || ''),
        escape(farmer.last_name || ''),
        escape(phone),
        escape(status),
        escape(farmNames),
        escape(farmLocs),
        escape(totalArea),
        escape(regDate),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `farmers_registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const nextStatusFilter = () => {
    setStatusFilter(s => s === 'all' ? 'active' : s === 'active' ? 'inactive' : 'all');
    setPage(1);
  };
  const toggleSort = () => {
    setSortBy(s => s === 'name' ? 'recent' : 'name');
    setPage(1);
  };

  let processedFarmers = farmers.filter((farmer: any, idx: number) => {
    const name = (farmer.username || farmer.name || farmer.first_name || '').toLowerCase();
    if (searchQuery && !name.includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'all') {
      const status = farmerStatus(idx).toLowerCase(); // active, inactive
      if (status !== statusFilter) return false;
    }
    return true;
  });

  if (sortBy === 'name') {
    processedFarmers.sort((a, b) => (a.username || a.name || '').localeCompare(b.username || b.name || ''));
  } else {
    processedFarmers.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }

  const third = Math.floor(processedFarmers.length / 3);
  const north = third;
  const south = third;
  const central = processedFarmers.length - north - south;
  const totalPages = Math.max(1, Math.ceil(processedFarmers.length / rowsPerPage));
  const pageFarmers = processedFarmers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div style={{ padding: '16px 36px 32px 36px', background: '#f0ede4', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1e2a1e', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
            Farmers Management
          </h1>
          <p style={{ fontSize: 13.5, color: '#6a7a60', margin: 0, lineHeight: 1.6 }}>
            List of farmers in the TANIM platform.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <button onClick={handleExportCSV} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: '#fff', border: '1.5px solid #d5cfc5', color: '#4a5a40',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <Download size={14} /> Export Registry
          </button>
          <button onClick={onAddFarmer} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: '#3a5a40', color: '#fff', border: 'none',
            boxShadow: '0 2px 8px rgba(58,90,64,0.25)',
          }}>
            <Users size={14} /> Register New Farmer
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2.5fr', gap: 18, marginBottom: 24 }}>
        <div style={{ background: '#e8e3d8', borderRadius: 18, padding: '28px 26px', minHeight: 130 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#7a8a70', textTransform: 'uppercase', marginBottom: 14 }}>Total Active</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 42, fontWeight: 800, color: '#1e2a1e', lineHeight: 1 }}>{processedFarmers.length}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4caf50' }}>+12%</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 18, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#8aaa7a', textTransform: 'uppercase', marginBottom: 14 }}>Bukidnon Coverage</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[{ label: 'North', count: north, color: '#3a5a40' }, { label: 'South', count: south, color: '#588157' }, { label: 'Central', count: central, color: '#888' }].map(({ label, count, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#4a5a40' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{label}:</span>
                  <span style={{ color: '#7a8a70' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
            {[north, south, central].map((v, i) => {
              const maxV = Math.max(north, south, central, 1);
              const barH = Math.max(8, Math.round((v / maxV) * 56));
              return <div key={i} style={{ width: 14, height: barH, background: ['#3a5a40', '#a3b18a', '#d0cabb'][i], borderRadius: '3px 3px 0 0', opacity: 0.85 }} />;
            })}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="tanim-farms-filter-bar" style={{ marginBottom: 20 }}>
        <div className="tanim-farms-filter-pills" style={{ gap: 12 }}>
          <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setPage(1); }}>
            <SelectTrigger style={{ width: 140, height: 34, borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#fff', border: '1px solid #e0dacf', color: '#4a5a40' }}>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="recent">Recently Added</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="tanim-farms-showing">
          Showing <strong>{pageFarmers.length}</strong> of <strong>{processedFarmers.length}</strong> farmers
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 2fr 1fr', padding: '12px 20px', background: '#f8f6f2', borderBottom: '1px solid #ece8e0' }}>
          {['Name', 'Contact Information', 'Associated Farm', 'Actions'].map(col => (
            <div key={col} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#8aaa7a', textTransform: 'uppercase', textAlign: col === 'Actions' ? 'right' : 'left' }}>{col}</div>
          ))}
        </div>

        {processedFarmers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8a9880', fontSize: 14 }}>
            No farmers match your search or filters.
          </div>
        ) : (
          pageFarmers.map((farmer: any, idx: number) => {
            const globalIdx = (page - 1) * rowsPerPage + idx;
            const fullName = (farmer.first_name || farmer.last_name)
              ? `${farmer.first_name || ''} ${farmer.last_name || ''}`.trim()
              : null;
            const name = fullName || farmer.username || farmer.name || 'Unknown Farmer';
            const initials = farmerInitials(name);
            const bgColor = avatarColor(name);
            const farmerId = formatFarmerId(farmer.farmer_id || farmer.id);
            const email = farmer.email || `${(name.split(' ')[0] || 'farmer').toLowerCase()}@tanim.ag`;
            const phone = farmer.phone_number || farmer.phone || '—';
            const assignedFarms = farms.filter((f: any) => f.farmer_id === farmer.farmer_id || f.farmer_id === farmer.id);
            const primaryFarm = assignedFarms[0];
            const status = farmerStatus(globalIdx);

            return (
              <div
                key={farmer.farmer_id || farmer.id}
                onClick={() => setViewingFarmer(farmer)}
                style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 2fr 1fr', padding: '14px 20px', borderBottom: '1px solid #f0ece4', alignItems: 'center', transition: 'background 0.12s ease', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafaf7')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: bgColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2e3a28', lineHeight: 1.3 }}>{name}</div>
                    <div style={{ fontSize: 11, color: '#9aaa8a', marginTop: 2 }}>{farmerId}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4a5a40' }}>
                    <span style={{ color: '#8aaa7a', fontSize: 11 }}>✆</span><span>{phone}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {primaryFarm ? (
                    <>
                      <span style={{ fontSize: 16 }}>🌿</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#2e3a28', lineHeight: 1.3 }}>{primaryFarm.farm_name || primaryFarm.name}</div>
                        {assignedFarms.length > 1 && <div style={{ fontSize: 11, color: '#9aaa8a' }}>+{assignedFarms.length - 1} more</div>}
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: '#bbb', fontStyle: 'italic' }}>No farm assigned</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                  <button style={{ width: 28, height: 28, color: '#4a5a40', background: 'none', border: '1.5px solid #c0d4b0', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); onEditFarmer?.(farmer); }} title="Edit Farmer">
                    <Edit2 size={14} />
                  </button>
                  <button style={{ width: 28, height: 28, color: '#c0392b', background: 'none', border: '1.5px solid #f5c6a0', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); onDeleteFarmer?.(farmer); }} title="Delete Farmer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {processedFarmers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #f0ece4', background: '#fafaf7' }}>
            <span style={{ fontSize: 12, color: '#9aaa8a' }}>
              Showing <strong style={{ color: '#4a5a40' }}>{(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, processedFarmers.length)}</strong> of <strong style={{ color: '#4a5a40' }}>{processedFarmers.length}</strong> entries
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e0dacf', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#6a7860', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: 28, height: 28, borderRadius: 7, fontSize: 12, fontWeight: 700, border: page === p ? 'none' : '1px solid #e0dacf', background: page === p ? '#3a5a40' : '#fff', color: page === p ? '#e8ead0' : '#4a5a40', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p}</button>
              ))}
              {totalPages > 4 && <span style={{ fontSize: 12, color: '#9aaa8a', padding: '0 2px' }}>…</span>}
              {totalPages > 4 && (
                <button onClick={() => setPage(totalPages)} style={{ width: 28, height: 28, borderRadius: 7, fontSize: 12, fontWeight: 700, border: page === totalPages ? 'none' : '1px solid #e0dacf', background: page === totalPages ? '#3a5a40' : '#fff', color: page === totalPages ? '#e8ead0' : '#4a5a40', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalPages}</button>
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e0dacf', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#6a7860', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Farmer Details Modal */}
      <Dialog open={!!viewingFarmer} onOpenChange={(open) => !open && setViewingFarmer(null)}>
        <DialogContent style={{ maxWidth: 540, borderRadius: 16, padding: 0, overflow: 'hidden' }}>
          {viewingFarmer && (() => {
            const fullName = (viewingFarmer.first_name || viewingFarmer.last_name)
              ? `${viewingFarmer.first_name || ''} ${viewingFarmer.last_name || ''}`.trim()
              : null;
            const name = fullName || viewingFarmer.username || viewingFarmer.name || 'Unknown Farmer';
            const initials = farmerInitials(name);
            const bgColor = avatarColor(name);
            const farmerId = formatFarmerId(viewingFarmer.farmer_id || viewingFarmer.id);
            const phone = viewingFarmer.phone_number || viewingFarmer.phone || '—';
            const assignedFarms = farms.filter((f: any) => f.farmer_id === viewingFarmer.farmer_id || f.farmer_id === viewingFarmer.id);

            return (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Header Profile Section */}
                <div style={{ background: 'linear-gradient(135deg, #3a5a40, #588157)', padding: '32px 32px 24px', color: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', color: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {initials}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', lineHeight: 1.2 }}>{name}</h2>
                    <div style={{ fontSize: 13, color: '#d4e8c0', opacity: 0.9 }}>{farmerId}</div>
                  </div>
                </div>

                <div style={{ padding: '28px 32px', background: '#fcfbef', display: 'flex', flexDirection: 'column', gap: 24 }}>

                  {/* Contact Info */}
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#3a5a40', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={16} /> Contact Information
                    </h3>
                    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e0ddd4' }}>
                      <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 2 }}>Phone Number</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#2e3a28' }}>{phone}</div>
                    </div>
                  </div>

                  {/* Associated Farms */}
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#3a5a40', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tractor size={16} /> Associated Farms ({assignedFarms.length})
                    </h3>
                    {assignedFarms.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {assignedFarms.map((f: any) => (
                          <div key={f.farm_id || f.id} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e0ddd4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28', marginBottom: 2 }}>{f.farm_name || f.name}</div>
                              <div style={{ fontSize: 12, color: '#6a7a60', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MapPin size={12} /> {f.farm_location || f.farmLocation || 'Location not specified'}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5a40', background: '#f5f0e8', padding: '4px 10px', borderRadius: 16 }}>
                              {f.farm_measurement || 0} ha
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #e0ddd4', textAlign: 'center' }}>
                        <Tractor size={24} style={{ margin: '0 auto', opacity: 0.3, color: '#3a5a40' }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#4a5a40', marginTop: 8 }}>No Associated Farms</div>
                        <div style={{ fontSize: 11, color: '#8a9880', marginTop: 4 }}>This farmer has not been assigned to any farms yet.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── FarmersTab (exported) ────────────────────────────────────────────────────

export interface FarmersTabProps {
  farms: any[];
  farmers: any[];
  searchQuery?: string;
  isAddFarmerOpen: boolean;
  setIsAddFarmerOpen: (v: boolean) => void;
  newFarmer: any;
  setNewFarmer: (v: any) => void;
  isAddingFarmer: boolean;
  handleAddFarmerSubmit: () => void;
  isAddFarmOpen: boolean;
  setIsAddFarmOpen: (v: boolean) => void;
  selectedFarmerId: string | null;
  setSelectedFarmerId: (v: string | null) => void;
  newFarm: any;
  setNewFarm: (v: any) => void;
  isAddingFarm: boolean;
  handleAddFarmSubmit: () => void;
  onEditFarmer: (farmer: any) => void;
  onDeleteFarmer: (farmer: any) => void;
  initialViewFarmerId?: string | null;
  onInitialViewConsumed?: () => void;
}

export const FarmersTab = ({
  farms, farmers, searchQuery = '',
  isAddFarmerOpen, setIsAddFarmerOpen,
  newFarmer, setNewFarmer, isAddingFarmer, handleAddFarmerSubmit,
  isAddFarmOpen, setIsAddFarmOpen,
  selectedFarmerId, setSelectedFarmerId,
  newFarm, setNewFarm, isAddingFarm, handleAddFarmSubmit,
  onEditFarmer, onDeleteFarmer,
  initialViewFarmerId, onInitialViewConsumed
}: FarmersTabProps) => (
  <div>
    {/* Register New Farmer Dialog */}
    <Dialog open={isAddFarmerOpen} onOpenChange={setIsAddFarmerOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Register New Farmer</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={newFarmer.username} onChange={e => setNewFarmer({ ...newFarmer, username: e.target.value })} placeholder="Enter farmer's username" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={newFarmer.password} onChange={e => setNewFarmer({ ...newFarmer, password: e.target.value })} placeholder="Set temporary password" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={newFarmer.phone} onChange={e => setNewFarmer({ ...newFarmer, phone: e.target.value })} placeholder="Enter phone number" />
          </div>
          <div className="space-y-2">
            <Label>Language Support</Label>
            <Select value={newFarmer.language} onValueChange={val => setNewFarmer({ ...newFarmer, language: val })}>
              <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English (EN)</SelectItem>
                <SelectItem value="tl">Tagalog (TL)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <p className="text-sm font-semibold text-muted-foreground pt-2">Farm Details (Optional)</p>
          <div className="space-y-2">
            <Label>Farm Name</Label>
            <Input value={newFarmer.farm_name} onChange={e => setNewFarmer({ ...newFarmer, farm_name: e.target.value })} placeholder="Enter farm name" />
          </div>
          <div className="space-y-2">
            <Label>Farm Size (Hectares)</Label>
            <Input type="number" step="any" value={newFarmer.farm_measurement} onChange={e => setNewFarmer({ ...newFarmer, farm_measurement: e.target.value })} placeholder="Enter size in hectares" />
          </div>
          <div className="space-y-2">
            <Label>Primary Soil Type</Label>
            <Select value={newFarmer.soilType} onValueChange={val => setNewFarmer({ ...newFarmer, soilType: val })}>
              <SelectTrigger><SelectValue placeholder="Select soil type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="loam">Loam</SelectItem>
                <SelectItem value="clay">Clay</SelectItem>
                <SelectItem value="sandy">Sandy</SelectItem>
                <SelectItem value="silt">Silt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddFarmerOpen(false)}>Cancel</Button>
          <Button onClick={handleAddFarmerSubmit} disabled={isAddingFarmer || !newFarmer.username || !newFarmer.password}>
            {isAddingFarmer ? 'Saving...' : 'Save Farmer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Add Farm Dialog */}
    <Dialog open={isAddFarmOpen} onOpenChange={setIsAddFarmOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add New Farm</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Farm Name</Label>
            <Input value={newFarm.farm_name} onChange={e => setNewFarm({ ...newFarm, farm_name: e.target.value })} placeholder="Enter farm name" />
          </div>
          <div className="space-y-2">
            <Label>Farm Size (Hectares)</Label>
            <Input type="number" step="any" value={newFarm.farm_measurement} onChange={e => setNewFarm({ ...newFarm, farm_measurement: e.target.value })} placeholder="Enter size in hectares" />
          </div>
          <div className="space-y-2">
            <Label>Primary Soil Type</Label>
            <Select value={newFarm.soilType} onValueChange={val => setNewFarm({ ...newFarm, soilType: val })}>
              <SelectTrigger><SelectValue placeholder="Select soil type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="loam">Loam</SelectItem>
                <SelectItem value="clay">Clay</SelectItem>
                <SelectItem value="sandy">Sandy</SelectItem>
                <SelectItem value="silt">Silt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setIsAddFarmOpen(false); setSelectedFarmerId(null); }}>Cancel</Button>
          <Button onClick={handleAddFarmSubmit} disabled={isAddingFarm || !newFarm.farm_name}>
            {isAddingFarm ? 'Saving...' : 'Save Farm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <FarmersRegistryView
      farms={farms}
      farmers={farmers}
      searchQuery={searchQuery}
      onAddFarmer={() => setIsAddFarmerOpen(true)}
      onAddFarm={(id: string) => { setSelectedFarmerId(id); setIsAddFarmOpen(true); }}
      onEditFarmer={onEditFarmer}
      onDeleteFarmer={onDeleteFarmer}
      initialViewFarmerId={initialViewFarmerId}
      onInitialViewConsumed={onInitialViewConsumed}
    />
  </div>
);
