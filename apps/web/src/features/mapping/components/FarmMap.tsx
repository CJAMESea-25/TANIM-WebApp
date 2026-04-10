import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User, MapPin, Tractor, Droplets, Thermometer, Wind, Leaf, Activity } from 'lucide-react';

// Fix Leaflet default icon paths broken by Vite bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom green farm marker
const farmIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#3a5a40;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.35);border:2.5px solid #fff;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize:    [36, 36],
  iconAnchor:  [18, 36],
  popupAnchor: [0, -38],
});

// Auto-fit map to show all farm markers
const FitBounds = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [52, 52], maxZoom: 14 });
    }
  }, [map, positions]);
  return null;
};

export interface FarmRecord {
  farm_id?: string;
  id?: string;
  farm_name?: string;
  name?: string;
  latitude?: number | null;
  longitude?: number | null;
  soilType?: string;
  farm_measurement?: number;
  farm_location?: string;
  farmLocation?: string;
  farmer_id?: string;
}

export interface FarmMapProps {
  farms?: FarmRecord[];
  farmers?: any[];
  soilTests?: any[];
}

export const FarmMap: React.FC<FarmMapProps> = ({ farms = [], farmers = [], soilTests = [] }) => {
  const [selectedFarm, setSelectedFarm] = useState<FarmRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Separate farms with GPS from those without
  const farmsWithCoords  = farms.filter(f => f.latitude != null && f.longitude != null && f.latitude !== 0 && f.longitude !== 0);
  const farmsWithoutCoords = farms.filter(f => !f.latitude || !f.longitude || (f.latitude === 0 && f.longitude === 0));

  const markers = farmsWithCoords.map(f => ({
    id:    f.farm_id || f.id || f.farm_name || 'farm',
    label: f.farm_name || f.name || 'Unnamed Farm',
    pos:   [f.latitude!, f.longitude!] as [number, number],
    soil:  f.soilType ?? 'Unknown',
    area:  f.farm_measurement != null ? `${f.farm_measurement} ha` : '—',
    loc:   f.farm_location || f.farmLocation || '',
    originalFarm: f
  }));

  const positions = markers.map(m => m.pos);

  // Default center: Cagayan de Oro, Northern Mindanao, PH
  const defaultCenter: [number, number] = [8.4700, 124.6500];

  const soilColor = (soil: string) => {
    if (soil === 'clay')  return '#f5a623';
    if (soil === 'sandy') return '#e53935';
    return '#4caf50';
  };

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* Map container */}
      <div
        style={{
          flex: 1,
          height: 520,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1.5px solid #c4d8b0',
          boxShadow: '0 4px 24px rgba(58,90,64,0.10)',
          position: 'relative',
          minWidth: 0,
        }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {markers.length > 0 && <FitBounds positions={positions} />}
          {markers.map((farm) => (
            <Marker 
              key={farm.id} 
              position={farm.pos} 
              icon={farmIcon}
              eventHandlers={{
                click: () => {
                  setSelectedFarm(farm.originalFarm);
                  setIsModalOpen(true);
                }
              }}
            />
          ))}
        </MapContainer>

        {/* Overlay legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            zIndex: 1000,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(6px)',
            borderRadius: 10,
            padding: '8px 14px',
            border: '1px solid #d4e8c0',
            fontSize: 11,
            color: '#5a7a50',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontWeight: 700 }}>🗺 TANIM GIS</span>
          <span style={{ marginLeft: 10, color: '#8aaa7a' }}>
            {markers.length} farm{markers.length !== 1 ? 's' : ''} plotted
          </span>
        </div>

        {/* No GPS data overlay */}
        {markers.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: 14,
              padding: '24px 32px',
              border: '1.5px solid #d4e8c0',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              maxWidth: 320,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>📍</div>
            <div style={{ fontWeight: 700, color: '#2e3a28', fontSize: 15, marginBottom: 6 }}>
              No GPS Coordinates Found
            </div>
            <div style={{ fontSize: 12, color: '#6a7a60', lineHeight: 1.6 }}>
              None of your registered farms have latitude/longitude coordinates yet.
              Add GPS coordinates when creating a farm to plot them here.
            </div>
          </div>
        )}
      </div>

      {/* Side panel — farm list with GPS status */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          background: '#fff',
          borderRadius: 14,
          border: '1.5px solid #e0ddd4',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          maxHeight: 520,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0ede4', background: '#f8f5f0' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#2e3a28' }}>Farm GPS Status</div>
          <div style={{ fontSize: 11, color: '#8a9880', marginTop: 2 }}>
            {markers.length}/{farms.length} mapped
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {farms.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#aaa' }}>
              No farms registered yet.
            </div>
          ) : (
            <>
              {farmsWithCoords.map(farm => (
                <div
                  key={farm.farm_id || farm.id}
                  onClick={() => { setSelectedFarm(farm); setIsModalOpen(true); }}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #f5f0e8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fcfbef'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf50', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#2e3a28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {farm.farm_name || farm.name || 'Unnamed Farm'}
                    </div>
                    <div style={{ fontSize: 10, color: '#8a9880' }}>
                      {farm.latitude?.toFixed(4)}, {farm.longitude?.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))}
              {farmsWithoutCoords.map(farm => (
                <div
                  key={farm.farm_id || farm.id}
                  onClick={() => { setSelectedFarm(farm); setIsModalOpen(true); }}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #f5f0e8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fcfbef'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d0c8b8', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6a7a60', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {farm.farm_name || farm.name || 'Unnamed Farm'}
                    </div>
                    <div style={{ fontSize: 10, color: '#b0a898' }}>No GPS coordinates</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid #f0ede4', background: '#f8f5f0' }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#8a9880' }}>
            <span><span style={{ color: '#4caf50' }}>●</span> Mapped</span>
            <span><span style={{ color: '#d0c8b8' }}>●</span> No GPS</span>
          </div>
        </div>
      </div>

      {/* Farm & Farmer Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent style={{ maxWidth: 640, borderRadius: 16, padding: 0, overflow: 'hidden' }}>
          {selectedFarm && (() => {
            const farmer = farmers.find(f => f.farmer_id === selectedFarm.farmer_id || f.id === selectedFarm.farmer_id);
            const soilTest = soilTests.find(t => t.farm_id === selectedFarm.farm_id || t.farm_id === selectedFarm.id);
            const farmerName = farmer ? `${farmer.first_name || ''} ${farmer.last_name || ''}`.trim() || farmer.username : 'Unknown Farmer';
            const cropName = "Rice, Corn"; // Mock fallback

            return (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Header - Farm Banner */}
                <div style={{ background: 'linear-gradient(135deg, #3a5a40, #588157)', padding: '24px 32px', color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px' }}>
                      <Tractor size={20} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{selectedFarm.farm_name || selectedFarm.name || 'Unnamed Farm'}</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#d4e8c0', opacity: 0.9 }}>
                    <MapPin size={14} />
                    <span>{selectedFarm.farm_location || selectedFarm.farmLocation || 'Location not specified'}</span>
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
                        <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 2 }}>Contact / Username</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>{farmer?.contact_info || farmer?.username || '—'}</div>
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
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>{selectedFarm.farm_measurement ? `${selectedFarm.farm_measurement} Hectares` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 2 }}>Crops Planted</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>{cropName}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 2 }}>GPS Coordinates</div>
                        <div style={{ fontSize: 13, color: '#4a5a40', fontFamily: 'monospace', background: '#f5f0e8', padding: '6px 10px', borderRadius: 6, display: 'inline-block' }}>
                          {selectedFarm.latitude && selectedFarm.longitude 
                            ? `${selectedFarm.latitude.toFixed(6)}, ${selectedFarm.longitude.toFixed(6)}` 
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
                            {selectedFarm.soilType ? `${selectedFarm.soilType.charAt(0).toUpperCase()}${selectedFarm.soilType.slice(1)} Soil` : 'Unknown Soil Type'}
                          </span>
                          <span style={{ fontSize: 11, color: '#8a9880' }}>
                            Last tested: {new Date(soilTest.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                          <div style={{ background: '#fdfbfa', border: '1px solid #f0ede4', borderRadius: 10, padding: '12px 16px' }}>
                            <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 4 }}>Nitrogen (N)</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#2e3a28' }}>{soilTest.nitrogen || 0}</div>
                          </div>
                          <div style={{ background: '#fdfbfa', border: '1px solid #f0ede4', borderRadius: 10, padding: '12px 16px' }}>
                            <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 4 }}>Phosphorus (P)</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#2e3a28' }}>{soilTest.phosphorus || 0}</div>
                          </div>
                          <div style={{ background: '#fdfbfa', border: '1px solid #f0ede4', borderRadius: 10, padding: '12px 16px' }}>
                            <div style={{ fontSize: 11, color: '#8a9880', marginBottom: 4 }}>Potassium (K)</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#2e3a28' }}>{soilTest.potassium || 0}</div>
                          </div>
                          <div style={{ background: '#fdfbfa', border: '1px solid #f0ede4', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Thermometer size={16} color="#8a9880" />
                            <div>
                              <div style={{ fontSize: 10, color: '#8a9880' }}>pH Level</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>{soilTest.ph || 0}</div>
                            </div>
                          </div>
                          <div style={{ background: '#fdfbfa', border: '1px solid #f0ede4', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Droplets size={16} color="#8a9880" />
                            <div>
                              <div style={{ fontSize: 10, color: '#8a9880' }}>Moisture</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>{soilTest.moisture || 0}%</div>
                            </div>
                          </div>
                          <div style={{ background: '#fdfbfa', border: '1px solid #f0ede4', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Wind size={16} color="#8a9880" />
                            <div>
                              <div style={{ fontSize: 10, color: '#8a9880' }}>Hum/Temp</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#2e3a28' }}>{soilTest.humidity || 0}% / {soilTest.temperature || 0}°</div>
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

export default FarmMap;
