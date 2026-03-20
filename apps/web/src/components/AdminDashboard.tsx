import React, { useEffect, useRef } from 'react';
import { useCropStore } from '@/stores/cropStore';
import { useFarms } from '@/hooks/useFarms';
import { useFarmers } from '@/hooks/useFarmers';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { useSoilTests } from '@/hooks/useSoilTests';
import { useSystemActivity } from '@/hooks/useSystemActivity';
import { supabase } from '@/lib/supabaseClient';
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
            <TabsTrigger value="rules">Crop Rules</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
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
                  {weatherData.map((weather, index) => (
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Farmer Management
                </CardTitle>
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
                            <p className="text-sm text-muted-foreground font-medium mb-1">Assigned Farms:</p>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            {/* AI Model Configuration */}
            <Card className="shadow-earth border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  {t('aiCropRulesEngine')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t('aiCropRulesDescription')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="aiModel">{t('aiModel')}</Label>
                      <select
                        id="aiModel"
                        className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                      >
                        <option value="gpt-4">GPT-4 - {t('highAccuracy')}</option>
                        <option value="claude-3">Claude-3 - {t('balanced')}</option>
                        <option value="gemini-pro">Gemini Pro - {t('fast')}</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="confidence">{t('confidenceThreshold')}</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="range"
                          id="confidence"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          defaultValue="0.8"
                          className="flex-1"
                        />
                        <span className="text-sm">80%</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="updateFreq">{t('autoUpdateFrequency')}</Label>
                      <select
                        id="updateFreq"
                        className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                      >
                        <option value="real-time">{t('realTime')}</option>
                        <option value="daily">{t('daily')}</option>
                        <option value="weekly">{t('weekly')}</option>
                        <option value="manual">{t('manual')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <h4 className="font-medium mb-2 text-primary">{t('aiCapabilities')}</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• {t('realTimeAnalysis')}</li>
                        <li>• {t('weatherIntegration')}</li>
                        <li>• {t('soilDataProcessing')}</li>
                        <li>• {t('predictiveModeling')}</li>
                        <li>• {t('multicropOptimization')}</li>
                      </ul>
                    </div>
                    <Button className="w-full" variant="default">
                      <Zap className="h-4 w-4 mr-2" />
                      {t('generateAiRules')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI-Generated Rules */}
            <Card className="shadow-earth">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-accent" />
                  {t('aiGeneratedRules')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {t('lastUpdated')}: {new Date().toLocaleString()}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {cropRules.length} {t('activeRules')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* AI Rules Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{t('optimizedRules')}</span>
                      </div>
                      <p className="text-lg font-bold text-green-600 mt-1">{cropRules.filter(r => r.active).length}</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{t('accuracy')}</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600 mt-1">94.2%</p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">{t('processing')}</span>
                      </div>
                      <p className="text-lg font-bold text-orange-600 mt-1">1.2s</p>
                    </div>
                  </div>

                  {/* Rules Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('currentCrop')}</TableHead>
                        <TableHead>{t('recommendedCrop')}</TableHead>
                        <TableHead>{t('aiReason')}</TableHead>
                        <TableHead>{t('confidence')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead>{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cropRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.currentCrop}</TableCell>
                          <TableCell>{rule.recommendedCrop}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{rule.reason}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${Math.random() * 30 + 70}%` }}
                                ></div>
                              </div>
                              <span className="text-xs">{Math.floor(Math.random() * 30 + 70)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={rule.active}
                              onCheckedChange={(checked) =>
                                updateCropRule({ ...rule, active: checked })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                title={t('editRule')}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCropRule(rule.id)}
                                title={t('deleteRule')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Manual Rule Override */}
            <Card className="shadow-earth border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  {t('manualRuleOverride')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t('manualRuleDescription')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="currentCrop">{t('currentCrop')}</Label>
                    <Input
                      id="currentCrop"
                      value={newRule.currentCrop}
                      onChange={(e) => setNewRule(prev => ({ ...prev, currentCrop: e.target.value }))}
                      placeholder="e.g., Rice"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recommendedCrop">{t('recommendedCrop')}</Label>
                    <Input
                      id="recommendedCrop"
                      value={newRule.recommendedCrop}
                      onChange={(e) => setNewRule(prev => ({ ...prev, recommendedCrop: e.target.value }))}
                      placeholder="e.g., Beans"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">{t('reason')}</Label>
                    <Input
                      id="reason"
                      value={newRule.reason}
                      onChange={(e) => setNewRule(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g., Nitrogen fixation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="condition">{t('condition')}</Label>
                    <Input
                      id="condition"
                      value={newRule.condition}
                      onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
                      placeholder="e.g., nitrogen < 30"
                    />
                  </div>
                </div>
                <Button onClick={handleAddRule} className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addManualRule')}
                </Button>
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
                            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                              <div><Thermometer className="inline w-3 h-3 mr-1" /> {test.temperature}°C</div>
                              <div className="text-right">Moisture: {test.soil_moisture}%</div>
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
        </Tabs>
      </div>
    </div>
  );
};
