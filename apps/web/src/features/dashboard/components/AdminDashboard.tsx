import React from 'react';
import { useFarms } from '@/features/farms/hooks/useFarms';
import { useFarmers } from '@/features/farmers/hooks/useFarmers';
import { useSoilTests } from '@/features/soil/hooks/useSoilTests';
import { useSystemActivity } from '@/features/dashboard/hooks/useSystemActivity';
import { useGlobalAuth } from '@/features/auth/hooks/useGlobalAuth';
import { useQueryClient } from '@tanstack/react-query';
import { createFarmer, updateFarmer, deleteFarmer } from '@/features/farmers/services/farmerService';
import { createFarm, deleteFarm } from '@/features/farms/services/farmService';
import { useCropStore } from '@/features/crops/stores/cropStore';
import {
  fetchAllFarmingSessionsRaw,
  farmingSessionsRowsToCsv,
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
  UserCircle, TrendingUp, BarChart3,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, BarElement, ArcElement, Title, Tooltip, Legend);

// ─── Dashboard overview page ───────────────────────────────────────────────
const DashboardPage = ({
  farms, farmers, dbSoilTests, dbSystemActivity, liveWeather, onAddFarmer,
}: {
  farms: any[]; farmers: any[]; dbSoilTests: any[]; dbSystemActivity: any[]; liveWeather: any[]; onAddFarmer: () => void;
}) => {
  const [isExportingSessions, setIsExportingSessions] = React.useState(false);
  const avgN = dbSoilTests.length ? dbSoilTests.reduce((acc: number, t: any) => acc + Number(t.nitrogen || 0), 0) / dbSoilTests.length : 0;
  const avgP = dbSoilTests.length ? dbSoilTests.reduce((acc: number, t: any) => acc + Number(t.phosphorus || 0), 0) / dbSoilTests.length : 0;
  const avgK = dbSoilTests.length ? dbSoilTests.reduce((acc: number, t: any) => acc + Number(t.potassium || 0), 0) / dbSoilTests.length : 0;
  const avgPH = dbSoilTests.length ? dbSoilTests.reduce((acc: number, t: any) => acc + Number(t.ph || 0), 0) / dbSoilTests.length : 0;
  const avgMoisture = dbSoilTests.length ? dbSoilTests.reduce((acc: number, t: any) => acc + Number(t.moisture || 0), 0) / dbSoilTests.length : 0;
  const avgTemp = dbSoilTests.length ? dbSoilTests.reduce((acc: number, t: any) => acc + Number(t.temperature || 0), 0) / dbSoilTests.length : 0;
  const avgHumidity = dbSoilTests.length ? dbSoilTests.reduce((acc: number, t: any) => acc + Number(t.humidity || 0), 0) / dbSoilTests.length : 0;


  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const buildWave = (base: number, amp: number, shift: number) =>
    months.map((_, i) => Math.max(0, base + amp * Math.sin((i + shift) * 1.2)).toFixed(1));

  const soilLineData = {
    labels: months,
    datasets: [
      { label: 'Nitrogen', data: buildWave(Math.max(avgN, 35), 12, 0), borderColor: '#3a5a40', backgroundColor: 'transparent', tension: 0.5, pointRadius: 0, borderWidth: 2 },
      { label: 'Phosphorous', data: buildWave(Math.max(avgP, 28), 10, 2), borderColor: '#8aaa6a', backgroundColor: 'transparent', tension: 0.5, pointRadius: 0, borderWidth: 2 },
      { label: 'Potassium', data: buildWave(Math.max(avgK, 22), 8, 4), borderColor: '#c5d5a5', backgroundColor: 'transparent', tension: 0.5, pointRadius: 0, borderWidth: 2 },
      { label: 'PH', data: buildWave(Math.max(avgPH, 6.5), 1, 6), borderColor: '#c5d5a5', backgroundColor: 'transparent', tension: 0.5, pointRadius: 0, borderWidth: 2 },
      { label: 'Moisture', data: buildWave(Math.max(avgMoisture, 40), 10, 8), borderColor: '#c5d5a5', backgroundColor: 'transparent', tension: 0.5, pointRadius: 0, borderWidth: 2 },
      { label: 'Temperature', data: buildWave(Math.max(avgTemp, 25), 5, 10), borderColor: '#c5d5a5', backgroundColor: 'transparent', tension: 0.5, pointRadius: 0, borderWidth: 2 },
      { label: 'Humidity', data: buildWave(Math.max(avgHumidity, 60), 10, 12), borderColor: '#c5d5a5', backgroundColor: 'transparent', tension: 0.5, pointRadius: 0, borderWidth: 2 },
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
      tooltip: { mode: 'index' as const, intersect: false },
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

  const latestFarm = farms[farms.length - 1];
  const latestSoilTest = dbSoilTests[dbSoilTests.length - 1];
  const latestFarmName = latestFarm?.farm_name || latestFarm?.name;
  const latestField = latestFarm?.farmLocation;
  const soilType = latestFarm?.soilType
    ? `${latestFarm.soilType.charAt(0).toUpperCase()}${latestFarm.soilType.slice(1)} Soil`
    : 'Loamy Soil';
  const testDate = latestSoilTest?.created_at
    ? new Date(latestSoilTest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Oct 24, 2023';

  return (
    <div style={{ padding: '32px 36px', background: '#f0ede4', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1e2a1e', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: 13.5, color: '#6a7a60', margin: 0, lineHeight: 1.6 }}>
            Farm Soil Health Analysis
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <button
            type="button"
            disabled={isExportingSessions}
            onClick={() => void handleExportCSV()}
            style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: isExportingSessions ? 'wait' : 'pointer',
            background: '#fff', border: '1.5px solid #d5cfc5', color: '#4a5a40',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            opacity: isExportingSessions ? 0.7 : 1,
          }}
          >
            <Download size={14} /> {isExportingSessions ? 'Exporting…' : 'Export Report'}
          </button>
          <button onClick={onAddFarmer} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: '#3a5a40', color: '#fff', border: 'none',
            boxShadow: '0 2px 8px rgba(58,90,64,0.25)',
          }}>
            <Plus size={14} /> Add Farmer
          </button>
        </div>
      </div>

      {/* ── Top 3-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2.4fr', gap: 18, marginBottom: 20 }}>

        {/* Total Farmers */}
        <div style={{ background: '#e8e3d8', borderRadius: 18, padding: '28px 26px', minHeight: 210 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#3a5a40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} color="#fff" strokeWidth={1.8} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#fff', color: '#3a5a40', padding: '3px 10px', borderRadius: 20, border: '1px solid #d0cac0' }}>+12%</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#7a8a70', marginBottom: 6, letterSpacing: '0.02em' }}>Total Farmers</div>
          <div style={{ fontSize: 52, fontWeight: 800, color: '#1e2a1e', lineHeight: 1 }}>{farmers.length || 0}</div>
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
          <div style={{ fontSize: 52, fontWeight: 800, color: '#1e2a1e', lineHeight: 1 }}>{farms.length || 0}</div>
        </div>

        {/* Soil Health Trends */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1e2a1e', lineHeight: 1.3 }}>Soil Health<br />Trends</div>
          <div style={{ fontSize: 11, color: '#9aaa8a', marginTop: 4, marginBottom: 8 }}>Metric distribution over time (NPK Levels)</div>
          <div style={{ height: 130 }}>
            <Line data={soilLineData} options={soilChartOptions} />
          </div>
        </div>
      </div>

      {/* ── Latest Farm Tested ── */}
      <div style={{
        background: '#fff', borderRadius: 18, overflow: 'hidden',
        display: 'grid', gridTemplateColumns: '340px 1fr',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minHeight: 220,
      }}>
        <div style={{ overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg,#a3b18a,#3a5a40)' }}>
          <img
            src="/farm_hero.png"
            alt="Farm"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        <div style={{ padding: '30px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf50' }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#5a7a50', textTransform: 'uppercase' }}>Latest Farm Tested</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e2a1e', margin: '0 0 22px', lineHeight: 1.35 }}>
            <span style={{ color: '#3a8a50' }}>{latestFarmName}'s</span>{' '}
            {latestField}.
          </h2>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Tractor size={18} color="#5a7a50" strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2e3a28' }}>{latestFarmName}</div>
                <div style={{ fontSize: 11, color: '#8a9880', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Farm Name</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={18} color="#5a7a50" strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2e3a28' }}>Tested: {testDate}</div>
                <div style={{ fontSize: 11, color: '#8a9880', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date of Test</div>
              </div>
            </div>
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
  <div style={{ padding: '32px 36px', background: '#f0ede4', minHeight: '100vh' }}>
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1e2a1e', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
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
  const { data: dbSoilTests = [] } = useSoilTests() as any;
  const { data: dbSystemActivity = [] } = useSystemActivity() as any;
  const { profile, logout } = useGlobalAuth();
  const queryClient = useQueryClient();

  const [activePage, setActivePage] = React.useState<SidebarPage>('dashboard');
  const [searchQuery, setSearchQuery] = React.useState('');

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

  // ── Page router ──
  const renderPage = () => {
    const openAddFarmer = () => setIsAddFarmerOpen(true);
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage farms={farms} farmers={farmers} dbSoilTests={dbSoilTests} dbSystemActivity={dbSystemActivity} liveWeather={liveWeather} onAddFarmer={openAddFarmer} />;

      case 'farms':
        return (
          <FarmsTab
            farms={farms} farmers={farmers}
            searchQuery={searchQuery}
            isAddFarmOpen={isAddFarmOpen} setIsAddFarmOpen={setIsAddFarmOpen}
            newFarm={newFarm} setNewFarm={setNewFarm}
            isAddingFarm={isAddingFarm} handleAddFarmSubmit={handleAddFarmSubmit}
            selectedFarmerId={selectedFarmerId} setSelectedFarmerId={setSelectedFarmerId}
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
    >
      {renderPage()}

      {/* Global Add Farmer modal */}
      <Dialog open={isAddFarmerOpen} onOpenChange={setIsAddFarmerOpen}>
        <DialogContent style={{ maxWidth: 520 }}>
          <DialogHeader><DialogTitle>Add New Farmer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Farm Name</Label>
                <Input placeholder="e.g. Green Valley" value={newFarmer.farm_name} onChange={e => setNewFarmer({ ...newFarmer, farm_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Farm Location</Label>
                <Input placeholder="e.g. Cagayan de Oro" value={newFarmer.farmLocation} onChange={e => setNewFarmer({ ...newFarmer, farmLocation: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFarmerOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFarmerSubmit} disabled={isAddingFarmer || !newFarmer.username || !newFarmer.password}>
              {isAddingFarmer ? 'Registering...' : 'Register Farmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Farmer Modal */}
      <Dialog open={isEditFarmerOpen} onOpenChange={setIsEditFarmerOpen}>
        <DialogContent style={{ maxWidth: 520 }}>
          <DialogHeader><DialogTitle>Edit Farmer</DialogTitle></DialogHeader>
          {editingFarmer && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFarmerOpen(false)}>Cancel</Button>
            <Button onClick={handleEditFarmerSubmit} disabled={isEditingFarmer || !editingFarmer?.username}>
              {isEditingFarmer ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
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
