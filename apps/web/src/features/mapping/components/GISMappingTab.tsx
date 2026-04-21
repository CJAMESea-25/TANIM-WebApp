import React from 'react';
import { FarmMap } from '@/features/mapping/components/FarmMap';
import { Plus } from 'lucide-react';

export interface GISMappingTabProps {
  farms: any[];
  farmers?: any[];
  dbSoilTests?: any[];
  onAddFarmer: () => void;
}

export const GISMappingTab = ({ farms, farmers = [], dbSoilTests = [], onAddFarmer }: GISMappingTabProps) => {
  const farmsWithCoords = farms.filter(f => f.latitude != null && f.longitude != null);
  const needsSetup = farms.length > 0 && farmsWithCoords.length === 0;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 bg-[#f0ede4] px-4 py-4 pb-8 sm:px-6 sm:py-5 lg:px-9">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-[520px]">
          <h1 className="text-[clamp(1.375rem,4vw+0.5rem,1.875rem)] font-extrabold leading-tight tracking-tight text-[#1e2a1e]">
            GIS Mapping
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#6a7a60]">
            Interactive geographic mapping of registered farms and land parcels.{' '}
            <strong style={{ color: '#3a5a40' }}>{farmsWithCoords.length}/{farms.length}</strong> farms have GPS coordinates.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddFarmer}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#3a5a40] px-[18px] py-2.5 text-[13px] font-semibold text-white sm:w-auto"
          style={{ boxShadow: '0 2px 8px rgba(58,90,64,0.25)' }}
        >
          <Plus size={14} /> Add Farmer
        </button>
      </div>

      {/* DB setup banner — shown when farms exist but none have coordinates */}
      {needsSetup && (
        <div style={{
          background: 'linear-gradient(135deg, #fff8e1, #fffde7)',
          border: '1.5px solid #f0d060',
          borderRadius: 12,
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#7a6010', marginBottom: 4 }}>
              Database Setup Required for GPS Mapping
            </div>
            <div style={{ fontSize: 12, color: '#9a8030', lineHeight: 1.6 }}>
              Your farms don't have GPS coordinates yet. To enable map plotting, run this SQL in your{' '}
              <a href="https://supabase.com/dashboard/project/hvvmzhaafpnhnhwlkhsz/editor" target="_blank" rel="noreferrer" style={{ color: '#3a5a40', fontWeight: 700 }}>
                Supabase SQL Editor
              </a>
              :
            </div>
            <code style={{
              display: 'block', marginTop: 8,
              background: 'rgba(0,0,0,0.06)', borderRadius: 6, padding: '8px 12px',
              fontSize: 11, color: '#4a3a10', fontFamily: 'monospace', letterSpacing: '0.01em',
            }}>
              ALTER TABLE public.farm ADD COLUMN IF NOT EXISTS latitude double precision;<br />
              ALTER TABLE public.farm ADD COLUMN IF NOT EXISTS longitude double precision;
            </code>
            <div style={{ fontSize: 11, color: '#9a8030', marginTop: 8 }}>
              After running the SQL, add GPS coordinates to farms via "Add New Farm" or "Add Farmer" buttons.
            </div>
          </div>
        </div>
      )}

      {/* Live Leaflet map — full width; stacks vertically on narrow screens */}
      <div className="w-full min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <FarmMap farms={farms} farmers={farmers} soilTests={dbSoilTests} />
      </div>
    </div>
  );
};

