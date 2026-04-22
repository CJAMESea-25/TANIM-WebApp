import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MapPin, TrendingUp, Edit2, Trash2, User, Leaf, Tractor, History, Download, Loader2 } from 'lucide-react';
import { updateFarm, deleteFarm } from '@/features/farms/services/farmService';
import {
  debugLogAllFarmingSessions,
  fetchFarmingSessionsForFarm,
  soilScalarsFromSnapshot,
  sessionCropLabel,
  sessionDisplayStartIso,
  formatCalendarDateForDisplay,
  type FarmingSessionRow,
} from '@/features/farms/services/farmingSessionService';
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

/** Parse GPS / numeric fields from form strings; preserves 0, treats blank as null */
function toNumOrNull(v: unknown): number | null {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pad each column so values align in plain-text tools. Also enforce minimum widths so short
 * headers/values still reserve space when the file is opened in Excel (default column sizing).
 */
function padCsvColumns(matrix: string[][]): string[][] {
  if (matrix.length === 0) return matrix;
  const colCount = matrix[0].length;
  const maxLen = new Array(colCount).fill(0);
  for (const r of matrix) {
    for (let c = 0; c < colCount; c++) {
      const len = (r[c] ?? '').length;
      if (len > maxLen[c]) maxLen[c] = len;
    }
  }
  // Minimum display width per column (chars), matched to header / typical values.
  const minWidths = [22, 24, 18, 16, 14, 18, 18, 20, 22, 22, 12, 18, 16, 22];
  const extra = 18;
  const target = maxLen.map((m, c) => Math.max(m + extra, minWidths[c] ?? 16));
  return matrix.map((r) => r.map((cell, c) => (cell ?? '').padEnd(target[c], ' ')));
}

function csvQuoteCell(cell: string): string {
  return `"${String(cell).replace(/"/g, '""')}"`;
}

function cropHistoryMatrixToCsv(matrix: string[][]): string {
  const body = matrix.map((row) => row.map(csvQuoteCell).join(',')).join('\r\n');
  // Excel (especially with regional list-separator settings) uses this first line to lock comma as the delimiter.
  return `sep=,\r\n${body}`;
}

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.click();
  URL.revokeObjectURL(url);
}

function buildCropHistoryCsv(
  farmName: string,
  farmerName: string,
  sessions: FarmingSessionRow[],
  fmtDate: (iso?: string | null) => string,
): string {
  const headers = [
    'Farm name',
    'Farmer name',
    'Cycle start',
    'Crop',
    'Status',
    'End date',
    'Soil date',
    'Nitrogen (N)',
    'Phosphorus (P)',
    'Potassium (K)',
    'pH',
    'Moisture %',
    'Temp. (C)',
    'Salinity (EC)',
  ];
  const rows: string[][] = [headers];
  for (const row of sessions) {
    const s = soilScalarsFromSnapshot(row.soil_snapshot);
    const started = sessionDisplayStartIso(row);
    const ended = row.ended_at;
    const activeRow = !ended;
    const soilDate = s?.received_at || started;
    rows.push([
      farmName,
      farmerName,
      fmtDate(started),
      sessionCropLabel(row),
      activeRow ? 'Active' : 'Ended',
      activeRow ? '—' : fmtDate(ended),
      fmtDate(soilDate),
      s?.nitrogen != null ? String(s.nitrogen) : '—',
      s?.phosphorus != null ? String(s.phosphorus) : '—',
      s?.potassium != null ? String(s.potassium) : '—',
      s?.ph != null ? String(s.ph) : '—',
      s?.moisture != null ? `${s.moisture}%` : '—',
      s?.temperature != null ? `${s.temperature}` : '—',
      s?.salinity != null ? String(s.salinity) : '—',
    ]);
  }
  const padded = padCsvColumns(rows);
  return cropHistoryMatrixToCsv(padded);
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
  /** Farm ID to deep-link open immediately (from global search) */
  initialViewFarmId?: string | null;
  /** Called once the initial-view modal has been triggered, to reset the parent */
  onInitialViewConsumed?: () => void;
  addFarmError?: string;
  onAddFarmOpenChange?: (open: boolean) => void;
}

export const FarmsTab = ({
  farms, farmers, dbSoilTests = [], searchQuery = '',
  isAddFarmOpen, setIsAddFarmOpen,
  newFarm, setNewFarm, isAddingFarm, handleAddFarmSubmit,
  selectedFarmerId, setSelectedFarmerId,
  initialViewFarmId,
  onInitialViewConsumed,
  addFarmError = '',
  onAddFarmOpenChange,
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

  // Auto-open modal when navigated from global search
  React.useEffect(() => {
    if (!initialViewFarmId || farms.length === 0) return;
    const target = farms.find(
      (f: any) => (f.farm_id || f.id) === initialViewFarmId
    );
    if (target) {
      setViewingFarm(target);
      onInitialViewConsumed?.();
    }
  }, [initialViewFarmId, farms]);

  const [farmSessionState, setFarmSessionState] = React.useState<{
    active: FarmingSessionRow | null;
    history: FarmingSessionRow[];
    loading: boolean;
    error: string;
  }>({ active: null, history: [], loading: false, error: '' });

  React.useEffect(() => {
    const farmId = viewingFarm?.farm_id || viewingFarm?.id;
    if (!farmId) {
      setFarmSessionState({ active: null, history: [], loading: false, error: '' });
      return;
    }
    let cancelled = false;
    setFarmSessionState((s) => ({ ...s, loading: true, error: '' }));
    debugLogAllFarmingSessions().catch((e) =>
      console.warn('[farming_session] debugLogAllFarmingSessions failed:', e),
    );
    fetchFarmingSessionsForFarm(farmId)
      .then(({ active, history }) => {
        if (cancelled) return;
        setFarmSessionState({
          active,
          history,
          loading: false,
          error: '',
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : 'Failed to load farming sessions';
        setFarmSessionState({
          active: null,
          history: [],
          loading: false,
          error: message,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [viewingFarm]);

  const nextStatusFilter = () => {
    const cycle = ['all', 'healthy', 'attention', 'critical', 'nodata'];
    setStatusFilter(cycle[(cycle.indexOf(statusFilter) + 1) % cycle.length]);
    setPage(1);
  };

  const toggleSort = () => {
    setSortBy(s => s === 'recent' ? 'name' : 'recent');
    setPage(1);
  };

  const getFarmSoilStatus = (farm: any, dbSoilTests: any[]) => {
    const farmTests = dbSoilTests.filter((t: any) => t.farm_id === farm.farm_id || t.farm_id === farm.id);
    const validTests = farmTests.filter((t: any) => {
      const ph = Number(t.ph || t.pH || 0);
      const n = Number(t.nitrogen || 0);
      const p = Number(t.phosphorus || 0);
      const k = Number(t.potassium || 0);
      return ph !== 0 || n !== 0 || p !== 0 || k !== 0;
    });
    if (validTests.length === 0) return { label: 'No Soil Data', cls: 'tanim-soil-nodata', raw: 'nodata' };

    validTests.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    const latest = validTests[0];
    const classification = (latest.npk_classification || latest.classification || '').toLowerCase();

    if (classification.includes('optimum') || classification === 'high' || classification === 'healthy') return { label: 'Healthy', cls: 'tanim-soil-healthy', raw: 'healthy' };
    if (classification.includes('deficient') || classification.includes('critical') || classification === 'low') return { label: 'Critical', cls: 'tanim-soil-critical', raw: 'critical' };

    const pH = Number(latest.ph || latest.pH || 7);
    if (pH < 5.0 || pH > 8.0) return { label: 'Critical', cls: 'tanim-soil-critical', raw: 'critical' };
    if (pH < 5.5 || pH > 7.5) return { label: 'Needs Attention', cls: 'tanim-soil-attention', raw: 'attention' };
    return { label: 'Healthy', cls: 'tanim-soil-healthy', raw: 'healthy' };
  };

  let processedFarms = farms.filter((f: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const fName = (f.farm_name || f.name || '').toLowerCase();
      const fLoc = getFarmLocation(f).toLowerCase();
      if (!fName.includes(q) && !fLoc.includes(q)) return false;
    }
    if (statusFilter !== 'all') {
      const s = getFarmSoilStatus(f, dbSoilTests);
      if (s.raw !== statusFilter) return false;
    }
    return true;
  });

  if (sortBy === 'recent') {
    processedFarms.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  } else {
    processedFarms.sort((a, b) => (a.farm_name || a.name || '').localeCompare(b.farm_name || b.name || ''));
  }


  const totalArea = processedFarms.reduce((acc: number, f: any) => acc + Number(f.farm_measurement || 0), 0);
  let healthy = 0, attention = 0, critical = 0, nodata = 0;
  processedFarms.forEach((f: any) => {
    const s = getFarmSoilStatus(f, dbSoilTests);
    if (s.raw === 'healthy') healthy++;
    else if (s.raw === 'critical') critical++;
    else if (s.raw === 'attention') attention++;
    else nodata++;
  });
  const total = processedFarms.length || 1;
  const pctHealthy = Math.round((healthy / total) * 100);
  const pctAttention = Math.round((attention / total) * 100);
  const pctCritical = Math.round((critical / total) * 100);
  const pctNoData = nodata > 0 ? 100 - pctHealthy - pctAttention - pctCritical : 0;
  // Fallback to ensuring total is 100 without negative pct
  const actualPctHealthy = nodata === 0 && (pctHealthy + pctAttention + pctCritical) < 100 ? pctHealthy + (100 - (pctHealthy + pctAttention + pctCritical)) : pctHealthy;
  const totalPages = Math.max(1, Math.ceil(processedFarms.length / rowsPerPage));
  const pageFarms = processedFarms.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleExportFarms = () => {
    const headers = ['Farm Name', 'Location', 'Owner', 'Area (Hectares)', 'Soil Type'];
    const rows = [headers];
    processedFarms.forEach((farm: any) => {
      const farmer = farmers.find((f: any) => f.farmer_id === farm.farmer_id || f.id === farm.farmer_id);
      const ownerName = farmer ? `${farmer.first_name || ''} ${farmer.last_name || ''}`.trim() || farmer.username || farmer.name : 'Unassigned';
      rows.push([
        farm.farm_name || farm.name || 'Unnamed',
        getFarmLocation(farm),
        ownerName,
        String(farm.farm_measurement || 0),
        farm.soilType || 'loam'
      ]);
    });
    const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farms_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '16px 36px 32px 36px', background: '#f0ede4', minHeight: '100vh' }}>
      {/* Add Farm Dialog */}
      <Dialog open={isAddFarmOpen} onOpenChange={(open) => { setIsAddFarmOpen(open); if (!open) setSelectedFarmerId(null); onAddFarmOpenChange?.(open); }}>
        <DialogContent
          className="flex max-h-[90dvh] w-[calc(100vw-1.25rem)] max-w-[520px] flex-col gap-0 overflow-hidden border bg-background p-0 shadow-lg sm:w-full
            left-[50%] top-[max(0.5rem,env(safe-area-inset-top,0px))] z-50 -translate-x-1/2 translate-y-0
            sm:top-[50%] sm:-translate-y-1/2"
        >
          <div className="shrink-0 border-b px-6 pb-3 pt-6 pr-14">
            <DialogHeader className="text-left"><DialogTitle>Add New Farm</DialogTitle></DialogHeader>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-contain px-6 py-3 [-webkit-overflow-scrolling:touch]">
          <div className="space-y-4 min-w-0">
            {addFarmError && (
              <div style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#b91c1c' }}>
                {addFarmError}
              </div>
            )}

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
                <SelectContent style={{ zIndex: 99999 }} position="popper">
                  {farmers.length === 0 ? (
                    <SelectItem value="__none__" disabled>No farmers registered yet</SelectItem>
                  ) : (
                    farmers.map((f: any) => (
                      <SelectItem key={f.farmer_id || f.id} value={String(f.farmer_id || f.id)}>
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
            <div className="space-y-2">
              <Label>Farm Size (Hectares)</Label>
              <Input type="number" step="any" value={newFarm.farm_measurement} onChange={e => setNewFarm({ ...newFarm, farm_measurement: e.target.value })} placeholder="Enter size in hectares" />
            </div>
          </div>
          </div>
          <div className="shrink-0 border-t bg-background px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setIsAddFarmOpen(false); setSelectedFarmerId(null); }}>Cancel</Button>
              <Button className="w-full sm:w-auto gap-2" onClick={handleAddFarmSubmit} disabled={isAddingFarm || !newFarm.farm_name || !selectedFarmerId}>
                {isAddingFarm && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAddingFarm ? 'Saving Farm...' : 'Save Farm'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>


      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1e2a1e', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
            Farms Management
          </h1>
          <p style={{ fontSize: 13.5, color: '#6a7a60', margin: 0, lineHeight: 1.6 }}>
            Monitor farms across Bukidnon.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <button onClick={handleExportFarms} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: '#fff', border: '1.5px solid #d5cfc5', color: '#4a5a40',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <Download size={14} /> Export Registry
          </button>
          <button onClick={() => setIsAddFarmOpen(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: '#3a5a40', color: '#fff', border: 'none', whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(58,90,64,0.25)',
          }}>
            <Plus size={15} /> Add New Farm
          </button>
        </div>
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
            {actualPctHealthy > 0 && <div className="tanim-farm-soil-bar-seg" style={{ width: `${actualPctHealthy}%`, background: '#4caf50' }} />}
            {pctAttention > 0 && <div className="tanim-farm-soil-bar-seg" style={{ width: `${pctAttention}%`, background: '#f5a623' }} />}
            {pctCritical > 0 && <div className="tanim-farm-soil-bar-seg" style={{ width: `${pctCritical}%`, background: '#e53935' }} />}
            {pctNoData > 0 && <div className="tanim-farm-soil-bar-seg" style={{ width: `${pctNoData}%`, background: '#b0b8a0' }} />}
          </div>
          <div className="tanim-farm-soil-legend">
            <div className="tanim-farm-soil-legend-item"><div className="tanim-farm-soil-legend-dot" style={{ background: '#4caf50' }} />{actualPctHealthy}% Optimal</div>
            <div className="tanim-farm-soil-legend-item"><div className="tanim-farm-soil-legend-dot" style={{ background: '#f5a623' }} />{pctAttention}% Attention</div>
            <div className="tanim-farm-soil-legend-item"><div className="tanim-farm-soil-legend-dot" style={{ background: '#e53935' }} />{pctCritical}% Critical</div>
            <div className="tanim-farm-soil-legend-item"><div className="tanim-farm-soil-legend-dot" style={{ background: '#b0b8a0' }} />{pctNoData}% No Data</div>
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
              <SelectItem value="nodata">No Soil Data</SelectItem>
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

      <div className="tanim-farms-table-outer" style={{ marginTop: '16px' }}>
        <div className="tanim-farms-table-wrap">
        {processedFarms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8a9880', fontSize: '14px' }}>
            No farms match your search or filters.
          </div>
        ) : (
          <>
            <table className="tanim-farms-table" style={{ width: '100%' }}>
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
                  let fullName = farmer && (farmer.first_name || farmer.last_name) 
                    ? `${farmer.first_name || ''} ${farmer.last_name || ''}`.trim() 
                    : null;
                  const ownerName = fullName || farmer?.username || farmer?.name || 'Unassigned';
                  const status = getFarmSoilStatus(farm, dbSoilTests);
                  const emoji = farmEmojis[(idx + (page - 1) * rowsPerPage) % farmEmojis.length];
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
                            <span>{farm.farm_measurement || 0} Hectares</span>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              const locStr = getFarmLocation(farm);
                              setUpdateError('');
                              setEditingFarm({
                                ...farm,
                                farm_name: farm.farm_name || farm.name || '',
                                farm_location:
                                  typeof farm.farm_location === 'string'
                                    ? farm.farm_location
                                    : locStr === 'Not specified'
                                      ? ''
                                      : locStr,
                                latitude: farm.latitude != null ? String(farm.latitude) : '',
                                longitude: farm.longitude != null ? String(farm.longitude) : '',
                                farm_measurement:
                                  farm.farm_measurement != null ? String(farm.farm_measurement) : '',
                              });
                            }}
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
      </div>

      {/* Edit Farm Dialog */}
      <Dialog
        open={!!editingFarm}
        onOpenChange={(open) => {
          if (!open) {
            setEditingFarm(null);
            setUpdateError('');
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }}>
          <DialogHeader><DialogTitle>Edit Farm</DialogTitle></DialogHeader>
          {editingFarm && (
            <div className="space-y-4 py-2">
              {updateError && (
                <div style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#b91c1c' }}>
                  {updateError}
                </div>
              )}
              <div className="space-y-2">
                <Label>Farm Name <span style={{ color: '#e53935', marginLeft: 2 }}>*</span></Label>
                <Input
                  value={editingFarm.farm_name ?? ''}
                  onChange={e => setEditingFarm({ ...editingFarm, farm_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Farm Location</Label>
                <Input
                  value={typeof editingFarm.farm_location === 'string' ? editingFarm.farm_location : ''}
                  onChange={e => setEditingFarm({ ...editingFarm, farm_location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="space-y-2">
                  <Label>Latitude (GPS)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={editingFarm.latitude ?? ''}
                    onChange={e => setEditingFarm({ ...editingFarm, latitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude (GPS)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={editingFarm.longitude ?? ''}
                    onChange={e => setEditingFarm({ ...editingFarm, longitude: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Farm Size (Hectares)</Label>
                <Input
                  type="number"
                  step="any"
                  value={editingFarm.farm_measurement ?? ''}
                  onChange={e => setEditingFarm({ ...editingFarm, farm_measurement: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingFarm(null); setUpdateError(''); }}>Cancel</Button>
            <Button
              disabled={isUpdating || !(editingFarm?.farm_name || editingFarm?.name)}
              onClick={async () => {
                if (!editingFarm) return;
                setIsUpdating(true);
                setUpdateError('');
                try {
                  const locRaw = editingFarm.farm_location;
                  const loc =
                    typeof locRaw === 'string'
                      ? locRaw
                      : getFarmLocation(editingFarm);
                  await updateFarm(editingFarm.farm_id || editingFarm.id, {
                    farm_name: editingFarm.farm_name || editingFarm.name,
                    farm_location: loc,
                    farm_measurement: Number(editingFarm.farm_measurement) || 0,
                    latitude: toNumOrNull(editingFarm.latitude),
                    longitude: toNumOrNull(editingFarm.longitude),
                  });
                  await queryClient.invalidateQueries({ queryKey: ['farms'] });
                  setEditingFarm(null);
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : 'Failed to update farm.';
                  setUpdateError(message);
                } finally {
                  setIsUpdating(false);
                }
              }}
            >
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
        <DialogContent
          style={{
            maxWidth: 1120,
            width: 'min(calc(100vw - 32px), 1120px)',
            borderRadius: 16,
            padding: 0,
            overflow: 'hidden',
            maxHeight: 'min(90vh, 900px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {viewingFarm && (() => {
            const farmer = farmers.find((f: any) => f.farmer_id === viewingFarm.farmer_id || f.id === viewingFarm.farmer_id);
            const { active: fsActive, history: fsHistory, loading: fsLoading, error: fsError } = farmSessionState;
            const fmtSessionDate = formatCalendarDateForDisplay;
            const cropFromSession = fsActive
              ? sessionCropLabel(fsActive)
              : fsHistory.length
                ? sessionCropLabel(fsHistory[0])
                : null;
            const farmerName = farmer ? `${farmer.first_name || ''} ${farmer.last_name || ''}`.trim() || farmer.username || farmer.name : 'Unknown Farmer';
            const farmDisplayName = viewingFarm.farm_name || viewingFarm.name || 'Unnamed Farm';

            return (
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%', flex: 1, minHeight: 0 }}>
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

                <div
                  style={{
                    padding: '28px 32px',
                    background: '#fcfbef',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                    minWidth: 0,
                    width: '100%',
                    boxSizing: 'border-box',
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }}
                >

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
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>
                          {viewingFarm.currentCrops?.join(', ') || cropFromSession || '—'}
                        </div>
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

                  {/* Crop history: session timeline + soil snapshot per row */}
                  <div style={{ minWidth: 0, width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                        marginBottom: 12,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#3a5a40',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <History size={16} /> Crop History
                      </h3>
                      {fsHistory.length > 0 && !fsLoading && !fsError && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-[#d0d4c8] text-[#3a5a40] hover:bg-[#f0ede4]"
                          onClick={() => {
                            const csv = buildCropHistoryCsv(farmDisplayName, farmerName, fsHistory, fmtSessionDate);
                            const safeFarm = farmDisplayName.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 60) || 'farm';
                            const stamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
                            downloadTextFile(
                              `crop-history_${safeFarm}_${stamp}.csv`,
                              `\uFEFF${csv}`,
                              'text/csv;charset=utf-8;',
                            );
                          }}
                        >
                          <Download size={14} className="mr-1.5" />
                          Export CSV
                        </Button>
                      )}
                    </div>
                    {fsLoading ? (
                      <div style={{ fontSize: 13, color: '#6a7a60', padding: 16 }}>Loading crop history…</div>
                    ) : fsError ? (
                      <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 12, padding: 12, fontSize: 12, color: '#b91c1c' }}>{fsError}</div>
                    ) : fsHistory.length === 0 ? (
                      <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e0ddd4', textAlign: 'center', fontSize: 12, color: '#8a9880' }}>
                        No farming sessions recorded for this farm yet. When sessions run, crop choices and any soil snapshots will appear here.
                      </div>
                    ) : (
                      <div
                        style={{
                          background: '#fff',
                          borderRadius: 12,
                          border: '1px solid #e0ddd4',
                          maxWidth: '100%',
                          minWidth: 0,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          role="region"
                          aria-label="Crop history table, scroll horizontally for all columns"
                          style={{
                            maxHeight: 280,
                            width: '100%',
                            minWidth: 0,
                            overflowX: 'scroll',
                            overflowY: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            scrollbarGutter: 'stable',
                          }}
                        >
                          <table
                            style={{
                              width: 'max-content',
                              minWidth: '100%',
                              borderCollapse: 'collapse',
                              fontSize: 11,
                            }}
                          >
                            <thead>
                              <tr style={{ background: '#f5f2ea', color: '#4a5a40', textAlign: 'left' }}>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>Farm name</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>Farmer name</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>Cycle start</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>Crop</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>Status</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>End date</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>Soil date</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }} title="Nitrogen">N</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }} title="Phosphorus">P</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }} title="Potassium">K</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>pH</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }} title="Moisture %">Moisture</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }} title="Temperature">Temp. (°C)</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' }} title="Salinity / EC">Sal. (EC)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fsHistory.map((row, idx) => {
                                const s = soilScalarsFromSnapshot(row.soil_snapshot);
                                const started = sessionDisplayStartIso(row);
                                const ended = row.ended_at;
                                const activeRow = !ended;
                                const soilDate = s?.received_at || started;
                                return (
                                  <tr key={`crop-history-${started || idx}-${idx}`} style={{ borderTop: '1px solid #eee' }}>
                                    <td style={{ padding: '8px 10px', color: '#2e3a28', whiteSpace: 'nowrap', fontWeight: 600 }}>{farmDisplayName}</td>
                                    <td style={{ padding: '8px 10px', color: '#2e3a28', whiteSpace: 'nowrap' }}>{farmerName}</td>
                                    <td style={{ padding: '8px 10px', color: '#2e3a28', whiteSpace: 'nowrap' }}>{fmtSessionDate(started)}</td>
                                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#2e3a28', whiteSpace: 'nowrap' }}>{sessionCropLabel(row)}</td>
                                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                                      {activeRow ? (
                                        <span style={{ fontWeight: 700, color: '#2d6a4f' }}>Active</span>
                                      ) : (
                                        <span style={{ color: '#6a7a60' }}>Ended</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '8px 10px', color: '#2e3a28', whiteSpace: 'nowrap' }}>
                                      {activeRow ? '—' : fmtSessionDate(ended)}
                                    </td>
                                    <td style={{ padding: '8px 10px', color: '#6a7a60', whiteSpace: 'nowrap' }}>{fmtSessionDate(soilDate)}</td>
                                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{s?.nitrogen ?? '—'}</td>
                                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{s?.phosphorus ?? '—'}</td>
                                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{s?.potassium ?? '—'}</td>
                                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{s?.ph ?? '—'}</td>
                                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{s?.moisture != null ? `${s.moisture}%` : '—'}</td>
                                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{s?.temperature != null ? `${s.temperature}°` : '—'}</td>
                                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{s?.salinity ?? '—'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
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
