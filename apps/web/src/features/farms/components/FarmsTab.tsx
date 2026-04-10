import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MapPin, TrendingUp, Edit2, Trash2, User, Droplets, Activity, Thermometer, Wind, Leaf, Tractor } from 'lucide-react';
import { updateFarm, deleteFarm } from '@/features/farms/services/farmService';
import { useQueryClient } from '@tanstack/react-query';

// ─── Helpers ────────────────────────────────────────────────────────────────

const soilStatusInfo = (soilType: string) => {
  if (soilType === 'clay') return { label: 'Needs Attention', cls: 'tanim-soil-attention' };
  if (soilType === 'sandy') return { label: 'Critical', cls: 'tanim-soil-critical' };
  return { label: 'Healthy', cls: 'tanim-soil-healthy' };
};

const farmEmojis = ['🌾', '🌿', '🌱', '🍃', '🌳', '🌻'];

/** Safely extract a display string from farm_location, which may be a string OR a JSON object */
function getFarmLocation(farm: any): string {
  const raw = farm.farm_location ?? farm.farmLocation ?? farm.location;
  if (!raw) return 'Not specified';
  if (typeof raw === 'string') return raw.trim() || 'Not specified';
  if (typeof raw === 'object') {
    // Object shape: { address, latitude, longitude } or { name, ... }
    return raw.address || raw.name || raw.farmLocation || 'Not specified';
  }
  return 'Not specified';
}


// ─── FarmsTab (exported) ──────────────────────────────────────────────────────

export interface FarmsTabProps {
  farms: any[];
  farmers: any[];
  dbSoilTests?: any[];
  searchQuery?: string;
  isAddFarmOpen: boolean;
  setIsAddFarmOpen: (v: boolean) => void;
  newFarm: any;
  setNewFarm: (v: any) => void;
  isAddingFarm: boolean;
  handleAddFarmSubmit: () => void;
  selectedFarmerId: string | null;
  setSelectedFarmerId: (v: string | null) => void;
}

export const FarmsTab = ({
  farms, farmers, dbSoilTests = [], searchQuery = '',
  isAddFarmOpen, setIsAddFarmOpen,
  newFarm, setNewFarm, isAddingFarm, handleAddFarmSubmit,
  selectedFarmerId, setSelectedFarmerId,
}: FarmsTabProps) => {
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('recent');

  const queryClient = useQueryClient();
  const [editingFarm, setEditingFarm] = React.useState<any>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState('');
  const [deletingFarm, setDeletingFarm] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');
  const [viewingFarm, setViewingFarm] = React.useState<any>(null);

  const nextStatusFilter = () => {
    const cycle = ['all', 'healthy', 'attention', 'critical'];
    setStatusFilter(cycle[(cycle.indexOf(statusFilter) + 1) % cycle.length]);
    setPage(1);
  };

  const toggleSort = () => {
    setSortBy(s => s === 'recent' ? 'name' : 'recent');
    setPage(1);
  };

  let processedFarms = farms.filter((f: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const fName = (f.farm_name || f.name || '').toLowerCase();
      const fLoc = getFarmLocation(f).toLowerCase();
      if (!fName.includes(q) && !fLoc.includes(q)) return false;
    }
    if (statusFilter !== 'all') {
      const type = f.soilType || 'loam';
      if (statusFilter === 'healthy' && (type === 'clay' || type === 'sandy')) return false;
      if (statusFilter === 'attention' && type !== 'clay') return false;
      if (statusFilter === 'critical' && type !== 'sandy') return false;
    }
    return true;
  });

  if (sortBy === 'recent') {
    processedFarms.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  } else {
    processedFarms.sort((a, b) => (a.farm_name || a.name || '').localeCompare(b.farm_name || b.name || ''));
  }

  const totalArea = processedFarms.reduce((acc: number, f: any) => acc + Number(f.farm_measurement || 0), 0);
  const healthy = processedFarms.filter((f: any) => !['clay', 'sandy'].includes(f.soilType)).length;
  const attention = processedFarms.filter((f: any) => f.soilType === 'clay').length;
  const critical = processedFarms.filter((f: any) => f.soilType === 'sandy').length;
  const total = processedFarms.length || 1;
  const pctHealthy = Math.round((healthy / total) * 100);
  const pctAttention = Math.round((attention / total) * 100);
  const pctCritical = 100 - pctHealthy - pctAttention;
  const totalPages = Math.max(1, Math.ceil(processedFarms.length / rowsPerPage));
  const pageFarms = processedFarms.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div style={{ padding: '32px 36px', background: '#f0ede4', minHeight: '100vh' }}>
      {/* Add Farm Dialog */}
      <Dialog open={isAddFarmOpen} onOpenChange={(open) => { setIsAddFarmOpen(open); if (!open) setSelectedFarmerId(null); }}>
        <DialogContent style={{ maxWidth: 520 }}>
          <DialogHeader><DialogTitle>Add New Farm</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">

            {/* Farm Owner Selector */}
            <div className="space-y-2">
              <Label>Farm Owner <span style={{ color: '#e53935', marginLeft: 2 }}>*</span></Label>
              <Select
                value={selectedFarmerId ?? ''}
                onValueChange={(val) => setSelectedFarmerId(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a farmer..." />
                </SelectTrigger>
                <SelectContent>
                  {farmers.length === 0 ? (
                    <SelectItem value="__none__" disabled>No farmers registered yet</SelectItem>
                  ) : (
                    farmers.map((f: any) => (
                      <SelectItem key={f.farmer_id || f.id} value={f.farmer_id || f.id}>
                        {f.first_name && f.last_name
                          ? `${f.first_name} ${f.last_name} (${f.username})`
                          : f.username || f.name || f.farmer_id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div style={{ borderTop: '1px solid #f0ede4', margin: '4px 0' }} />

            <div className="space-y-2">
              <Label>Farm Name <span style={{ color: '#e53935', marginLeft: 2 }}>*</span></Label>
              <Input value={newFarm.farm_name} onChange={e => setNewFarm({ ...newFarm, farm_name: e.target.value })} placeholder="Enter farm name" />
            </div>
            <div className="space-y-2">
              <Label>Farm Location</Label>
              <Input value={newFarm.farm_location ?? ''} onChange={e => setNewFarm({ ...newFarm, farm_location: e.target.value })} placeholder="e.g. Cagayan de Oro, Region X" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Latitude (GPS) 🗺</Label>
                <Input type="number" step="any" value={newFarm.latitude ?? ''} onChange={e => setNewFarm({ ...newFarm, latitude: e.target.value })} placeholder="e.g. 8.4870" />
              </div>
              <div className="space-y-2">
                <Label>Longitude (GPS) 🗺</Label>
                <Input type="number" step="any" value={newFarm.longitude ?? ''} onChange={e => setNewFarm({ ...newFarm, longitude: e.target.value })} placeholder="e.g. 124.6470" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Farm Size (Hectares)</Label>
              <Input type="number" step="any" value={newFarm.farm_measurement} onChange={e => setNewFarm({ ...newFarm, farm_measurement: e.target.value })} placeholder="Enter size in hectares" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddFarmOpen(false); setSelectedFarmerId(null); }}>Cancel</Button>
            <Button onClick={handleAddFarmSubmit} disabled={isAddingFarm || !newFarm.farm_name || !selectedFarmerId}>
              {isAddingFarm ? 'Saving...' : 'Save Farm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1e2a1e', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
            Farms Management
          </h1>
          <p style={{ fontSize: 13.5, color: '#6a7a60', margin: 0, lineHeight: 1.6 }}>
            Monitor soil vitality, location data, and ownership details across your regional agricultural portfolio.
          </p>
        </div>
        <button onClick={() => setIsAddFarmOpen(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px',
          borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          background: '#3a5a40', color: '#fff', border: 'none', whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(58,90,64,0.25)',
        }}>
          <Plus size={15} /> Add New Farm
        </button>
      </div>

      {/* Stats row */}
      <div className="tanim-farms-stats-row">
        <div className="tanim-farm-stat-card">
          <div className="tanim-farm-stat-area-label">Total Managed Area</div>
          <div>
            <span className="tanim-farm-stat-area-value">{totalArea.toLocaleString()}</span>
            <span className="tanim-farm-stat-area-unit">Hectares</span>
          </div>
          <div className="tanim-farm-stat-area-trend">
            <TrendingUp size={14} />
            +4.2% from last season
          </div>
        </div>
        <div className="tanim-farm-soil-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="tanim-farm-soil-card-title">Soil Health Distribution</div>
            <button className="tanim-farm-soil-report-link">View Detailed Report →</button>
          </div>
          <div className="tanim-farm-soil-bar">
            <div className="tanim-farm-soil-bar-seg" style={{ width: `${pctHealthy}%`, background: '#4caf50' }} />
            <div className="tanim-farm-soil-bar-seg" style={{ width: `${pctAttention}%`, background: '#f5a623' }} />
            <div className="tanim-farm-soil-bar-seg" style={{ width: `${Math.max(pctCritical, 0)}%`, background: '#e53935' }} />
          </div>
          <div className="tanim-farm-soil-legend">
            <div className="tanim-farm-soil-legend-item"><div className="tanim-farm-soil-legend-dot" style={{ background: '#4caf50' }} />{pctHealthy}% Optimal</div>
            <div className="tanim-farm-soil-legend-item"><div className="tanim-farm-soil-legend-dot" style={{ background: '#f5a623' }} />{pctAttention}% Attention</div>
            <div className="tanim-farm-soil-legend-item"><div className="tanim-farm-soil-legend-dot" style={{ background: '#e53935' }} />{Math.max(pctCritical, 0)}% Critical</div>
          </div>
        </div>
      </div>

      <div className="tanim-farms-filter-bar">
        <div className="tanim-farms-filter-pills" style={{ gap: 12 }}>
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
            <SelectTrigger style={{ width: 140, height: 34, borderRadius: 20, fontSize: 12, fontWeight: 600, background: statusFilter !== 'all' ? '#eaf5e9' : '#fff', border: '1px solid #e0dacf', color: '#4a5a40' }}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="attention">Attention</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setPage(1); }}>
            <SelectTrigger style={{ width: 150, height: 34, borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#fff', border: '1px solid #e0dacf', color: '#4a5a40' }}>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Updated</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="tanim-farms-showing">
          Showing <strong>{pageFarms.length}</strong> of <strong>{processedFarms.length}</strong> farms
        </div>
      </div>

      <div className="tanim-farms-table-wrap">
        {processedFarms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8a9880', fontSize: '14px' }}>
            No farms match your search or filters.
          </div>
        ) : (
          <>
            <table className="tanim-farms-table">
              <thead>
                <tr>
                  <th>Farm Name</th>
                  <th>Location</th>
                  <th>Owner (Farmer)</th>
                  <th>Soil Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageFarms.map((farm: any, idx: number) => {
                  const farmer = farmers.find((f: any) => f.farmer_id === farm.farmer_id || f.id === farm.farmer_id);
                  const ownerName = farmer?.username || farmer?.name || 'Unassigned';
                  const status = soilStatusInfo(farm.soilType || 'loam');
                  const emoji = farmEmojis[(idx + (page - 1) * rowsPerPage) % farmEmojis.length];
                  const cropLabel = farm.soilType
                    ? `${farm.soilType.charAt(0).toUpperCase() + farm.soilType.slice(1)} Soil`
                    : 'Mixed Crops';
                  return (
                    <tr
                      key={farm.farm_id || farm.id}
                      onClick={() => setViewingFarm(farm)}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fcfbef'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td>
                        <div className="tanim-farm-name-cell">
                          <div className="tanim-farm-thumb">{emoji}</div>
                          <div className="tanim-farm-name-text">
                            <strong>{farm.farm_name || farm.name}</strong>
                            <span>{cropLabel} • {farm.farm_measurement || 0} Hectares</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="tanim-farm-location">
                          <MapPin size={13} style={{ marginTop: 2, flexShrink: 0, color: '#7a8a70' }} />
                          {getFarmLocation(farm)}
                        </div>
                      </td>
                      <td>
                        {farmer ? (
                          <div className="tanim-farm-owner-cell">
                            <div className="tanim-farm-owner-avatar">{ownerName.charAt(0).toUpperCase()}</div>
                            <span className="tanim-farm-owner-name">{ownerName}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#aaa', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span className={`tanim-soil-badge ${status.cls}`}>
                          <span className="tanim-soil-badge-dot" />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-start' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            title="Edit Farm"
                            style={{ width: 28, height: 28, color: '#4a5a40', background: 'none', border: '1.5px solid #c0d4b0', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => { e.stopPropagation(); setEditingFarm(farm); }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            title="Delete Farm"
                            style={{ width: 28, height: 28, color: '#c0392b', background: 'none', border: '1.5px solid #f5c6a0', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => { e.stopPropagation(); setDeletingFarm(farm); }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="tanim-farms-pagination">
              <div className="tanim-pagination-pages">
                <button className="tanim-pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
                {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`tanim-pagination-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                {totalPages > 4 && <span className="tanim-pagination-btn" style={{ border: 'none', background: 'transparent' }}>...</span>}
                {totalPages > 4 && (
                  <button className={`tanim-pagination-btn ${page === totalPages ? 'active' : ''}`} onClick={() => setPage(totalPages)}>{totalPages}</button>
                )}
                <button className="tanim-pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>›</button>
              </div>
              <div className="tanim-pagination-rows">
                Rows per page:
                <select value={rowsPerPage} onChange={() => { }}><option>10</option></select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Farm Dialog */}
      <Dialog open={!!editingFarm} onOpenChange={(open) => !open && setEditingFarm(null)}>
        <DialogContent style={{ maxWidth: 520 }}>
          <DialogHeader><DialogTitle>Edit Farm</DialogTitle></DialogHeader>
          {editingFarm && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Farm Name <span style={{ color: '#e53935', marginLeft: 2 }}>*</span></Label>
                <Input defaultValue={editingFarm.farm_name || editingFarm.name} onChange={e => setEditingFarm({ ...editingFarm, farm_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Farm Location</Label>
                <Input defaultValue={getFarmLocation(editingFarm)} onChange={e => setEditingFarm({ ...editingFarm, farm_location: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="space-y-2">
                  <Label>Latitude (GPS)</Label>
                  <Input type="number" step="any" defaultValue={editingFarm.latitude} onChange={e => setEditingFarm({ ...editingFarm, latitude: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Longitude (GPS)</Label>
                  <Input type="number" step="any" defaultValue={editingFarm.longitude} onChange={e => setEditingFarm({ ...editingFarm, longitude: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Farm Size (Hectares)</Label>
                <Input type="number" step="any" defaultValue={editingFarm.farm_measurement} onChange={e => setEditingFarm({ ...editingFarm, farm_measurement: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFarm(null)}>Cancel</Button>
            <Button disabled={isUpdating || !(editingFarm?.farm_name || editingFarm?.name)} onClick={async () => {
              setIsUpdating(true);
              const loc = editingFarm.farm_location !== undefined ? (typeof editingFarm.farm_location === 'object' ? getFarmLocation(editingFarm) : editingFarm.farm_location) : getFarmLocation(editingFarm);
              await updateFarm(editingFarm.farm_id || editingFarm.id, {
                farm_name: editingFarm.farm_name || editingFarm.name,
                farm_location: loc,
                farm_measurement: Number(editingFarm.farm_measurement) || 0,
                latitude: editingFarm.latitude ? Number(editingFarm.latitude) : null,
                longitude: editingFarm.longitude ? Number(editingFarm.longitude) : null,
              });
              queryClient.invalidateQueries({ queryKey: ['farms'] });
              setIsUpdating(false);
              setEditingFarm(null);
            }}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Farm Dialog */}
      <Dialog open={!!deletingFarm} onOpenChange={(open) => { if (!open) { setDeletingFarm(null); setDeleteError(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Farm</DialogTitle></DialogHeader>
          <p style={{ fontSize: 14, color: '#555' }}>
            Are you sure you want to delete <strong>{deletingFarm?.farm_name || deletingFarm?.name}</strong>? This action cannot be undone.
          </p>
          {deleteError && (
            <div style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#b91c1c' }}>
              ⚠️ {deleteError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeletingFarm(null); setDeleteError(''); }}>Cancel</Button>
            <Button variant="destructive" disabled={isDeleting} onClick={async () => {
              setIsDeleting(true);
              setDeleteError('');
              try {
                await deleteFarm(deletingFarm.farm_id || deletingFarm.id);
                queryClient.invalidateQueries({ queryKey: ['farms'] });
                setDeletingFarm(null);
              } catch (err: any) {
                setDeleteError(err?.message || 'Failed to delete farm. Please try again.');
              } finally {
                setIsDeleting(false);
              }
            }}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Farm & Farmer Details Modal */}
      <Dialog open={!!viewingFarm} onOpenChange={(open) => !open && setViewingFarm(null)}>
        <DialogContent style={{ maxWidth: 640, borderRadius: 16, padding: 0, overflow: 'hidden' }}>
          {viewingFarm && (() => {
            const farmer = farmers.find((f: any) => f.farmer_id === viewingFarm.farmer_id || f.id === viewingFarm.farmer_id);
            // Filter ALL soil tests for this farm by farm_id, sorted most recent first
            const farmId = viewingFarm.farm_id || viewingFarm.id;
            const farmSoilTests = dbSoilTests
              .filter((t: any) => t.farm_id === farmId)
              .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
            const soilTest = farmSoilTests[0] || null; // most recent
            const farmerName = farmer ? `${farmer.first_name || ''} ${farmer.last_name || ''}`.trim() || farmer.username || farmer.name : 'Unknown Farmer';
            const cropName = "Rice, Corn"; // Mock fallback

            return (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Header - Farm Banner */}
                <div style={{ background: 'linear-gradient(135deg, #3a5a40, #588157)', padding: '24px 32px', color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px' }}>
                      <Tractor size={20} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{viewingFarm.farm_name || viewingFarm.name || 'Unnamed Farm'}</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#d4e8c0', opacity: 0.9 }}>
                    <MapPin size={14} />
                    <span>{getFarmLocation(viewingFarm)}</span>
                  </div>
                </div>

                <div style={{ padding: '28px 32px', background: '#fcfbef', display: 'flex', flexDirection: 'column', gap: 24 }}>

                  {/* Farmer Details */}
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#3a5a40', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={16} /> Farmer Information
                    </h3>
                    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e0ddd4', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 2 }}>Name</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>{farmerName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 2 }}>Phone Number</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>{farmer?.phone_number || farmer?.phone || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Farm & Crop Details */}
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#3a5a40', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Leaf size={16} /> Agricultural Details
                    </h3>
                    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e0ddd4', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 2 }}>Total Area</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>{viewingFarm.farm_measurement || viewingFarm.size ? `${viewingFarm.farm_measurement || viewingFarm.size} Hectares` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 2 }}>Crops Planted</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>{viewingFarm.currentCrops?.join(', ') || cropName}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 2 }}>GPS Coordinates</div>
                        <div style={{ fontSize: 13, color: '#4a5a40', fontFamily: 'monospace', background: '#f5f0e8', padding: '6px 10px', borderRadius: 6, display: 'inline-block' }}>
                          {viewingFarm.latitude && viewingFarm.longitude
                            ? `${Number(viewingFarm.latitude).toFixed(6)}, ${Number(viewingFarm.longitude).toFixed(6)}`
                            : 'Not mapped'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Soil Health Parameters */}
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#3a5a40', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Activity size={16} /> Soil Health Parameters
                    </h3>
                    {soilTest ? (
                      <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e0ddd4' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, background: '#e8f0e0', color: '#4a5a40', padding: '4px 10px', borderRadius: 20 }}>
                            {viewingFarm.soilType ? `${viewingFarm.soilType.charAt(0).toUpperCase()}${viewingFarm.soilType.slice(1)} Soil` : 'Unknown Soil Type'}
                          </span>
                          <span style={{ fontSize: 11, color: '#8a9880' }}>
                            Last tested: {soilTest.created_at
                              ? new Date(soilTest.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              : 'Unknown date'}
                          </span>
                          {farmSoilTests.length > 1 && (
                            <span style={{ fontSize: 11, color: '#a3b18a', marginLeft: 'auto' }}>
                              {farmSoilTests.length} test records
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                          <div style={{ background: '#fdfbfa', border: '1px solid #f0ede4', borderRadius: 10, padding: '12px 16px' }}>
                            <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 4 }}>Nitrogen (N)</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#2e3a28' }}>{soilTest.nitrogen ?? '—'}</div>
                          </div>
                          <div style={{ background: '#fdfbfa', border: '1px solid #f0ede4', borderRadius: 10, padding: '12px 16px' }}>
                            <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 4 }}>Phosphorus (P)</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#2e3a28' }}>{soilTest.phosphorus ?? '—'}</div>
                          </div>
                          <div style={{ background: '#fdfbfa', border: '1px solid #f0ede4', borderRadius: 10, padding: '12px 16px' }}>
                            <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 4 }}>Potassium (K)</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#2e3a28' }}>{soilTest.potassium ?? '—'}</div>
                          </div>
                          <div style={{ background: '#fdfbfa', border: '1px solid #f0ede4', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Thermometer size={16} color="#8a9880" />
                            <div>
                              <div style={{ fontSize: 10, color: '#8a9880' }}>pH Level</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>{soilTest.ph ?? '—'}</div>
                            </div>
                          </div>
                          <div style={{ background: '#fdfbfa', border: '1px solid #f0ede4', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Droplets size={16} color="#8a9880" />
                            <div>
                              <div style={{ fontSize: 10, color: '#8a9880' }}>Moisture</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>{soilTest.moisture != null ? `${soilTest.moisture}%` : '—'}</div>
                            </div>
                          </div>
                          <div style={{ background: '#fdfbfa', border: '1px solid #f0ede4', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Wind size={16} color="#8a9880" />
                            <div>
                              <div style={{ fontSize: 10, color: '#8a9880' }}>Temperature / Salinity</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>
                                {soilTest.temperature != null ? `${soilTest.temperature}°` : '—'}
                                {soilTest.salinity != null ? ` / ${soilTest.salinity}` : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #e0ddd4', textAlign: 'center' }}>
                        <div style={{ color: '#8a9880', marginBottom: 6 }}>
                          <Activity size={24} style={{ margin: '0 auto', opacity: 0.5 }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#4a5a40' }}>No Soil Data Available</div>
                        <div style={{ fontSize: 11, color: '#8a9880', marginTop: 4 }}>A soil test has not been recorded for this farm yet.</div>
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
