import React from 'react';
import { useFarms } from '@/features/farms/hooks/useFarms';
import { useFarmers } from '@/features/farmers/hooks/useFarmers';
import { useSystemActivity } from '@/features/dashboard/hooks/useSystemActivity';
import { useGlobalAuth } from '@/features/auth/hooks/useGlobalAuth';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { createFarmer, updateFarmer, deleteFarmer } from '@/features/farmers/services/farmerService';
import { createFarm, deleteFarm } from '@/features/farms/services/farmService';
import { useCropStore } from '@/features/crops/stores/cropStore';
import {
  fetchAllFarmingSessionsRaw,
  farmingSessionsRowsToCsv,
  soilScalarsFromSnapshot,
} from '@/features/farms/services/farmingSessionService';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { SidebarPage } from '@/shared/components/layout/Sidebar';

// ─── Feature tab imports ────────────────────────────────────────────────────
import { FarmersTab } from '@/features/farmers/components/FarmersTab';
import { FarmsTab } from '@/features/farms/components/FarmsTab';
import { GISMappingTab } from '@/features/mapping/components/GISMappingTab';
import { FertilizerTab } from '@/features/farms/components/FertilizerTab';

// ─── UI Components ──────────────────────────────────────────────────────────
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, LineElement, PointElement,
  Title, Tooltip, Legend, BarElement, ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Users, Tractor, Download, Plus, Thermometer, Droplets,
  Database, AlertCircle, Calendar, MapPin, ShieldCheck,
  UserCircle, TrendingUp, BarChart3, Loader2
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, BarElement, ArcElement, Title, Tooltip, Legend);

// ─── Dashboard overview page ───────────────────────────────────────────────
const DashboardPage = ({
  farms, farmers, dbSoilTests, dbSystemActivity, liveWeather, onAddFarmer,
}: {
  farms: any[]; farmers: any[]; dbSoilTests: any[]; dbSystemActivity: any[]; liveWeather: any[]; onAddFarmer: () => void;
}) => {
  const [isExportingSessions, setIsExportingSessions] = React.useState(false);
  // Exact recent chronological tests
  const recentTests = [...dbSoilTests]
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
    .slice(-15);

  const labels = recentTests.map(t => {
    const d = t.created_at ? new Date(t.created_at) : new Date();
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
  });

  const soilLineData = {
    labels: labels.length ? labels : ['No Data'],
    datasets: [
      { label: 'Nitrogen', data: recentTests.length ? recentTests.map(t => Number(t.nitrogen || 0)) : [0], borderColor: '#3a5a40', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 2 },
      { label: 'Phosphorous', data: recentTests.length ? recentTests.map(t => Number(t.phosphorus || 0)) : [0], borderColor: '#8aaa6a', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 2 },
      { label: 'Potassium', data: recentTests.length ? recentTests.map(t => Number(t.potassium || 0)) : [0], borderColor: '#c5d5a5', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 2 },
      { label: 'pH', data: recentTests.length ? recentTests.map(t => Number(t.ph || 0)) : [0], borderColor: '#e76f51', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 2 },
      { label: 'Moisture', data: recentTests.length ? recentTests.map(t => Number(t.moisture || 0)) : [0], borderColor: '#2a9d8f', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 2 },
      { label: 'Temperature', data: recentTests.length ? recentTests.map(t => Number(t.temperature || 0)) : [0], borderColor: '#e63946', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 2 },
      { label: 'Salinity', data: recentTests.length ? recentTests.map(t => Number(t.salinity || 0)) : [0], borderColor: '#457b9d', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 2 },
    ],
  };

  const soilChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle' as const, font: { size: 10 }, color: '#4a5a40' },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        padding: 8,
        titleFont: { size: 11 },
        bodyFont: { size: 10 },
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#8a9880' }, border: { display: false } },
      y: { display: false, grid: { display: false } },
    },
  };

  const handleExportCSV = async () => {
    try {
      setIsExportingSessions(true);
      const rows = await fetchAllFarmingSessionsRaw();
      if (!rows.length) {
        alert('No farming session data available to export.');
        return;
      }
      const csvContent = farmingSessionsRowsToCsv(rows);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `farming_sessions_${new Date().toISOString().split('T')[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Could not export farming sessions. Please try again.');
    } finally {
      setIsExportingSessions(false);
    }
  };

  // ── Recent activity data ──
  const latestAddedFarm = [...farms].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )[0];

  const latestSoilTest = [...dbSoilTests].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )[0];
  const latestTestedFarm = latestSoilTest
    ? farms.find((f: any) => f.farm_id === latestSoilTest.farm_id || f.id === latestSoilTest.farm_id)
    : null;

  const latestAddedFarmer = [...farmers].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )[0];

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="min-h-0 bg-[#f0ede4] px-4 py-4 sm:px-6 sm:py-5 lg:px-9 lg:pb-8">

      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 max-w-[520px]">
          <h1 className="text-[clamp(1.375rem,4vw+0.5rem,1.875rem)] font-extrabold leading-tight tracking-tight text-[#1e2a1e]">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#6a7a60]">
            Farm Soil Health Analysis
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={isExportingSessions}
            onClick={() => void handleExportCSV()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-[#d5cfc5] bg-white px-[18px] py-2.5 text-[13px] font-semibold text-[#4a5a40] shadow-sm sm:w-auto disabled:opacity-70"
            style={{ cursor: isExportingSessions ? 'wait' : 'pointer' }}
          >
            <Download size={14} /> {isExportingSessions ? 'Exporting…' : 'Export Report'}
          </button>
          <button
            onClick={onAddFarmer}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border-none bg-[#3a5a40] px-[18px] py-2.5 text-[13px] font-semibold text-white shadow-md sm:w-auto"
            style={{ boxShadow: '0 2px 8px rgba(58,90,64,0.25)' }}
          >
            <Plus size={14} /> Add Farmer
          </button>
        </div>
      </div>

      {/* ── Top summary + chart grid ── */}
      <div className="mb-5 grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-[1fr_1fr_minmax(0,2.4fr)]">

        {/* Total Farmers */}
        <div style={{ background: '#e8e3d8', borderRadius: 18, padding: '28px 26px', minHeight: 210 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#3a5a40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} color="#fff" strokeWidth={1.8} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#fff', color: '#3a5a40', padding: '3px 10px', borderRadius: 20, border: '1px solid #d0cac0' }}>+12%</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#7a8a70', marginBottom: 6, letterSpacing: '0.02em' }}>Total Farmers</div>
          <div className="text-[clamp(2rem,8vw,3.25rem)] font-extrabold leading-none text-[#1e2a1e]">{farmers.length || 0}</div>
        </div>

        {/* Total Farms */}
        <div style={{ background: '#e8e3d8', borderRadius: 18, padding: '28px 26px', minHeight: 210 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#3a5a40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tractor size={22} color="#fff" strokeWidth={1.8} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#fff', color: '#3a5a40', padding: '3px 10px', borderRadius: 20, border: '1px solid #d0cac0' }}>Active</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#7a8a70', marginBottom: 6, letterSpacing: '0.02em' }}>Total Farms</div>
          <div className="text-[clamp(2rem,8vw,3.25rem)] font-extrabold leading-none text-[#1e2a1e]">{farms.length || 0}</div>
        </div>

        {/* Soil Health Trends */}
        <div className="min-w-0 md:col-span-2 xl:col-span-1" style={{ background: '#fff', borderRadius: 18, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1e2a1e', lineHeight: 1.3 }}>Soil Health<br />Trends</div>
          <div style={{ fontSize: 11, color: '#9aaa8a', marginTop: 4, marginBottom: 8 }}>Metric distribution over time (NPK Levels)</div>
          <div className="relative h-36 w-full sm:h-40">
            <Line data={soilLineData} options={soilChartOptions} />
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div style={{ marginBottom: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#3a5a40', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
          Recent Activity
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

          {/* Latest Added Farm */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eaf4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Tractor size={17} color="#3a5a40" />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#8a9880', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Latest Added Farm</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1e2a1e', marginTop: 1, lineHeight: 1.2 }}>
                  {latestAddedFarm ? (latestAddedFarm.farm_name || latestAddedFarm.name || 'Unnamed Farm') : 'No farms yet'}
                </div>
              </div>
            </div>
            {latestAddedFarm && (
              <>
                <div style={{ borderTop: '1px solid #f0ede4' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8a9880' }}>Location</span>
                    <span style={{ fontWeight: 600, color: '#2e3a28', textAlign: 'right', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {latestAddedFarm.farm_location || '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8a9880' }}>Size</span>
                    <span style={{ fontWeight: 600, color: '#2e3a28' }}>{latestAddedFarm.farm_measurement ? `${latestAddedFarm.farm_measurement} ha` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8a9880' }}>Added</span>
                    <span style={{ fontWeight: 600, color: '#3a5a40' }}>{fmtDate(latestAddedFarm.created_at)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Latest Soil-Tested Farm */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef9ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Thermometer size={17} color="#b67c2a" />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#8a9880', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Latest Soil Test</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1e2a1e', marginTop: 1, lineHeight: 1.2 }}>
                  {latestTestedFarm ? (latestTestedFarm.farm_name || latestTestedFarm.name || 'Unnamed Farm') : (latestSoilTest ? 'Unknown Farm' : 'No tests yet')}
                </div>
              </div>
            </div>
            {latestSoilTest && (
              <>
                <div style={{ borderTop: '1px solid #f0ede4' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8a9880' }}>N / P / K</span>
                    <span style={{ fontWeight: 600, color: '#2e3a28' }}>
                      {latestSoilTest.nitrogen ?? '—'} / {latestSoilTest.phosphorus ?? '—'} / {latestSoilTest.potassium ?? '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8a9880' }}>pH</span>
                    <span style={{ fontWeight: 600, color: '#2e3a28' }}>{latestSoilTest.ph ?? '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8a9880' }}>Temperature</span>
                    <span style={{ fontWeight: 600, color: '#2e3a28' }}>{latestSoilTest.temperature != null ? `${latestSoilTest.temperature} °C` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8a9880' }}>Moisture</span>
                    <span style={{ fontWeight: 600, color: '#2e3a28' }}>{latestSoilTest.moisture != null ? `${latestSoilTest.moisture}%` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8a9880' }}>Salinity (EC)</span>
                    <span style={{ fontWeight: 600, color: '#2e3a28' }}>{latestSoilTest.salinity ?? '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8a9880' }}>Tested</span>
                    <span style={{ fontWeight: 600, color: '#b67c2a' }}>{fmtDate(latestSoilTest.created_at)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Latest Added Farmer */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={17} color="#4a5ab0" />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#8a9880', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Latest Added Farmer</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1e2a1e', marginTop: 1, lineHeight: 1.2 }}>
                  {latestAddedFarmer
                    ? (`${latestAddedFarmer.first_name || ''} ${latestAddedFarmer.last_name || ''}`.trim() || latestAddedFarmer.username || 'Unnamed')
                    : 'No farmers yet'}
                </div>
              </div>
            </div>
            {latestAddedFarmer && (
              <>
                <div style={{ borderTop: '1px solid #f0ede4' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8a9880' }}>Username</span>
                    <span style={{ fontWeight: 600, color: '#2e3a28' }}>@{latestAddedFarmer.username || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8a9880' }}>Phone</span>
                    <span style={{ fontWeight: 600, color: '#2e3a28' }}>{latestAddedFarmer.phone_number || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8a9880' }}>Joined</span>
                    <span style={{ fontWeight: 600, color: '#4a5ab0' }}>{fmtDate(latestAddedFarmer.created_at)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};


// ─── Admin Management page points to the real SuperAdminPage ────────────────────────────
import { SuperAdminPage } from '@/features/profile/components/SuperAdminPage';

// ─── Admin Profile page (stays in dashboard) ───────────────────────────────
const AdminProfilePage = ({ profile }: { profile: any }) => (
  <div className="min-h-0 bg-[#f0ede4] px-4 py-6 sm:px-8 lg:px-9">
    <div className="mb-8">
      <h1 className="text-[clamp(1.375rem,4vw+0.5rem,1.875rem)] font-extrabold tracking-tight text-[#1e2a1e]">
        Admin Profile
      </h1>
      <p style={{ fontSize: 13.5, color: '#6a7a60', margin: 0, lineHeight: 1.6 }}>
        Your account details and system access information.
      </p>
    </div>
    <Card className="shadow-earth max-w-xl">
      <CardContent className="p-8">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {(profile?.username || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile?.username || 'Administrator'}</h2>
            <Badge className="mt-1">{profile?.role?.toUpperCase() || 'ADMIN'}</Badge>
          </div>
        </div>
        <Separator className="mb-4" />
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">Username</span>
            <span className="font-semibold">{profile?.username || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">Role</span>
            <span className="font-semibold capitalize">{profile?.role || 'Admin'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">Language</span>
            <span className="font-semibold">{profile?.language?.toUpperCase() || 'EN'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ─── Main AdminDashboard component 
export const AdminDashboard = () => {
  const { data: farms = [], isLoading: isLoadingFarms } = useFarms() as any;
  const { data: farmers = [], isLoading: isLoadingFarmers } = useFarmers() as any;

  const { data: rawSessions = [] } = useQuery({ queryKey: ['farming_sessions_all'], queryFn: fetchAllFarmingSessionsRaw }) as any;
  const dbSoilTests = React.useMemo(() => {
    // DEBUG: log raw snapshot keys to verify backend field names
    if ((rawSessions as any[])?.length > 0) {
      const firstSnap = (rawSessions as any[])[0]?.soil_snapshot;
      console.log('[soil_snapshot] raw keys from backend:', firstSnap ? Object.keys(firstSnap) : 'null/undefined');
      console.log('[soil_snapshot] first raw value:', firstSnap);
    }
    return (rawSessions || []).map((fs: any) => {
      const snap = soilScalarsFromSnapshot(fs.soil_snapshot);
      if (!snap) return null;
      if (snap.ph == null && snap.nitrogen == null && snap.phosphorus == null && snap.potassium == null) return null;
      const rawSnapshot = fs.soil_snapshot || {};
      const classification = typeof rawSnapshot === 'object' && rawSnapshot !== null
        ? (rawSnapshot as any).npk_classification || (rawSnapshot as any).classification
        : undefined;
      return {
        id: fs.id || fs.farming_session_id,
        farm_id: fs.farm_id,
        created_at: snap.received_at || fs.created_at,
        ph: snap.ph,
        nitrogen: snap.nitrogen,
        phosphorus: snap.phosphorus,
        potassium: snap.potassium,
        temperature: snap.temperature,
        moisture: snap.moisture,
        salinity: snap.salinity,
        npk_classification: classification,
        selected_crop: fs.selected_crop || fs.selected_crops
      };
    }).filter(Boolean);
  }, [rawSessions]);

  React.useEffect(() => {
    if ((dbSoilTests as any[]).length > 0) {
      console.log('[dbSoilTests] parsed count:', (dbSoilTests as any[]).length);
      console.log('[dbSoilTests] first parsed record:', (dbSoilTests as any[])[0]);
    } else if ((rawSessions as any[]).length > 0) {
      console.warn('[dbSoilTests] rawSessions has data but dbSoilTests is EMPTY — soil_snapshot key names likely do not match!');
    }
  }, [dbSoilTests, rawSessions]);

  const { data: dbSystemActivity = [] } = useSystemActivity() as any;
  const { profile, logout } = useGlobalAuth();
  const queryClient = useQueryClient();

  const [activePage, setActivePage] = React.useState<SidebarPage>('dashboard');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [pendingFarmModal, setPendingFarmModal] = React.useState<any>(null);
  const [pendingFarmerModal, setPendingFarmerModal] = React.useState<any>(null);

  // ── Farmer / Farm dialog state ──
  const [isAddFarmerOpen, setIsAddFarmerOpen] = React.useState(false);
  const [newFarmer, setNewFarmer] = React.useState({
    firstName: '', lastName: '', contactInfo: '', username: '', password: '',
    farm_name: '', farmLocation: '', farm_measurement: '', soilType: 'loam',
    latitude: '', longitude: '',
  });
  const [isAddingFarmer, setIsAddingFarmer] = React.useState(false);
  const [isAddFarmOpen, setIsAddFarmOpen] = React.useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = React.useState<string | null>(null);
  const [newFarm, setNewFarm] = React.useState({ farm_name: '', farm_measurement: '', soilType: 'loam', farm_location: '', latitude: '', longitude: '' });
  const [isAddingFarm, setIsAddingFarm] = React.useState(false);

  // ── Edit/Delete Farmer state ──
  const [isEditFarmerOpen, setIsEditFarmerOpen] = React.useState(false);
  const [editingFarmer, setEditingFarmer] = React.useState<any>(null);
  const [isEditingFarmer, setIsEditingFarmer] = React.useState(false);

  const [isDeleteFarmerOpen, setIsDeleteFarmerOpen] = React.useState(false);
  const [deletingFarmerId, setDeletingFarmerId] = React.useState<string | null>(null);
  const [isDeletingFarmer, setIsDeletingFarmer] = React.useState(false);
  const [deleteFarmerError, setDeleteFarmerError] = React.useState('');

  // ── Live weather ──
  const [liveWeather, setLiveWeather] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=8.4542&longitude=124.6319&daily=weathercode,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max&timezone=Asia/Manila');
        const data = await res.json();
        const daily = data.daily;
        if (!daily) return;
        const formatted = daily.time.slice(0, 5).map((time: string, i: number) => {
          const date = new Date(time);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          let code = daily.weathercode[i];
          let condition = 'Clear'; let icon = '☀️';
          if (code >= 1 && code <= 3) { condition = 'Cloudy'; icon = '⛅'; }
          else if (code >= 45 && code <= 48) { condition = 'Foggy'; icon = '🌫️'; }
          else if (code >= 51 && code <= 67) { condition = 'Rainy'; icon = '🌧️'; }
          else if (code >= 71 && code <= 77) { condition = 'Snowy'; icon = '❄️'; }
          else if (code >= 80 && code <= 82) { condition = 'Showers'; icon = '🌦️'; }
          else if (code >= 95) { condition = 'Storm'; icon = '⛈️'; }
          const tempMax = Math.round(daily.temperature_2m_max[i]);
          const tempMin = Math.round(daily.temperature_2m_min[i]);
          const humidity = daily.relative_humidity_2m_max ? Math.round(daily.relative_humidity_2m_max[i]) : 65;
          return { day: i === 0 ? 'Today' : dayName, condition, temperature: `${tempMin}-${tempMax}`, humidity, icon };
        });
        setLiveWeather(formatted);
      } catch (err) { console.error(err); }
    };
    fetchWeather();
  }, []);

  // ── Handlers ──
  const handleAddFarmerSubmit = async () => {
    if (!newFarmer.username || !newFarmer.password) return;
    try {
      setIsAddingFarmer(true);
      const createdFarmer = await createFarmer({
        username: newFarmer.username,
        password: newFarmer.password,
        first_name: newFarmer.firstName || undefined,
        last_name: newFarmer.lastName || undefined,
        phone_number: newFarmer.contactInfo || undefined,
      });
      if (newFarmer.farm_name && createdFarmer) {
        const farmerId = (createdFarmer as any).farmer_id || (createdFarmer as any).id;
        await createFarm({
          farm_name: newFarmer.farm_name,
          farm_measurement: Number(newFarmer.farm_measurement) || 0,
          farmer_id: farmerId,
          farm_location: newFarmer.farmLocation || undefined,
          latitude: newFarmer.latitude ? Number(newFarmer.latitude) : null,
          longitude: newFarmer.longitude ? Number(newFarmer.longitude) : null,
        });
        queryClient.invalidateQueries({ queryKey: ['farms'] });
      }
      setIsAddFarmerOpen(false);
      setNewFarmer({ firstName: '', lastName: '', contactInfo: '', username: '', password: '', farm_name: '', farmLocation: '', farm_measurement: '', soilType: 'loam', latitude: '', longitude: '' });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
    } catch (err) { console.error(err); } finally { setIsAddingFarmer(false); }
  };

  const handleAddFarmSubmit = async () => {
    if (!newFarm.farm_name || !selectedFarmerId) return;
    try {
      setIsAddingFarm(true);
      await createFarm({
        farm_name: newFarm.farm_name,
        farm_measurement: Number(newFarm.farm_measurement) || 0,
        farmer_id: selectedFarmerId,
        farm_location: newFarm.farm_location || undefined,
        latitude: newFarm.latitude ? Number(newFarm.latitude) : null,
        longitude: newFarm.longitude ? Number(newFarm.longitude) : null,
      });
      setIsAddFarmOpen(false);
      setSelectedFarmerId(null);
      setNewFarm({ farm_name: '', farm_measurement: '', soilType: 'loam', farm_location: '', latitude: '', longitude: '' });
      queryClient.invalidateQueries({ queryKey: ['farms'] });
    } catch (err) { console.error(err); } finally { setIsAddingFarm(false); }
  };

  const onEditFarmerClick = (farmer: any) => {
    setEditingFarmer({
      ...farmer,
      firstName: farmer.first_name || '',
      lastName: farmer.last_name || '',
      phone_number: farmer.phone_number || '',
      id: farmer.farmer_id || farmer.id,
      password: ''
    });
    setIsEditFarmerOpen(true);
  };

  const onDeleteFarmerClick = (farmer: any) => {
    setDeletingFarmerId(farmer.farmer_id || farmer.id);
    setIsDeleteFarmerOpen(true);
  };

  const handleEditFarmerSubmit = async () => {
    if (!editingFarmer) return;
    try {
      setIsEditingFarmer(true);
      await updateFarmer(editingFarmer.id, {
        username: editingFarmer.username,
        first_name: editingFarmer.firstName,
        last_name: editingFarmer.lastName,
        phone_number: editingFarmer.phone_number || undefined,
        password: editingFarmer.password || undefined
      });
      setIsEditFarmerOpen(false);
      setEditingFarmer(null);
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
    } catch (err) { console.error(err); } finally { setIsEditingFarmer(false); }
  };

  const handleDeleteFarmerSubmit = async () => {
    if (!deletingFarmerId) return;
    try {
      setIsDeletingFarmer(true);
      setDeleteFarmerError('');

      // Step 1: Delete all farms linked to this farmer first (foreign key constraint)
      const linkedFarms = farms.filter(
        (f: any) => f.farmer_id === deletingFarmerId
      );
      for (const farm of linkedFarms) {
        await deleteFarm(farm.farm_id || farm.id);
      }

      // Step 2: Now safely delete the farmer
      await deleteFarmer(deletingFarmerId);

      setIsDeleteFarmerOpen(false);
      setDeletingFarmerId(null);
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      queryClient.invalidateQueries({ queryKey: ['farms'] });
    } catch (err: any) {
      setDeleteFarmerError(err?.message || 'Failed to delete farmer. Please try again.');
    } finally { setIsDeletingFarmer(false); }
  };

  // ── Navigate-to-farm/farmer from global search ──
  const handleNavigateToFarm = React.useCallback((farm: any) => {
    setPendingFarmModal(farm);
    setActivePage('farms');
    setSearchQuery('');
  }, []);

  const handleNavigateToFarmer = React.useCallback((farmer: any) => {
    setPendingFarmerModal(farmer);
    setActivePage('farmers');
    setSearchQuery('');
  }, []);

  // ── Page router ──
  const renderPage = () => {
    const openAddFarmer = () => setIsAddFarmerOpen(true);
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage farms={farms} farmers={farmers} dbSoilTests={dbSoilTests} dbSystemActivity={dbSystemActivity} liveWeather={liveWeather} onAddFarmer={openAddFarmer} />;

      case 'farms':
        return (
          <FarmsTab
            farms={farms} farmers={farmers} dbSoilTests={dbSoilTests}
            searchQuery={searchQuery}
            isAddFarmOpen={isAddFarmOpen} setIsAddFarmOpen={setIsAddFarmOpen}
            newFarm={newFarm} setNewFarm={setNewFarm}
            isAddingFarm={isAddingFarm} handleAddFarmSubmit={handleAddFarmSubmit}
            selectedFarmerId={selectedFarmerId} setSelectedFarmerId={setSelectedFarmerId}
            initialViewFarmId={pendingFarmModal?.farm_id || pendingFarmModal?.id || null}
            onInitialViewConsumed={() => setPendingFarmModal(null)}
          />
        );

      case 'farmers':
        return (
          <FarmersTab
            farms={farms} farmers={farmers}
            searchQuery={searchQuery}
            isAddFarmerOpen={isAddFarmerOpen} setIsAddFarmerOpen={setIsAddFarmerOpen}
            newFarmer={newFarmer} setNewFarmer={setNewFarmer}
            isAddingFarmer={isAddingFarmer} handleAddFarmerSubmit={handleAddFarmerSubmit}
            isAddFarmOpen={isAddFarmOpen} setIsAddFarmOpen={setIsAddFarmOpen}
            selectedFarmerId={selectedFarmerId} setSelectedFarmerId={setSelectedFarmerId}
            newFarm={newFarm} setNewFarm={setNewFarm}
            isAddingFarm={isAddingFarm} handleAddFarmSubmit={handleAddFarmSubmit}
            onEditFarmer={onEditFarmerClick}
            onDeleteFarmer={onDeleteFarmerClick}
            initialViewFarmerId={pendingFarmerModal?.farmer_id || pendingFarmerModal?.id || null}
            onInitialViewConsumed={() => setPendingFarmerModal(null)}
          />
        );

      case 'gis-mapping':
        return <GISMappingTab farms={farms} farmers={farmers} dbSoilTests={dbSoilTests} onAddFarmer={openAddFarmer} />;

      case 'fertilizer':
        return <FertilizerTab farms={farms} dbSystemActivity={dbSystemActivity} onAddFarmer={openAddFarmer} />;

      case 'admin-management':
        return <SuperAdminPage currentUsername={profile?.username || ''} />;

      case 'admin-profile':
        return <AdminProfilePage profile={profile} />;

      default:
        return null;
    }
  };

  return (
    <AppLayout
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={logout}
      userName={profile?.username || 'Admin'}
      userRole="Regional Admin"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      farms={farms}
      farmers={farmers}
      dbSoilTests={dbSoilTests}
      onNavigateToFarm={handleNavigateToFarm}
      onNavigateToFarmer={handleNavigateToFarmer}
    >
      {renderPage()}

      {/* Global Add Farmer modal — scrollable on small / short viewports */}
      <Dialog open={isAddFarmerOpen} onOpenChange={setIsAddFarmerOpen}>
        <DialogContent
          className="flex max-h-[90dvh] w-[calc(100vw-1.25rem)] max-w-[520px] flex-col gap-0 overflow-hidden border bg-background p-0 shadow-lg sm:w-full
            left-[50%] top-[max(0.5rem,env(safe-area-inset-top,0px))] z-50 -translate-x-1/2 translate-y-0
            sm:top-[50%] sm:-translate-y-1/2"
        >
          <div className="shrink-0 border-b px-6 pb-3 pt-6 pr-14">
            <DialogHeader className="text-left">
              <DialogTitle>Add New Farmer</DialogTitle>
            </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-contain px-6 py-3 [-webkit-overflow-scrolling:touch]">
          <div className="space-y-4 min-w-0">

            {/* Name row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input placeholder="e.g. John" value={newFarmer.firstName} onChange={e => setNewFarmer({ ...newFarmer, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input placeholder="e.g. Doe" value={newFarmer.lastName} onChange={e => setNewFarmer({ ...newFarmer, lastName: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contact Info</Label>
              <Input placeholder="Phone number" value={newFarmer.contactInfo} onChange={e => setNewFarmer({ ...newFarmer, contactInfo: e.target.value })} />
            </div>

            <div style={{ borderTop: '1px solid #f0ede4', margin: '4px 0' }} />

            {/* Credentials */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Username <span style={{ color: '#e53935', marginLeft: 2 }}>*</span></Label>
                <Input placeholder="Choose username" value={newFarmer.username} onChange={e => setNewFarmer({ ...newFarmer, username: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password <span style={{ color: '#e53935', marginLeft: 2 }}>*</span></Label>
                <Input type="password" placeholder="••••••••" value={newFarmer.password} onChange={e => setNewFarmer({ ...newFarmer, password: e.target.value })} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f0ede4', margin: '4px 0' }} />

            {/* Farm details */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Farm Name</Label>
                <Input placeholder="e.g. Green Valley" value={newFarmer.farm_name} onChange={e => setNewFarmer({ ...newFarmer, farm_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Farm Location</Label>
                <Input placeholder="e.g. Cagayan de Oro" value={newFarmer.farmLocation} onChange={e => setNewFarmer({ ...newFarmer, farmLocation: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Latitude (GPS) 🗺</Label>
                <Input type="number" step="any" placeholder="e.g. 8.4870" value={newFarmer.latitude} onChange={e => setNewFarmer({ ...newFarmer, latitude: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Longitude (GPS) 🗺</Label>
                <Input type="number" step="any" placeholder="e.g. 124.6470" value={newFarmer.longitude} onChange={e => setNewFarmer({ ...newFarmer, longitude: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Farm Size (Hectares)</Label>
              <Input type="number" step="any" placeholder="e.g. 5.5" value={newFarmer.farm_measurement} onChange={e => setNewFarmer({ ...newFarmer, farm_measurement: e.target.value })} />
            </div>
          </div>
          </div>
          <div className="shrink-0 border-t bg-background px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAddFarmerOpen(false)}>Cancel</Button>
              <Button className="w-full sm:w-auto gap-2" onClick={handleAddFarmerSubmit} disabled={isAddingFarmer || !newFarmer.username || !newFarmer.password}>
                {isAddingFarmer && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAddingFarmer ? 'Registering...' : 'Register Farmer'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Farmer Modal */}
      <Dialog open={isEditFarmerOpen} onOpenChange={setIsEditFarmerOpen}>
        <DialogContent
          className="flex max-h-[90dvh] w-[calc(100vw-1.25rem)] max-w-[520px] flex-col gap-0 overflow-hidden border bg-background p-0 shadow-lg sm:w-full
            left-[50%] top-[max(0.5rem,env(safe-area-inset-top,0px))] z-50 -translate-x-1/2 translate-y-0
            sm:top-[50%] sm:-translate-y-1/2"
        >
          <div className="shrink-0 border-b px-6 pb-3 pt-6 pr-14">
            <DialogHeader className="text-left">
              <DialogTitle>Edit Farmer</DialogTitle>
            </DialogHeader>
          </div>
          {editingFarmer && (
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-contain px-6 py-3 [-webkit-overflow-scrolling:touch]">
            <div className="space-y-4 min-w-0">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={editingFarmer.firstName} onChange={e => setEditingFarmer({ ...editingFarmer, firstName: e.target.value })} placeholder="e.g. John" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={editingFarmer.lastName} onChange={e => setEditingFarmer({ ...editingFarmer, lastName: e.target.value })} placeholder="e.g. Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={editingFarmer.phone_number} onChange={e => setEditingFarmer({ ...editingFarmer, phone_number: e.target.value })} placeholder="e.g. 09XX-XXX-XXXX" />
              </div>
              <div style={{ borderTop: '1px solid #f0ede4', margin: '4px 0' }} />
              <div className="space-y-2">
                <Label>Username <span style={{ color: '#e53935', marginLeft: 2 }}>*</span></Label>
                <Input value={editingFarmer.username} onChange={e => setEditingFarmer({ ...editingFarmer, username: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password <span style={{ fontSize: 10, color: '#9aaa8a', fontWeight: 400 }}>(leave blank to keep current)</span></Label>
                <Input type="password" placeholder="(unchanged)" value={editingFarmer.password} onChange={e => setEditingFarmer({ ...editingFarmer, password: e.target.value })} />
              </div>
            </div>
            </div>
          )}
          <div className="shrink-0 border-t bg-background px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditFarmerOpen(false)}>Cancel</Button>
              <Button className="w-full sm:w-auto" onClick={handleEditFarmerSubmit} disabled={isEditingFarmer || !editingFarmer?.username}>
                {isEditingFarmer ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Farmer Modal */}
      <Dialog open={isDeleteFarmerOpen} onOpenChange={(open) => { if (!open) { setIsDeleteFarmerOpen(false); setDeleteFarmerError(''); } }}>
        <DialogContent style={{ maxWidth: 420 }}>
          <DialogHeader><DialogTitle style={{ color: '#dc2626' }}>Delete Farmer</DialogTitle></DialogHeader>
          <p style={{ fontSize: 14, color: '#4a5a40', marginBottom: 8 }}>
            Are you sure you want to delete this farmer? This action cannot be undone and will permanently remove their records from the system.
          </p>
          {deleteFarmerError && (
            <div style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#b91c1c' }}>
              ⚠️ {deleteFarmerError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteFarmerOpen(false); setDeleteFarmerError(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteFarmerSubmit} disabled={isDeletingFarmer}>
              {isDeletingFarmer ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};
