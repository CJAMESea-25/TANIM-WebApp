import React from 'react';
import {
  Plus, Leaf, FlaskConical, Calendar, ChevronDown, ChevronUp,
  Loader2, AlertCircle, Search, SlidersHorizontal, Sprout, X,
} from 'lucide-react';
import {
  fetchAllFarmingSessionsRaw,
  normalizeFarmingSessionRow,
} from '@/features/farms/services/farmingSessionService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FertilizerApplication {
  fertilizer: string;
  bags_per_ha: number;
}
interface FertilizerOption {
  first_application: FertilizerApplication[];
  second_application: FertilizerApplication[];
}
interface FarmingPhase {
  name: string;
  day_start: number;
  day_end: number;
  description: string;
}
interface FarmingTimeline {
  phases: FarmingPhase[];
  total_days: number;
  template_id: string;
  cycle_start_date: string;
  planting_window_note?: string;
}
interface ModeOfApplication {
  first_application?: string;
  second_application?: string;
  organic_fertilizer?: string;
}
interface FertilizerRecommendation {
  crop: string;
  soil_ph: number;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  option_1?: FertilizerOption;
  option_2?: FertilizerOption;
  farming_timeline?: FarmingTimeline;
  organic_fertilizer?: string;
  mode_of_application?: ModeOfApplication;
  fertilizer_recommendation_rate?: string;
}
interface FarmEntry {
  farm: any;
  rec: FertilizerRecommendation | null;
}

export interface FertilizerTabProps {
  farms: any[];
  dbSystemActivity: any[];
  onAddFarmer: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function levelColor(level: string): { bg: string; color: string; border: string } {
  const l = level?.toLowerCase();
  if (l === 'high') return { bg: '#dcfce7', color: '#166534', border: '#86efac' };
  if (l === 'medium') return { bg: '#fef9c3', color: '#854d0e', border: '#fde047' };
  if (l === 'low') return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
  return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
}

const phaseColors = ['#3a5a40', '#6a9a58', '#a5c98a', '#d4e8c2'];

function fmtDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Left panel: Farm list item ───────────────────────────────────────────────

const FarmListItem = ({
  entry, isSelected, onClick,
}: { entry: FarmEntry; isSelected: boolean; onClick: () => void }) => {
  const { farm, rec } = entry;
  const name = farm.farm_name || farm.name || 'Unnamed Farm';
  const location = farm.farm_location || null;

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '12px 16px',
        background: isSelected ? '#3a5a40' : 'transparent',
        border: 'none', borderRadius: 10, cursor: 'pointer',
        transition: 'background 0.15s',
        display: 'flex', flexDirection: 'column', gap: 5,
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#eae5d9'; }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          fontSize: 13, fontWeight: 700, lineHeight: 1.3,
          color: isSelected ? '#fff' : '#1e2a1e',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </span>
        {rec ? (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
            background: isSelected ? 'rgba(255,255,255,0.2)' : '#dcfce7',
            color: isSelected ? '#fff' : '#166534',
          }}>
            ✓ Rec
          </span>
        ) : (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
            background: isSelected ? 'rgba(255,255,255,0.15)' : '#f1f5f9',
            color: isSelected ? 'rgba(255,255,255,0.7)' : '#94a3b8',
          }}>
            Pending
          </span>
        )}
      </div>

      {rec ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: isSelected ? 'rgba(255,255,255,0.8)' : '#6a7a60' }}>
            <Leaf size={10} />
            {rec.crop}
          </span>
          {rec.fertilizer_recommendation_rate && (
            <span style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.6)' : '#8a9880' }}>
              · NPK {rec.fertilizer_recommendation_rate}
            </span>
          )}
        </div>
      ) : (
        location && (
          <span style={{ fontSize: 11, color: isSelected ? 'rgba(255,255,255,0.6)' : '#8a9880', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {location}
          </span>
        )
      )}
    </button>
  );
};

// ─── Right panel: Detail view ─────────────────────────────────────────────────

const NutrientBadge = ({ label, value }: { label: string; value: string }) => {
  const { bg, color, border } = levelColor(value);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: `1px solid ${border}` }}>
      {label}: {value}
    </span>
  );
};

const ApplicationTable = ({ title, items, accent }: { title: string; items: FertilizerApplication[]; accent: string }) => (
  <div style={{ marginBottom: 0 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block' }} />
      {title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f7f2', borderRadius: 8, padding: '8px 14px', border: '1px solid #ece8e0' }}>
          <span style={{ fontSize: 13, color: '#2e3a28', fontWeight: 500, flex: 1 }}>{item.fertilizer}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#3a5a40', whiteSpace: 'nowrap', marginLeft: 16 }}>
            {item.bags_per_ha} <span style={{ fontWeight: 400, fontSize: 11, color: '#8a9880' }}>bags/ha</span>
          </span>
        </div>
      ))}
    </div>
  </div>
);

const OptionAccordion = ({ label, option, defaultOpen }: { label: string; option: FertilizerOption; defaultOpen?: boolean }) => {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div style={{ border: '1.5px solid #e8e3d8', borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: open ? '#f4f1ea' : '#fafaf7', border: 'none', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FlaskConical size={14} color="#3a5a40" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#2e3a28' }}>{label}</span>
        </div>
        {open ? <ChevronUp size={15} color="#8a9880" /> : <ChevronDown size={15} color="#8a9880" />}
      </button>
      {open && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {option.first_application?.length > 0 && (
            <ApplicationTable title="1st Application" items={option.first_application} accent="#3a5a40" />
          )}
          {option.second_application?.length > 0 && (
            <ApplicationTable title="2nd Application" items={option.second_application} accent="#8aaa6a" />
          )}
        </div>
      )}
    </div>
  );
};

const TimelineBar = ({ phases, totalDays, cycleStart }: { phases: FarmingPhase[]; totalDays: number; cycleStart?: string }) => (
  <div>
    {cycleStart && (
      <div style={{ fontSize: 12, color: '#8a9880', marginBottom: 10 }}>
        🗓 Cycle start: <strong style={{ color: '#3a5a40' }}>{fmtDate(cycleStart)}</strong>
        <span style={{ color: '#b5c4a5' }}> · </span>
        Total: <strong style={{ color: '#3a5a40' }}>{totalDays} days</strong>
      </div>
    )}
    <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 12, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      {phases.map((phase, i) => {
        const width = ((phase.day_end - phase.day_start + 1) / totalDays) * 100;
        return (
          <div
            key={i}
            style={{ width: `${width}%`, background: phaseColors[i % phaseColors.length], position: 'relative' }}
            title={`${phase.name}: Day ${phase.day_start}–${phase.day_end} — ${phase.description}`}
          />
        );
      })}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {phases.map((phase, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: phaseColors[i % phaseColors.length], flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2e3a28' }}>
              {phase.name} <span style={{ color: '#8a9880', fontWeight: 400 }}>Day {phase.day_start}–{phase.day_end}</span>
            </div>
            {phase.description && (
              <div style={{ fontSize: 11, color: '#8a9880', marginTop: 1, lineHeight: 1.4 }}>{phase.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1.5px solid #f0ede4' }}>
      {icon}
      <span style={{ fontSize: 13, fontWeight: 800, color: '#1e2a1e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
    </div>
    {children}
  </div>
);

const DetailPanel = ({ entry }: { entry: FarmEntry }) => {
  const { farm, rec } = entry;
  const name = farm.farm_name || farm.name || 'Unnamed Farm';
  const location = farm.farm_location || null;
  const size = farm.farm_measurement ? `${farm.farm_measurement} ha` : null;

  if (!rec) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 40 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0ede4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={24} color="#b5a898" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#2e3a28' }}>{name}</div>
        <div style={{ fontSize: 13, color: '#8a9880', textAlign: 'center', maxWidth: 320 }}>
          No fertilizer recommendation has been generated for this farm yet. The farmer needs to complete a farming session in the app.
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '28px 32px' }}>

      {/* Farm header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e2a1e', margin: '0 0 4px', lineHeight: 1.2 }}>{name}</h2>
            <div style={{ fontSize: 12, color: '#8a9880' }}>
              {[location, size].filter(Boolean).join(' · ') || 'No location info'}
            </div>
          </div>
          {rec.fertilizer_recommendation_rate && (
            <div style={{ background: 'linear-gradient(135deg,#3a5a40,#2e4a34)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>NPK Rate</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{rec.fertilizer_recommendation_rate}</div>
            </div>
          )}
        </div>

        {/* Crop + NPK badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef7ee', color: '#2e6b35', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid #b8ddb8' }}>
            <Leaf size={12} /> {rec.crop}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', padding: '3px 10px', background: '#e0f2fe', borderRadius: 20, border: '1px solid #7dd3fc' }}>
            pH {rec.soil_ph}
          </span>
          {rec.nitrogen && <NutrientBadge label="N" value={rec.nitrogen} />}
          {rec.phosphorus && <NutrientBadge label="P" value={rec.phosphorus} />}
          {rec.potassium && <NutrientBadge label="K" value={rec.potassium} />}
          {rec.organic_fertilizer && (
            <span style={{ fontSize: 11, color: '#6a7a60', background: '#f4f1ea', borderRadius: 20, padding: '4px 10px', border: '1px solid #e0d9cc' }}>
              🌿 {rec.organic_fertilizer}
            </span>
          )}
        </div>
      </div>

      {/* Mode of application */}
      {rec.mode_of_application && (
        <Section title="Mode of Application" icon={<Sprout size={14} color="#3a5a40" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rec.mode_of_application.organic_fertilizer && (
              <div style={{ background: '#f8f7f2', borderRadius: 8, padding: '10px 14px', border: '1px solid #ece8e0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#3a5a40', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organic </span>
                <span style={{ fontSize: 12, color: '#4a5a40' }}>{rec.mode_of_application.organic_fertilizer}</span>
              </div>
            )}
            {rec.mode_of_application.first_application && (
              <div style={{ background: '#f8f7f2', borderRadius: 8, padding: '10px 14px', border: '1px solid #ece8e0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#3a5a40', textTransform: 'uppercase', letterSpacing: '0.05em' }}>1st App. </span>
                <span style={{ fontSize: 12, color: '#4a5a40' }}>{rec.mode_of_application.first_application}</span>
              </div>
            )}
            {rec.mode_of_application.second_application && (
              <div style={{ background: '#f8f7f2', borderRadius: 8, padding: '10px 14px', border: '1px solid #ece8e0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#3a5a40', textTransform: 'uppercase', letterSpacing: '0.05em' }}>2nd App. </span>
                <span style={{ fontSize: 12, color: '#4a5a40' }}>{rec.mode_of_application.second_application}</span>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Fertilizer options */}
      {(rec.option_1 || rec.option_2) && (
        <Section title="Fertilizer Options" icon={<FlaskConical size={14} color="#3a5a40" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rec.option_1 && <OptionAccordion label="Option 1 — Complete Fertilizer Approach" option={rec.option_1} defaultOpen />}
            {rec.option_2 && <OptionAccordion label="Option 2 — Component Fertilizer Approach" option={rec.option_2} />}
          </div>
        </Section>
      )}

      {/* Farming timeline */}
      {rec.farming_timeline?.phases?.length > 0 && (
        <Section title="Farming Timeline" icon={<Calendar size={14} color="#3a5a40" />}>
          <TimelineBar
            phases={rec.farming_timeline.phases}
            totalDays={rec.farming_timeline.total_days}
            cycleStart={rec.farming_timeline.cycle_start_date}
          />
          {rec.farming_timeline.planting_window_note && (
            <div style={{ fontSize: 11, color: '#8a9880', marginTop: 14, padding: '10px 14px', background: '#fefce8', borderRadius: 8, border: '1px solid #fde68a', lineHeight: 1.5, fontStyle: 'italic' }}>
              💡 {rec.farming_timeline.planting_window_note}
            </div>
          )}
        </Section>
      )}
    </div>
  );
};

// ─── Empty state (nothing selected) ──────────────────────────────────────────

const EmptySelection = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, color: '#8a9880', userSelect: 'none' }}>
    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eae5d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Leaf size={28} color="#b5c4a5" />
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#4a5a40', marginBottom: 4 }}>Select a farm</div>
      <div style={{ fontSize: 12 }}>Choose a farm from the list to view its fertilizer recommendation.</div>
    </div>
  </div>
);

// ─── Main FertilizerTab ───────────────────────────────────────────────────────

export const FertilizerTab = ({ farms, onAddFarmer }: FertilizerTabProps) => {
  const [sessions, setSessions] = React.useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [cropFilter, setCropFilter] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // ── Fetch sessions ──
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await fetchAllFarmingSessionsRaw();
        if (!cancelled) setSessions(rows);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Build farm→rec map (latest session with rec per farm) ──
  const recByFarmId = React.useMemo(() => {
    const map = new Map<string, FertilizerRecommendation>();
    for (const raw of sessions) {
      const row = normalizeFarmingSessionRow(raw as Record<string, unknown>);
      if (!row.farm_id || map.has(row.farm_id)) continue;
      const rec = row.fertilizer_recommendation as FertilizerRecommendation;
      if (rec && typeof rec === 'object' && rec.crop) map.set(row.farm_id, rec);
    }
    return map;
  }, [sessions]);

  // ── Build entries ──
  const allEntries: FarmEntry[] = React.useMemo(
    () => farms.map(f => ({ farm: f, rec: recByFarmId.get(f.farm_id || f.id) ?? null })),
    [farms, recByFarmId]
  );

  // ── Unique crops for filter ──
  const cropOptions = React.useMemo(() => {
    const s = new Set<string>();
    for (const { rec } of allEntries) if (rec?.crop) s.add(rec.crop);
    return [...s].sort();
  }, [allEntries]);

  // ── Filtered list ──
  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return allEntries.filter(({ farm, rec }) => {
      const name = (farm.farm_name || farm.name || '').toLowerCase();
      const loc = (farm.farm_location || '').toLowerCase();
      const crop = rec?.crop?.toLowerCase() || '';
      if (q && !name.includes(q) && !loc.includes(q) && !crop.includes(q)) return false;
      if (cropFilter && rec?.crop !== cropFilter) return false;
      return true;
    });
  }, [allEntries, search, cropFilter]);

  // ── Sort: farms with recs first ──
  const sorted = React.useMemo(
    () => [...filtered].sort((a, b) => (b.rec ? 1 : 0) - (a.rec ? 1 : 0)),
    [filtered]
  );

  const selectedEntry = sorted.find(e => (e.farm.farm_id || e.farm.id) === selectedId) ?? null;
  const withRec = sorted.filter(e => e.rec).length;
  const total = sorted.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f0ede4', overflow: 'hidden' }}>

      {/* ── Top header bar ── */}
      <div style={{
        flexShrink: 0,
        padding: '20px 28px 16px',
        background: '#f0ede4',
        borderBottom: '1.5px solid #e0d9cc',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1e2a1e', margin: '0 0 2px', letterSpacing: '-0.4px' }}>
            Fertilizer Management
          </h1>
          <p style={{ fontSize: 12, color: '#8a9880', margin: 0 }}>
            AI-generated recommendations from the latest farming sessions
            {!loading && (
              <span style={{ marginLeft: 6, color: '#3a5a40', fontWeight: 600 }}>
                · {withRec} of {total} farms have recommendations
              </span>
            )}
          </p>
        </div>
        <button onClick={onAddFarmer} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px',
          borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          background: '#3a5a40', color: '#fff', border: 'none',
          boxShadow: '0 2px 8px rgba(58,90,64,0.25)',
        }}>
          <Plus size={14} /> Add Farmer
        </button>
      </div>

      {/* ── Body: split panel ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: List panel ── */}
        <div style={{
          width: 300, minWidth: 260, maxWidth: 340, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          background: '#f8f6f0', borderRight: '1.5px solid #e0d9cc',
        }}>

          {/* Search + filter */}
          <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #e8e3d8', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} color="#8a9880" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search farms…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8,
                  border: '1.5px solid #e0d9cc', background: '#fff', fontSize: 12,
                  color: '#2e3a28', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                  <X size={12} color="#8a9880" />
                </button>
              )}
            </div>
            {cropOptions.length > 0 && (
              <div style={{ position: 'relative' }}>
                <SlidersHorizontal size={12} color="#8a9880" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <select
                  value={cropFilter}
                  onChange={e => setCropFilter(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 10px 7px 28px', borderRadius: 8,
                    border: '1.5px solid #e0d9cc', background: '#fff', fontSize: 12,
                    color: cropFilter ? '#2e3a28' : '#8a9880', outline: 'none',
                    cursor: 'pointer', appearance: 'none', boxSizing: 'border-box',
                  }}
                >
                  <option value="">All crops</option>
                  {cropOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Farm list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '40px 0', color: '#8a9880' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 12 }}>Loading…</span>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : error ? (
              <div style={{ padding: 12, fontSize: 12, color: '#b91c1c', background: '#fff5f5', borderRadius: 8 }}>⚠️ {error}</div>
            ) : sorted.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, color: '#8a9880' }}>
                {search || cropFilter ? 'No farms match your filters.' : 'No farms registered yet.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sorted.map(entry => {
                  const id = entry.farm.farm_id || entry.farm.id;
                  return (
                    <FarmListItem
                      key={id}
                      entry={entry}
                      isSelected={id === selectedId}
                      onClick={() => setSelectedId(prev => prev === id ? null : id)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer count */}
          {!loading && !error && sorted.length > 0 && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid #e8e3d8', fontSize: 11, color: '#8a9880', textAlign: 'center' }}>
              {sorted.length} farm{sorted.length !== 1 ? 's' : ''}
              {(search || cropFilter) && ` filtered`}
            </div>
          )}
        </div>

        {/* ── RIGHT: Detail panel ── */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#fff' }}>
          {selectedEntry ? <DetailPanel entry={selectedEntry} /> : <EmptySelection />}
        </div>
      </div>
    </div>
  );
};
