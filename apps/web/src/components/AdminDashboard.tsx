import React, { useEffect, useRef } from 'react';
import { useCropStore } from '@/stores/cropStore';
import { useFarms } from '@/hooks/useFarms';
import { useFarmers } from '@/hooks/useFarmers';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { useSoilTests } from '@/hooks/useSoilTests';
import { useSystemActivity } from '@/hooks/useSystemActivity';
import { useQueryClient } from '@tanstack/react-query';
import { createFarmer } from '@/services/farmerService';
import { createFarm } from '@/services/farmService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  BarChart3,
  Users,
  MapPin,
  Settings,
  Thermometer,
  CloudLightning,
  Droplets,
  Wind,
  Tractor,
  Calendar,
  TrendingUp,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Download,
  Database,
  Brain,
  Bot,
  Zap,
  CheckCircle,
  Clock,
  LogOut
} from 'lucide-react';
import { FarmMap } from './maps/FarmMap';
import { LanguageSwitcher } from './LanguageSwitcher';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const AdminDashboard = () => {
  const { data: farms = [], isLoading: isLoadingFarms } = useFarms() as any;
  const { data: farmers = [], isLoading: isLoadingFarmers } = useFarmers() as any;
  const { data: dbSoilTests = [] } = useSoilTests() as any;
  const { data: dbSystemActivity = [] } = useSystemActivity() as any;
  const { profile, logout } = useGlobalAuth();
  const queryClient = useQueryClient();

  const [isAddFarmerOpen, setIsAddFarmerOpen] = React.useState(false);
  const [newFarmer, setNewFarmer] = React.useState({ username: '', phone: '', password: '', role: 'farmer', language: 'en', farm_name: '', farm_measurement: '', soilType: 'loam' });
  const [isAddingFarmer, setIsAddingFarmer] = React.useState(false);

  const [isAddFarmOpen, setIsAddFarmOpen] = React.useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = React.useState<string | null>(null);
  const [newFarm, setNewFarm] = React.useState({ farm_name: '', farm_measurement: '', soilType: 'loam' });
  const [isAddingFarm, setIsAddingFarm] = React.useState(false);

  const handleAddFarmerSubmit = async () => {
    if (!newFarmer.username || !newFarmer.password) return;
    try {
      setIsAddingFarmer(true);
      const createdFarmer = await createFarmer({
        username: newFarmer.username,
        password: newFarmer.password,
      });
      // If farm details were provided, create the farm linked to this new farmer
      if (newFarmer.farm_name && createdFarmer) {
        const farmerId = createdFarmer.farmer_id || createdFarmer.id;
        await createFarm({
          farm_name: newFarmer.farm_name,
          farm_measurement: Number(newFarmer.farm_measurement) || 0,
          soilType: newFarmer.soilType,
          farmer_id: farmerId,
        });
        queryClient.invalidateQueries({ queryKey: ['farms'] });
      }
      setIsAddFarmerOpen(false);
      setNewFarmer({ username: '', phone: '', password: '', role: 'farmer', language: 'en', farm_name: '', farm_measurement: '', soilType: 'loam' });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingFarmer(false);
    }
  };

  const handleAddFarmSubmit = async () => {
    if (!newFarm.farm_name || !selectedFarmerId) return;
    try {
      setIsAddingFarm(true);
      await createFarm({
        farm_name: newFarm.farm_name,
        farm_measurement: Number(newFarm.farm_measurement),
        soilType: newFarm.soilType,
        farmer_id: selectedFarmerId
      });
      setIsAddFarmOpen(false);
      setSelectedFarmerId(null);
      setNewFarm({ farm_name: '', farm_measurement: '', soilType: 'loam' });
      queryClient.invalidateQueries({ queryKey: ['farms'] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingFarm(false);
    }
  };

  const {
    soilData,
    weatherData,
    cropRules,
    updateCropRule,
    addCropRule,
    deleteCropRule,
    updateSoilData,
    generateWeatherData,
    t
  } = useCropStore();

  const handleLogout = async () => {
    logout();
  };

  const currentUser = profile;

  const [liveWeather, setLiveWeather] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=8.4542&longitude=124.6319&daily=weathercode,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max&timezone=Asia/Manila");
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

  const [newRule, setNewRule] = React.useState({
    currentCrop: '',
    recommendedCrop: '',
    reason: '',
    condition: '',
  });

  // Calculate true averages from the actual retrieved soil data from supabase
  const avgN = dbSoilTests.length ? dbSoilTests.reduce((acc: number, test: any) => acc + Number(test.nitrogen || 0), 0) / dbSoilTests.length : 0;
  const avgP = dbSoilTests.length ? dbSoilTests.reduce((acc: number, test: any) => acc + Number(test.phosphorus || 0), 0) / dbSoilTests.length : 0;
  const avgK = dbSoilTests.length ? dbSoilTests.reduce((acc: number, test: any) => acc + Number(test.potassium || 0), 0) / dbSoilTests.length : 0;
  const avgPH = dbSoilTests.length ? dbSoilTests.reduce((acc: number, test: any) => acc + Number(test.ph || test.pH || 0), 0) / dbSoilTests.length : 0;

  // Calculate salinity, moisture, and temperature
  const avgSalinity = dbSoilTests.length ? dbSoilTests.reduce((acc: number, test: any) => acc + Number(test.salinity || 0), 0) / dbSoilTests.length : 0;
  const avgMoisture = dbSoilTests.length ? dbSoilTests.reduce((acc: number, test: any) => acc + Number(test.soil_moisture || 0), 0) / dbSoilTests.length : 0;
  const avgTemp = dbSoilTests.length ? dbSoilTests.reduce((acc: number, test: any) => acc + Number(test.temperature || 0), 0) / dbSoilTests.length : 0;

  const soilHealthTrends = {
    labels: ['Nitrogen', 'Phosphorus', 'Potassium', 'pH (x10)', 'Salinity', 'Moisture', 'Temp (°C)'], // Scaled pH so it shows up on the same graph visually
    datasets: [
      {
        label: 'Average Soil Nutrient Levels Across All Tested Farms',
        data: [avgN, avgP, avgK, avgPH * 10, avgSalinity, avgMoisture, avgTemp],
        backgroundColor: [
          'hsl(var(--accent))',
          'hsl(var(--warning))',
          'hsl(var(--primary))',
          'hsl(var(--success))',
          'hsl(var(--muted))',
          'hsl(var(--destructive))', // You can add your own custom hsl vars if these don't exist
          'hsl(var(--secondary))',
        ],
        borderWidth: 1,
      }
    ],
  };

  // Group farms by actual soil types reported in the database
  const soilTypeCounts: Record<string, number> = {};
  farms.forEach((farm: any) => {
    const type = farm.soilType || 'Unknown';
    soilTypeCounts[type] = (soilTypeCounts[type] || 0) + 1;
  });

  const farmDistribution = {
    labels: Object.keys(soilTypeCounts).map(t => t.charAt(0).toUpperCase() + t.slice(1)),
    datasets: [
      {
        data: Object.values(soilTypeCounts),
        backgroundColor: [
          'hsl(var(--primary))',
          'hsl(var(--accent))',
          'hsl(var(--warning))',
          'hsl(var(--success))',
          'hsl(var(--muted))'
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const handleAddRule = () => {
    if (newRule.currentCrop && newRule.recommendedCrop && newRule.reason) {
      addCropRule({
        ...newRule,
        active: true,
      });
      setNewRule({
        currentCrop: '',
        recommendedCrop: '',
        reason: '',
        condition: '',
      });
    }
  };

  const refreshAllData = () => {
    farms.forEach(farm => updateSoilData(farm.id));
    generateWeatherData();
  };

  const exportData = () => {
    const data = {
      farms,
      farmers,
      soilData,
      weatherData,
      cropRules,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cropwise-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-earth p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-card rounded-xl shadow-earth p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-crop bg-clip-text text-transparent">
                TANIM Admin
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {currentUser?.role === 'admin' ? 'Administrator' : 'Farmer'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="earth" onClick={refreshAllData} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
              <Button variant="crop" onClick={exportData} className="gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-earth">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Farms</p>
                  <p className="text-2xl font-bold">{farms.length}</p>
                </div>
                <MapPin className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-earth">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Farmers</p>
                  <p className="text-2xl font-bold">{farmers.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-earth">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crop Rules</p>
                  <p className="text-2xl font-bold">{cropRules.filter(r => r.active).length}</p>
                </div>
                <Settings className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-earth">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Soil Health</p>
                  <p className="text-2xl font-bold">
                    {Math.round(avgN || 0)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="farms">Farms</TabsTrigger>
            <TabsTrigger value="farmers">Farmers</TabsTrigger>
            <TabsTrigger value="data">Crop Management</TabsTrigger>
            <TabsTrigger value="fertilizer">Fertilizer Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Soil Health Trends */}
              <Card className="shadow-earth">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    Soil Health Trends
                  </CardTitle>
                  <CardDescription>
                    Historical nutrient levels across all farms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar data={soilHealthTrends} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              {/* Farm Distribution */}
              <Card className="shadow-earth">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Farm Soil Distribution
                  </CardTitle>
                  <CardDescription>
                    Distribution of farms by soil type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Doughnut data={farmDistribution} options={doughnutOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Weather */}
            <Card className="shadow-earth">
              <CardHeader>
                <CardTitle>Weather Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {(liveWeather.length > 0 ? liveWeather : weatherData).map((weather, index) => (
                    <div key={index} className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl mb-2">{weather.icon}</div>
                      <div className="font-medium">{weather.day}</div>
                      <div className="text-sm text-muted-foreground">{weather.condition}</div>
                      <div className="text-sm font-medium">{weather.temperature}°C</div>
                      <div className="text-xs text-muted-foreground">{weather.humidity}% humidity</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="farms" className="space-y-6">
            <FarmMap />
          </TabsContent>

          <TabsContent value="farmers" className="space-y-6">
            <Card className="shadow-earth">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Farmer Management
                </CardTitle>
                <Dialog open={isAddFarmerOpen} onOpenChange={setIsAddFarmerOpen}>
                  <DialogTrigger asChild>
                    <Button variant="earth" className="gap-2">
                      <Plus className="h-4 w-4" /> Add Farmer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Farmer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input value={newFarmer.username} onChange={(e) => setNewFarmer({ ...newFarmer, username: e.target.value })} placeholder="Enter farmer's username" />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" value={newFarmer.password} onChange={(e) => setNewFarmer({ ...newFarmer, password: e.target.value })} placeholder="Set temporary password" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={newFarmer.phone} onChange={(e) => setNewFarmer({ ...newFarmer, phone: e.target.value })} placeholder="Enter phone number" />
                      </div>
                      <div className="space-y-2">
                        <Label>Language Support</Label>
                        <Select value={newFarmer.language} onValueChange={(val) => setNewFarmer({ ...newFarmer, language: val })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English (EN)</SelectItem>
                            <SelectItem value="tl">Tagalog (TL)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Farm Details Section */}
                      <Separator />
                      <p className="text-sm font-semibold text-muted-foreground pt-2">Farm Details (Optional)</p>
                      <div className="space-y-2">
                        <Label>Farm Name</Label>
                        <Input value={newFarmer.farm_name} onChange={(e) => setNewFarmer({ ...newFarmer, farm_name: e.target.value })} placeholder="Enter farm name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Farm Size (Hectares)</Label>
                        <Input type="number" step="any" value={newFarmer.farm_measurement} onChange={(e) => setNewFarmer({ ...newFarmer, farm_measurement: e.target.value })} placeholder="Enter size in hectares" />
                      </div>
                      <div className="space-y-2">
                        <Label>Primary Soil Type</Label>
                        <Select value={newFarmer.soilType} onValueChange={(val) => setNewFarmer({ ...newFarmer, soilType: val })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select soil type" />
                          </SelectTrigger>
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
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {farmers.map((farmer: any) => {
                    // Match the foreign key `farmer_id` on the `farm` table to the `farmer_id` on the `farmer` table
                    const assignedFarms = farms.filter((f: any) => f.farmer_id === farmer.farmer_id || f.farmer_id === farmer.id);
                    return (
                      <Card key={farmer.farmer_id || farmer.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-lg">{farmer.username || farmer.name}</h3>
                            <p className="text-sm text-muted-foreground">{farmer.phone || 'No phone'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                {assignedFarms.length} farms
                              </Badge>
                              <Badge variant="secondary">
                                {farmer.language?.toUpperCase() || 'EN'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-3 mb-1">
                              <p className="text-sm text-muted-foreground font-medium">Assigned Farms</p>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0" 
                                onClick={() => {
                                  setSelectedFarmerId(farmer.farmer_id || farmer.id);
                                  setIsAddFarmOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4 text-primary" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {assignedFarms.length === 0 ? (
                                <div className="text-xs text-muted-foreground italic">None assigned</div>
                              ) : (
                                assignedFarms.map((farm: any) => (
                                  <div key={farm.farm_id || farm.id} className="text-xs bg-muted p-1 rounded px-2">
                                    {farm.farm_name || farm.name} ({farm.farm_measurement || farm.size || 0} hectares)
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                
                {/* Add Farm Dialog */}
                <Dialog open={isAddFarmOpen} onOpenChange={setIsAddFarmOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Farm</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Farm Name</Label>
                        <Input value={newFarm.farm_name} onChange={(e) => setNewFarm({ ...newFarm, farm_name: e.target.value })} placeholder="Enter farm name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Farm Size (Hectares)</Label>
                        <Input type="number" step="any" value={newFarm.farm_measurement} onChange={(e) => setNewFarm({ ...newFarm, farm_measurement: e.target.value })} placeholder="Enter size in hectares" />
                      </div>
                      <div className="space-y-2">
                        <Label>Primary Soil Type</Label>
                        <Select value={newFarm.soilType} onValueChange={(val) => setNewFarm({ ...newFarm, soilType: val })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select soil type" />
                          </SelectTrigger>
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
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Real-time Soil Data (Now from Supabase) */}
              <Card className="shadow-earth">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-accent" />
                    Real-time Soil Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {dbSoilTests.length === 0 ? (
                      <div className="text-center p-4 text-muted-foreground italic">No soil tests recorded yet.</div>
                    ) : (
                      dbSoilTests.map((test: any) => {
                        const farmName = farms.find((f: any) => f.farm_id === test.farm_id || f.id === test.farm_id)?.farm_name || 'Unknown Farm';
                        return (
                          <Card key={test.test_id || test.id} className="p-4 border-l-4 border-l-primary">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">{farmName}</h4>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                ID: {String(test.test_id || test.id).substring(0, 8)}...
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-2 rounded">
                              <div><span className="font-medium text-primary">N:</span> {test.nitrogen}%</div>
                              <div><span className="font-medium text-accent">P:</span> {test.phosphorus}%</div>
                              <div><span className="font-medium text-warning">K:</span> {test.potassium}%</div>
                              <div><span className="font-medium text-success">pH:</span> {test.ph || test.pH}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs mt-2 bg-background p-2 rounded border border-border">
                              <div className="flex flex-col">
                                <span className="font-semibold text-muted-foreground mb-1">Classification:</span>
                                <Badge variant="outline" className="w-fit text-[10px] uppercase font-bold">{test.npk_classification || test.classification || 'UNKNOWN'}</Badge>
                              </div>
                              <div className="text-right flex flex-col justify-center">
                                <span className="font-semibold text-muted-foreground mb-1">Moisture:</span>
                                <span className="text-sm font-medium">{test.soil_moisture || test.moisture || 0}%</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                              <div><Thermometer className="inline w-3 h-3 mr-1" /> {test.temperature}°C</div>
                              <div className="text-right">Salinity: {test.salinity || 0}%</div>
                            </div>
                            <div className="mt-3 text-xs text-muted-foreground border-t pt-2">
                              Test Date: {new Date(test.created_at).toLocaleString()}
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* System Activity (From tanim_system) */}
              <Card className="shadow-earth">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    Cropping System History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {dbSystemActivity.length === 0 ? (
                      <div className="text-center p-4 text-muted-foreground italic">No system activity logged yet.</div>
                    ) : (
                      dbSystemActivity.map((activity: any) => {
                        const farmName = farms.find((f: any) => f.farm_id === activity.farm_id || f.id === activity.farm_id)?.farm_name || 'Unknown Farm';
                        return (
                          <div key={activity.system_id || activity.id} className="p-4 bg-muted rounded-lg border border-border">
                            <h4 className="font-medium mb-1 text-primary">{activity.crop_name || 'Unknown Crop'} System</h4>
                            <p className="text-sm mb-2 text-muted-foreground">Farm: {farmName}</p>

                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div className="flex items-center justify-between bg-background p-2 rounded border border-border">
                                <span className="text-xs text-muted-foreground">Status</span>
                                <Badge variant={activity.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">
                                  {activity.status}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between bg-background p-2 rounded border border-border">
                                <span className="text-xs text-muted-foreground">Expected Yield</span>
                                <span className="text-xs font-medium text-accent">{activity.expected_yield}</span>
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground flex justify-between mt-2 pt-2 border-t border-border/50">
                              <span>Planted: {new Date(activity.planting_date).toLocaleDateString()}</span>
                              <span>Harvest: {new Date(activity.harvesting_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fertilizer" className="space-y-6">
             <Card className="shadow-earth">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Droplets className="h-5 w-5 text-success" />
                     Fertilizer Application Timeline
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {farms.length === 0 ? (
                        <div className="col-span-full">
                           <p className="text-muted-foreground text-center p-8 border-2 border-dashed border-border rounded-lg">No farms registered yet.</p>
                        </div>
                     ) : (
                        farms.map((farm: any) => {
                           const cropName = dbSystemActivity.find((a: any) => a.farm_id === farm.farm_id || a.farm_id === farm.id)?.crop_name || 'Mixed Crops';
                           return (
                             <Card key={farm.farm_id || farm.id} className="border-border shadow-sm flex flex-col h-full bg-card/50">
                                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                   <div className="flex justify-between items-start">
                                      <CardTitle className="text-lg leading-tight text-primary">{farm.farm_name || farm.name}</CardTitle>
                                      <Badge variant="secondary" className="text-[10px] whitespace-nowrap ml-2">
                                         {cropName}
                                      </Badge>
                                   </div>
                                </CardHeader>
                                <CardContent className="pt-4 flex-1">
                                   <div className="relative pl-6 border-l-2 border-border/60 space-y-6">
                                      {/* Mock timeline items */}
                                      <div className="relative">
                                         <div className="absolute -left-[31px] top-1.5 bg-success w-3.5 h-3.5 rounded-full border-2 border-background ring-2 ring-success/20 shadow-sm z-10" />
                                         <div>
                                            <div className="flex justify-between items-center mb-1 gap-2">
                                               <h4 className="font-semibold text-sm text-foreground leading-tight">Ammonium Nitrate</h4>
                                               <span className="text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full whitespace-nowrap">Just now</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-snug">Applied 50kg/ha (34-0-0) as vegetative top dressing.</p>
                                         </div>
                                      </div>
                                      
                                      <div className="relative">
                                         <div className="absolute -left-[31px] top-1.5 bg-muted-foreground/60 w-3 h-3 rounded-full border-2 border-background z-10" />
                                         <div className="opacity-80 hover:opacity-100 transition-opacity">
                                            <div className="flex justify-between items-center mb-1 gap-2">
                                               <h4 className="font-medium text-sm text-foreground leading-tight">Superphosphate</h4>
                                               <span className="text-[10px] text-muted-foreground whitespace-nowrap">2 weeks ago</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-snug">Applied 20kg/ha (0-46-0) during basal application.</p>
                                         </div>
                                      </div>
                                      
                                      <div className="relative">
                                         <div className="absolute -left-[31px] top-1.5 bg-muted-foreground/60 w-3 h-3 rounded-full border-2 border-background z-10" />
                                         <div className="opacity-60 hover:opacity-100 transition-opacity">
                                            <div className="flex justify-between items-center mb-1 gap-2">
                                               <h4 className="font-medium text-sm text-foreground leading-tight">Potassium Chloride</h4>
                                               <span className="text-[10px] text-muted-foreground whitespace-nowrap">1 month ago</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-snug">Applied 30kg/ha (0-0-60) pre-planting preparation.</p>
                                         </div>
                                      </div>
                                   </div>
                                </CardContent>
                             </Card>
                           );
                        })
                     )}
                  </div>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
