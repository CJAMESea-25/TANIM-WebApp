/**
 * `farming_session` rows via Supabase PostgREST (same client as farms / soil).
 */

import { apiGet } from '@/shared/services/apiClient';

export interface FarmingSessionRow {
  farm_id: string;
  farmer_id: string;
  selected_crop?: string;
  selected_crops?: string;
  soil_snapshot?: Record<string, unknown> | null;
  fertilizer_recommendation?: unknown;
  top_crop_probabilities?: unknown;
  cycle_start_date?: string | null;
  created_at?: string;
  started_at?: string;
  ended_at?: string | null;
}

function parseJsonField<T>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === 'object') return v as T;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }
  return null;
}

/** Normalize a PostgREST row to the shape used by the farm detail UI. */
export function normalizeFarmingSessionRow(raw: Record<string, unknown>): FarmingSessionRow {
  const created = raw.created_at != null ? String(raw.created_at) : undefined;
  const startedRaw = raw.started_at != null ? String(raw.started_at) : created;
  return {
    farm_id: String(raw.farm_id ?? ''),
    farmer_id: String(raw.farmer_id ?? ''),
    selected_crop: typeof raw.selected_crop === 'string' ? raw.selected_crop : undefined,
    selected_crops: typeof raw.selected_crops === 'string' ? raw.selected_crops : undefined,
    soil_snapshot: parseJsonField<Record<string, unknown>>(raw.soil_snapshot) ?? undefined,
    fertilizer_recommendation: parseJsonField(raw.fertilizer_recommendation) ?? raw.fertilizer_recommendation,
    top_crop_probabilities: parseJsonField(raw.top_crop_probabilities) ?? raw.top_crop_probabilities,
    cycle_start_date:
      raw.cycle_start_date == null
        ? null
        : typeof raw.cycle_start_date === 'string'
          ? raw.cycle_start_date
          : String(raw.cycle_start_date),
    created_at: created,
    started_at: startedRaw,
    ended_at:
      raw.ended_at == null || raw.ended_at === ''
        ? null
        : typeof raw.ended_at === 'string'
          ? raw.ended_at
          : String(raw.ended_at),
  };
}

export function sessionCropLabel(row: FarmingSessionRow): string {
  const c = row.selected_crop ?? row.selected_crops;
  return typeof c === 'string' && c.trim() ? c.trim() : '—';
}

export function soilScalarsFromSnapshot(snap: unknown): {
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  ph: number | null;
  moisture: number | null;
  temperature: number | null;
  salinity: number | null;
  received_at?: string | null;
} | null {
  if (!snap || typeof snap !== 'object') return null;
  const o = snap as Record<string, unknown>;
  const num = (k: string): number | null => {
    const v = o[k];
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    nitrogen: num('nitrogen'),
    phosphorus: num('phosphorus'),
    potassium: num('potassium'),
    ph: num('ph'),
    moisture: num('moisture'),
    temperature: num('temperature'),
    salinity: num('salinity'),
    received_at: typeof o.received_at === 'string' ? o.received_at : null,
  };
}

/**
 * Debug: load every row from `farming_session` (no farm filter) and log the raw PostgREST payload.
 * Called when the farm detail modal opens in `FarmsTab`. Remove when you are done inspecting data.
 */
export async function debugLogAllFarmingSessions(): Promise<void> {
  const q = '/farming_session?select=*&order=created_at.desc';
  const rows = await apiGet<Record<string, unknown>[]>(q);
  console.log('[farming_session] full table (raw API):', rows);
}

/**
 * Load all farming sessions for a farm (newest first). Active row = `ended_at` is null.
 */
export async function fetchFarmingSessionsForFarm(farmId: string): Promise<{
  history: FarmingSessionRow[];
  active: FarmingSessionRow | null;
}> {
  const q = `/farming_session?farm_id=eq.${encodeURIComponent(farmId)}&select=*&order=created_at.desc`;
  const rows = await apiGet<Record<string, unknown>[]>(q);
  const list = (Array.isArray(rows) ? rows : []).map((r) => normalizeFarmingSessionRow(r));
  const active = list.find((r) => r.ended_at == null) ?? null;
  return { history: list, active };
}
