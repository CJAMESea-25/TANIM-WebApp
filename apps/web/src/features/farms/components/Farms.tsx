import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCropStore } from '@/features/crops/stores/cropStore';
import { useFarms } from '../hooks/useFarms';
import { useSoilTests } from '@/features/soil/hooks/useSoilTests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, Thermometer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const FarmMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Real data from Supabase
  const { data: dbFarms = [], isLoading } = useFarms() as any;
  const { data: dbSoilTests = [] } = useSoilTests() as any;

  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f43f5e'];

  const [selectedFarm, setSelectedFarm] = React.useState<any>(null);
  const selectedFarmTests = useMemo(() => {
    if (!selectedFarm) return [];
    return dbSoilTests
      .filter((t: any) => t.farm_id === selectedFarm.id || t.farm_id === selectedFarm.farm_id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [selectedFarm, dbSoilTests]);

  // Map real farms to map locations, generating fallback coordinates if none exist
  const farmLocations = useMemo(() => {
    return dbFarms.map((farm: any, index: number) => {
      // Default center: Cagayan de Oro City (8.4542, 124.6319)
      // If latitude/longitude is missing from the table, we spread them randomly
      let lat = 8.4542 + (Math.random() * 0.06 - 0.03);
      let lng = 124.6319 + (Math.random() * 0.06 - 0.03);

      if (farm.farm_location) {
        let loc = farm.farm_location;
        if (typeof loc === 'string') {
          try {
            loc = JSON.parse(loc);
          } catch (e) {
            console.error('Error parsing farm_location json', e);
          }
        }
        if (loc) {
          if (loc.latitude) lat = Number(loc.latitude);
          else if (loc.lat) lat = Number(loc.lat);

          if (loc.longitude) lng = Number(loc.longitude);
          else if (loc.lng) lng = Number(loc.lng);
        }
      } else if (farm.latitude || farm.lat) {
        lat = Number(farm.latitude || farm.lat);
        lng = Number(farm.longitude || farm.lng);
      }

      return {
        id: farm.id || farm.farm_id || `temp-${index}`,
        name: farm.farm_name || farm.name || `Farm ${index + 1}`,
        lat,
        lng,
        color: colors[index % colors.length],
        originalFarm: farm
      };
    });
  }, [dbFarms]);

  // Create custom icons for each farm
  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-farm-marker',
      html: `<div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map centered on Cagayan de Oro City, Philippines
    const map = L.map(mapRef.current).setView([8.4542, 124.6319], 12);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add farm markers
    farmLocations.forEach((loc: any) => {
      const farm = loc.originalFarm;

      // Find the most recent soil test for this farm. 
      // Assuming dbSoilTests might have multiple, we just grab the first matching one for simplicity, 
      // or filter by farm_id.
      const soil = farm ? dbSoilTests.find((t: any) => t.farm_id === farm.id || t.farm_id === farm.farm_id) : null;

      const popupContent = `
        <div style="padding: 12px;">
          <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 8px; margin-top: 0;">
            ${loc.name}
          </h3>
          ${farm ? `
            <div style="font-size: 12px;">
              <div style="margin-bottom: 4px;"><strong>Size:</strong> ${farm.size || farm.farm_measurement || 'N/A'} hectares</div>
              <div style="margin-bottom: 4px;"><strong>Soil:</strong> ${farm.soilType || 'Unknown'}</div>
              ${farm.currentCrops ? `<div style="margin-bottom: 4px;"><strong>Crops:</strong> ${Array.isArray(farm.currentCrops) ? farm.currentCrops.join(', ') : farm.currentCrops}</div>` : ''}
              ${soil ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ccc;">
                  <div style="margin-bottom: 2px;"><strong>N:</strong> ${soil.nitrogen}%</div>
                  <div style="margin-bottom: 2px;"><strong>P:</strong> ${soil.phosphorus}%</div>
                  <div style="margin-bottom: 2px;"><strong>K:</strong> ${soil.potassium}%</div>
                  <div style="margin-bottom: 2px;"><strong>pH:</strong> ${soil.ph || soil.pH}</div>
                  <div style="margin-bottom: 2px;"><strong>Class:</strong> ${soil.npk_classification || soil.classification || 'UNKNOWN'}</div>
                  <div style="margin-bottom: 2px;"><strong>Salinity:</strong> ${soil.salinity}%</div>
                  <div style="margin-bottom: 2px;"><strong>Moisture:</strong> ${soil.soil_moisture || soil.moisture || 0}%</div>
                  <div style="margin-bottom: 2px;"><strong>Temp:</strong> ${soil.temperature}°C</div>
                </div>
              ` : ''}
            </div>
          ` : '<div style="font-size: 12px; color: #666;">No farm data available</div>'}
        </div>
      `;

      L.marker([loc.lat, loc.lng], {
        icon: createCustomIcon(loc.color)
      }).addTo(map).bindPopup(popupContent);
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [farmLocations, dbSoilTests]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading farms...</div>;
  }

  if (farmLocations.length === 0) {
    return (
      <Card className="shadow-earth">
        <CardContent className="p-8 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No Farms Found</h3>
          <p className="text-muted-foreground">There are currently no farms registered in the database.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* Farm List as Alternative View (Moved to Top) */}
      <Card className="shadow-earth">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Registered Farms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {farmLocations.map((loc: any) => {
              const farm = loc.originalFarm;
              const soil = farm ? dbSoilTests.find((t: any) => t.farm_id === farm.id || t.farm_id === farm.farm_id) : null;

              return (
                <Card
                  key={loc.id}
                  className="p-4 border-l-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  style={{ borderLeftColor: loc.color }}
                  onClick={() => setSelectedFarm(farm || loc.originalFarm)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-lg leading-tight">{loc.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lat: {loc.lat.toFixed(4)}, Lng: {loc.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {farm && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {(farm.size || farm.farm_measurement) && <Badge variant="outline">{farm.size || farm.farm_measurement} hectares</Badge>}
                        {farm.soilType && <Badge variant="secondary" className="capitalize">{farm.soilType}</Badge>}
                      </div>

                      {farm.currentCrops && (
                        <div className="text-sm">
                          <strong>Current Crops:</strong> {Array.isArray(farm.currentCrops) ? farm.currentCrops.join(', ') : farm.currentCrops}
                        </div>
                      )}

                      {soil && (
                        <div className="grid grid-cols-4 gap-2 text-xs bg-muted p-2 rounded text-center">
                          <div><span className="font-semibold text-primary">N:</span> {soil.nitrogen}%</div>
                          <div><span className="font-semibold text-accent">P:</span> {soil.phosphorus}%</div>
                          <div><span className="font-semibold text-warning">K:</span> {soil.potassium}%</div>
                          <div><span className="font-semibold text-success">pH:</span> {soil.ph || soil.pH}</div>
                          <div className="col-span-4 mt-1 pt-1 border-t border-border flex justify-between px-1">
                            <span className="flex items-center"><span className="font-semibold text-muted-foreground mr-1">Class:</span> <Badge variant="outline" className="text-[10px] uppercase font-bold">{soil.npk_classification || soil.classification || 'UNKNOWN'}</Badge></span>
                            <span><span className="font-semibold text-muted-foreground mr-1">Moist:</span> {soil.soil_moisture || soil.moisture || 0}%</span>
                            <span><span className="font-semibold text-muted-foreground mr-1">Temp:</span> {soil.temperature}°C</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Map Moved Below the List view */}
      <Card className="shadow-earth">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Farm GIS Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div
              ref={mapRef}
              className="w-full h-96 rounded-lg shadow-lg"
              style={{ minHeight: '500px' }}
            />

            <div className="absolute top-4 left-4 bg-card p-3 rounded-lg shadow-earth z-[1000] border border-border">
              <h4 className="font-medium text-sm mb-2">Legend</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                {farmLocations.map((loc: any) => (
                  <div key={loc.id} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: loc.color }}
                    />
                    <span className="truncate max-w-[120px]" title={loc.name}>{loc.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farm Statistics */}
      <Card className="shadow-earth">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-accent" />
            Farm Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Total Area</h4>
              <p className="text-2xl font-bold text-primary">
                {dbFarms.reduce((total: number, farm: any) => total + (Number(farm.size) || Number(farm.farm_measurement) || 0), 0)} hectares
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Active Farms</h4>
              <p className="text-2xl font-bold text-accent">{dbFarms.length}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Avg Soil Health</h4>
              <p className="text-2xl font-bold text-success">
                {dbSoilTests.length > 0
                  ? Math.round(
                    dbSoilTests.reduce((acc: number, soil: any) => acc + Number(soil.nitrogen || 0), 0) /
                    dbSoilTests.length
                  ) + '%'
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Soil Test History Dialog */}
      <Dialog open={!!selectedFarm} onOpenChange={(open) => !open && setSelectedFarm(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Soil Test History - {selectedFarm?.farm_name || selectedFarm?.name || 'Unknown Farm'}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedFarmTests.length === 0 ? (
              <p className="text-muted-foreground text-center p-8 bg-muted/50 rounded-lg border border-dashed border-border">No soil tests found for this farm.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>N-P-K</TableHead>
                    <TableHead>Moisture</TableHead>
                    <TableHead>Temp</TableHead>
                    <TableHead>pH</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedFarmTests.map((t: any) => (
                    <TableRow key={t.test_id || t.id}>
                      <TableCell className="whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="outline" className="uppercase text-[10px] whitespace-nowrap">{t.npk_classification || t.classification || 'UNKNOWN'}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{t.nitrogen}-{t.phosphorus}-{t.potassium}</TableCell>
                      <TableCell className="font-medium">{t.soil_moisture || t.moisture || 0}%</TableCell>
                      <TableCell>{t.temperature}°C</TableCell>
                      <TableCell>{t.ph || t.pH}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};