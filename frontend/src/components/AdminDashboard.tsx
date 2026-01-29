import React, { useEffect, useRef } from 'react';
import { useCropStore } from '@/stores/cropStore';
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
import { FarmMap } from './FarmMap';
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
  const {
    farms,
    farmers,
    soilData,
    weatherData,
    cropRules,
    auth,
    updateCropRule,
    addCropRule,
    deleteCropRule,
    updateSoilData,
    generateWeatherData,
    logout,
    t
  } = useCropStore();

  const currentUser = auth.currentUser;

  const [newRule, setNewRule] = React.useState({
    currentCrop: '',
    recommendedCrop: '',
    reason: '',
    condition: '',
  });

  // Generate dummy historical data for charts
  const soilHealthTrends = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Nitrogen',
        data: [45, 42, 38, 35, 32, 38],
        borderColor: 'hsl(var(--accent))',
        backgroundColor: 'Blue',
        tension: 0.4,
      },
      {
        label: 'Phosphorus',
        data: [28, 26, 24, 22, 20, 23],
        borderColor: 'hsl(var(--warning))',
        backgroundColor: 'hsl(var(--warning) / 0.1)',
        tension: 0.4,
      },
      {
        label: 'Potassium',
        data: [35, 33, 31, 29, 27, 30],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        tension: 0.4,
      },
      {
        label: 'pH',
        data: [6.5, 6.4, 6.3, 6.2, 6.1, 6.3],
        borderColor: 'hsl(var(--success))',
        backgroundColor: 'hsl(var(--success) / 0.1)',
        tension: 0.4,
      },
      {
        label: 'Temperature (°C)',
        data: [36, 25, 27, 47, 37, 17],
        borderColor: 'hsl(var(--muted))',
        backgroundColor: 'hsl(var(--muted) / 0.1)',
        tension: 0.4,
      },
      {
        label: 'Humidity (%)',
        data: [70, 65, 75, 80, 60, 68],
        borderColor: 'hsl(var(--foreground))',
        backgroundColor: 'hsl(var(--foreground) / 0.1)',
        tension: 0.4,
      },
      {
        label: 'Salinity',
        data: [120, 80, 100, 150, 90, 110],
        borderColor: 'hsl(var(--border))',
        backgroundColor: 'hsl(var(--border) / 0.1)',
        tension: 0.4,
      },
    ],
  };

  const farmDistribution = {
    labels: ['Clay', 'Loam', 'Sandy', 'Silt'],
    datasets: [
      {
        data: [
          farms.filter(f => f.soilType === 'clay').length,
          farms.filter(f => f.soilType === 'loam').length,
          farms.filter(f => f.soilType === 'sandy').length,
          farms.filter(f => f.soilType === 'silt').length,
        ],
        backgroundColor: [
          'hsl(var(--primary))',
          'hsl(var(--accent))',
          'hsl(var(--warning))',
          'hsl(var(--success))',
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
                Welcome back, {currentUser?.name}
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
              <Button variant="ghost" onClick={logout}>
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
                    {Math.round(
                      Object.values(soilData).reduce((acc, soil) => acc + soil.nitrogen, 0) /
                      Object.values(soilData).length
                    )}%
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
                    <Line data={soilHealthTrends} options={chartOptions} />
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
                  {farmers.map((farmer) => (
                    <Card key={farmer.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{farmer.name}</h3>
                          <p className="text-sm text-muted-foreground">{farmer.phone}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              {farmer.farms.length} farms
                            </Badge>
                            <Badge variant="secondary">
                              {farmer.language.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Assigned Farms:</p>
                          <div className="space-y-1">
                            {farmer.farms.map((farmId) => {
                              const farm = farms.find(f => f.id === farmId);
                              return farm ? (
                                <div key={farmId} className="text-xs">
                                  {farm.name} ({farm.size} hectares)
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
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
              {/* Real-time Soil Data */}
              <Card className="shadow-earth">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-accent" />
                    Real-time Soil Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {farms.map((farm) => {
                      const soil = soilData[farm.id];
                      return (
                        <Card key={farm.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{farm.name}</h4>
                            <Button
                              size="sm"
                              variant="earth"
                              onClick={() => updateSoilData(farm.id)}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>N: {soil.nitrogen}%</div>
                            <div>P: {soil.phosphorus}%</div>
                            <div>K: {soil.potassium}%</div>
                            <div>pH: {soil.pH}</div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Updated: {soil.lastUpdated.toLocaleTimeString()}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* System Information */}
              <Card className="shadow-earth">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Data Sources</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Soil Health: Simulated random values</li>
                        <li>• Weather: Random forecast generator</li>
                        <li>• Crop Pairs: Hardcoded knowledge base</li>
                        <li>• Farm Boundaries: Static polygon data</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">System Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Data Refresh Rate</span>
                          <Badge variant="outline">Manual</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Storage</span>
                          <Badge variant="outline">In-Memory</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Last Export</span>
                          <Badge variant="outline">Never</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <h4 className="font-medium mb-2 text-warning">Prototype Notice</h4>
                    </div>
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
