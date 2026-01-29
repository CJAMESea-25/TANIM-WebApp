import React, { useEffect } from 'react';
import { useCropStore } from '@/stores/cropStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CropNeighborFinder } from '@/components/CropNeighborFinder';
import { CropImage } from '@/components/CropImage';
import { LanguageSwitcher } from './LanguageSwitcher';
import { 
  Sprout, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Volume2,
  MapPin,
  Thermometer,
  Droplets
} from 'lucide-react';

export const FarmerInterface = () => {
  const {
    farms,
    auth,
    selectedFarm,
    setSelectedFarm,
    recommendations,
    generateRecommendations,
    weatherData,
    soilData,
    logout,
    t
  } = useCropStore();

  const currentUser = auth.currentUser;
  const userFarms = currentUser?.farmIds ? farms.filter(f => currentUser.farmIds!.includes(f.id)) : [];
  const currentFarm = farms.find(f => f.id === selectedFarm);
  const currentSoil = selectedFarm ? soilData[selectedFarm] : null;

  useEffect(() => {
    // Set default farm for farmer if none selected
    if (!selectedFarm && userFarms.length > 0) {
      setSelectedFarm(userFarms[0].id);
    }
  }, [selectedFarm, userFarms, setSelectedFarm]);

  useEffect(() => {
    if (selectedFarm) {
      generateRecommendations(selectedFarm);
    }
  }, [selectedFarm, generateRecommendations]);

  const getSoilHealthStatus = (nitrogen: number) => {
    if (nitrogen >= 60) return { status: 'good', label: 'Excellent', color: 'soil-health-good' };
    if (nitrogen >= 30) return { status: 'warning', label: 'Good', color: 'soil-health-warning' };
    return { status: 'poor', label: 'Needs Attention', color: 'soil-health-poor' };
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      default: return 'success';
    }
  };

  const speakRecommendation = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-earth p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <div className="bg-card rounded-xl shadow-earth p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sprout className="h-8 w-8 text-accent mr-2" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-crop bg-clip-text text-transparent">
                  CropWise
                </h1>
                <p className="text-sm text-muted-foreground">Welcome, {currentUser?.name}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {userFarms.length === 0 ? (
        <div className="max-w-md mx-auto">
          <Card className="shadow-earth">
            <CardContent className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">{t('noFarms')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('noFarms')}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Farm Selection */}
          {userFarms.length > 1 && (
            <div className="max-w-md mx-auto mb-6">
              <Card className="shadow-earth">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-accent" />
                    {t('myFarms')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {userFarms.map((farm) => (
                    <Button
                      key={farm.id}
                      variant={selectedFarm === farm.id ? "crop" : "earth"}
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => setSelectedFarm(farm.id)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{farm.name}</div>
                        <div className="text-xs opacity-80">
                          {farm.size} {t('hectares')} • {t(farm.soilType)} {t('soilType').toLowerCase()}
                        </div>
                        <div className="text-xs opacity-70">{farm.location}</div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {currentFarm && (
            <>
              {/* Weather Widget */}
              <div className="max-w-md mx-auto mb-6">
                <Card className="shadow-earth">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-accent" />
                      {t('weatherForecast')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-2">
                      {weatherData.slice(0, 5).map((weather, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">
                            {weather.day === 'Today' ? t('today') : 
                             weather.day === 'Tomorrow' ? t('tomorrow') :
                             weather.day === 'Wednesday' ? t('wednesday') :
                             weather.day === 'Thursday' ? t('thursday') :
                             weather.day === 'Friday' ? t('friday') : weather.day.slice(0, 3)}
                          </div>
                          <div className="text-lg mb-1">{weather.icon}</div>
                          <div className="text-xs font-medium">{weather.temperature}°C</div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Droplets className="h-3 w-3" />
                            {weather.humidity}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Soil Health */}
              {currentSoil && (
                <div className="max-w-md mx-auto mb-6">
                  <Card className="shadow-earth">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-accent" />
                        {t('soilHealth')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{t('nitrogen')} (N)</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent transition-all duration-500"
                                style={{ width: `${currentSoil.nitrogen}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{currentSoil.nitrogen}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{t('phosphorus')} (P)</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-warning transition-all duration-500"
                                style={{ width: `${(currentSoil.phosphorus / 50) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{currentSoil.phosphorus}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{t('potassium')} (K)</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${(currentSoil.potassium / 50) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{currentSoil.potassium}%</span>
                          </div>
                        </div>

                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{t('pH')}</span>
                          <Badge variant="outline" className="text-sm">
                            {currentSoil.pH}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-center">
                          <Badge 
                            className={`${getSoilHealthStatus(currentSoil.nitrogen).color} text-sm`}
                          >
                            {getSoilHealthStatus(currentSoil.nitrogen).label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Current Crops */}
              <div className="max-w-md mx-auto mb-6">
                <Card className="shadow-earth">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{t('currentCrops')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      {currentFarm.currentCrops.map((crop, index) => (
                        <CropImage
                          key={index}
                          cropName={crop}
                          showDetails
                          className="hover:shadow-sm transition-shadow"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Crop Companion Finder */}
              <CropNeighborFinder />

              {/* Recommendations */}
              <div className="max-w-md mx-auto mb-6">
                <Card className="shadow-earth">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-accent" />
                      {t('recommendations')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Sprout className="h-12 w-12 mx-auto mb-2 opacity-50" />
                         <p>{t('noRecommendations')}</p>
                         <p className="text-sm">{t('excellent')}!</p>
                      </div>
                    ) : (
                      recommendations.map((rec) => (
                        <Card key={rec.id} className="crop-card border-l-4 border-l-accent">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge 
                                    variant={getUrgencyColor(rec.urgency) as any}
                                    className="text-xs"
                                  >
                                    {rec.urgency.toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {rec.type}
                                  </Badge>
                                </div>
                                <h4 className="font-medium text-sm mb-1">
                                  {rec.currentCrop} → {rec.recommendedCrop}
                                </h4>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {rec.reason}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {t('nextPlanting')}: {rec.nextPlanting}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="ml-2 p-1 h-auto"
                                onClick={() => speakRecommendation(
                                  `Recommendation: Replace ${rec.currentCrop} with ${rec.recommendedCrop}. Reason: ${rec.reason}. Next planting: ${rec.nextPlanting}.`
                                )}
                              >
                                <Volume2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">{t('benefits')}:</p>
                              <div className="flex flex-wrap gap-1">
                                {rec.benefits.slice(0, 2).map((benefit, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    ✓ {benefit}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="mt-3 flex gap-2">
                              <Button variant="crop" size="sm" className="flex-1">
                                {t('setReminder')}
                              </Button>
                              <Button variant="earth" size="sm" className="flex-1">
                                {t('learnMore')}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};