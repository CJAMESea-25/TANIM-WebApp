import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Plus } from 'lucide-react';

export interface FertilizerTabProps {
  farms: any[];
  dbSystemActivity: any[];
  onAddFarmer: () => void;
}

export const FertilizerTab = ({ farms, dbSystemActivity, onAddFarmer }: FertilizerTabProps) => (
  <div style={{ padding: '32px 36px', background: '#f0ede4', minHeight: '100vh' }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
      <div style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1e2a1e', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
          Fertilizer Management
        </h1>
        <p style={{ fontSize: 13.5, color: '#6a7a60', margin: 0, lineHeight: 1.6 }}>
          Track fertilizer application timelines across all registered farms.
        </p>
      </div>
      <button onClick={onAddFarmer} style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px',
        borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        background: '#3a5a40', color: '#fff', border: 'none',
        boxShadow: '0 2px 8px rgba(58,90,64,0.25)',
      }}>
        <Plus size={14} /> Add Farmer
      </button>
    </div>
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
                      <Badge variant="secondary" className="text-[10px] whitespace-nowrap ml-2">{cropName}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1">
                    <div className="relative pl-6 border-l-2 border-border/60 space-y-6">
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
                        <div className="opacity-80">
                          <div className="flex justify-between items-center mb-1 gap-2">
                            <h4 className="font-medium text-sm text-foreground leading-tight">Superphosphate</h4>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">2 weeks ago</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">Applied 20kg/ha (0-46-0) during basal application.</p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1.5 bg-muted-foreground/60 w-3 h-3 rounded-full border-2 border-background z-10" />
                        <div className="opacity-60">
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
  </div>
);
