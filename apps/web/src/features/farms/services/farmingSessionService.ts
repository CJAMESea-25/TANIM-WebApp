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

/** Prefer DB `cycle_start_date` (editable in admin), then session times. */
export function sessionDisplayStartIso(row: FarmingSessionRow): string | undefined {
  if (row.cycle_start_date) return row.cycle_start_date;
  return row.started_at || row.created_at;
}

/**
 * Show a date string without UTC/local shifting bugs on `YYYY-MM-DD` (Postgres `date` / cycle fields).
 * Parses the leading Y-M-D as a **calendar** day in the local browser, not midnight UTC.
 */
export function formatCalendarDateForDisplay(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '—';
  const s = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return '—';
    return new Date(y, mo, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const t = new Date(s);
  if (Number.isNaN(t.getTime())) return '—';
  return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

/** Columns omitted from admin CSV export (session row ids and farm/farmer FKs). */
const FARMING_SESSION_ID_COLUMNS = new Set([
  'id',
  'farming_session_id',
  'farm_farming_session_id',
  'farm_id',
  'farmer_id',
]);

const FARMING_SESSION_PAGE_SIZE = 1000;

/** Full table via paged GETs (PostgREST often caps rows per request). */
export async function fetchAllFarmingSessionsRaw(): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += FARMING_SESSION_PAGE_SIZE) {
    const q = `/farming_session?select=*&order=created_at.desc&limit=${FARMING_SESSION_PAGE_SIZE}&offset=${offset}`;
    const rows = await apiGet<Record<string, unknown>[]>(q);
    const batch = Array.isArray(rows) ? rows : [];
    all.push(...batch);
    if (batch.length < FARMING_SESSION_PAGE_SIZE) break;
  }
  return all;
}

function escapeCsvCell(val: unknown): string {
  if (val == null) return '';
  const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Build CSV for all rows; columns = union of non-id keys across rows, sorted for stable headers. */
export function farmingSessionsRowsToCsv(rows: Record<string, unknown>[]): string {
  const keySet = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!FARMING_SESSION_ID_COLUMNS.has(k)) keySet.add(k);
    }
  }
  const headers = [...keySet].sort();
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(',')),
  ];
  return lines.join('\n');
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
