import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCropStore } from '@/stores/cropStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye } from 'lucide-react';

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
  const { farms, soilData } = useCropStore();

  // Farm coordinates around Cagayan de Oro City, Philippines
  const farmLocations = [
    { id: 'farm-1', name: 'Green Valley Farm', lat: 8.4542, lng: 124.6319, color: '#22c55e' },
    { id: 'farm-2', name: 'Sunrise Agriculture', lat: 8.4712, lng: 124.6542, color: '#3b82f6' },
    { id: 'farm-3', name: 'Golden Harvest', lat: 8.4328, lng: 124.6124, color: '#f59e0b' },
    { id: 'farm-4', name: 'Peaceful Acres', lat: 8.4789, lng: 124.6701, color: '#8b5cf6' },
    { id: 'farm-5', name: 'Organic Oasis', lat: 8.4401, lng: 124.5987, color: '#ef4444' },
  ];

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
    farmLocations.forEach((farmLocation) => {
      const farm = farms.find(f => f.name === farmLocation.name);
      const soil = farm ? soilData[farm.id] : null;
      
      const popupContent = `
        <div style="padding: 12px;">
          <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 8px; margin-top: 0;">
            ${farmLocation.name}
          </h3>
          ${farm ? `
            <div style="font-size: 12px;">
              <div style="margin-bottom: 4px;"><strong>Size:</strong> ${farm.size} hectares</div>
              <div style="margin-bottom: 4px;"><strong>Soil:</strong> ${farm.soilType}</div>
              <div style="margin-bottom: 4px;"><strong>Crops:</strong> ${farm.currentCrops.join(', ')}</div>
              ${soil ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ccc;">
                  <div style="margin-bottom: 2px;"><strong>N:</strong> ${soil.nitrogen}%</div>
                  <div style="margin-bottom: 2px;"><strong>P:</strong> ${soil.phosphorus}%</div>
                  <div style="margin-bottom: 2px;"><strong>K:</strong> ${soil.potassium}%</div>
                  <div><strong>pH:</strong> ${soil.pH}</div>
                </div>
              ` : ''}
            </div>
          ` : '<div style="font-size: 12px; color: #666;">No farm data available</div>'}
        </div>
      `;

      L.marker([farmLocation.lat, farmLocation.lng], {
        icon: createCustomIcon(farmLocation.color)
      }).addTo(map).bindPopup(popupContent);
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [farms, soilData]);

  return (
    <div className="space-y-6">
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
              style={{ minHeight: '400px' }}
            />
            
            <div className="absolute top-4 left-4 bg-card p-3 rounded-lg shadow-earth">
              <h4 className="font-medium text-sm mb-2">Legend</h4>
              <div className="space-y-1">
                {farmLocations.map((farmLocation) => (
                  <div key={farmLocation.id} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full border border-white"
                      style={{ backgroundColor: farmLocation.color }}
                    />
                    <span>{farmLocation.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farm List as Alternative View */}
      <Card className="shadow-earth">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Farm Locations (List View)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farmLocations.map((farmLocation) => {
              const farm = farms.find(f => f.name === farmLocation.name);
              const soil = farm ? soilData[farm.id] : null;
              
              return (
                <Card key={farmLocation.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{farmLocation.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {farmLocation.lat.toFixed(4)}, {farmLocation.lng.toFixed(4)}
                      </p>
                    </div>
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: farmLocation.color }}
                    />
                  </div>
                  
                  {farm && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{farm.size} hectares</Badge>
                        <Badge variant="secondary">{farm.soilType}</Badge>
                      </div>
                      <div className="text-sm">
                        <strong>Current Crops:</strong> {farm.currentCrops.join(', ')}
                      </div>
                      {soil && (
                        <div className="grid grid-cols-2 gap-2 text-xs bg-muted p-2 rounded">
                          <div>N: {soil.nitrogen}%</div>
                          <div>P: {soil.phosphorus}%</div>
                          <div>K: {soil.potassium}%</div>
                          <div>pH: {soil.pH}</div>
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
                {farms.reduce((total, farm) => total + farm.size, 0)} hectares
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Active Farms</h4>
              <p className="text-2xl font-bold text-accent">{farms.length}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Avg Soil Health</h4>
              <p className="text-2xl font-bold text-success">
                {Math.round(
                  Object.values(soilData).reduce((acc, soil) => acc + soil.nitrogen, 0) /
                  Object.values(soilData).length
                )}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};