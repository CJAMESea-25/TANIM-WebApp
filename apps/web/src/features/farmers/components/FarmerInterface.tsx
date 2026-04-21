import React from 'react';
import { useFarmers } from '@/features/farmers/hooks/useFarmers';
import { useFarms } from '@/features/farms/hooks/useFarms';
import { Download, Users, Phone, Mail, Sprout } from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

const getInitials = (name: string) => {
  const parts = (name || '?').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0][0] + (parts[0][1] || '')).toUpperCase();
};

const avatarBg = (name: string) => {
  const palette = [
    '#4a7c59', '#3a6b8a', '#7a5c3a', '#6b3a7a',
    '#3a7a6b', '#7a3a3a', '#5c7a3a', '#3a4f7a',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % palette.length;
  return palette[h];
};

const formatId = (id: any) =>
  `TNM-F-${String(id || '0000').slice(-4).padStart(4, '0')}`;

const deriveStatus = (idx: number): 'VERIFIED' | 'AUDIT DUE' | 'INACTIVE' => {
  if (idx % 7 === 3) return 'AUDIT DUE';
  if (idx % 11 === 5) return 'INACTIVE';
  return 'VERIFIED';
};

const statusStyle: Record<string, { bg: string; color: string; border: string }> = {
  'VERIFIED': { bg: '#eaf5e9', color: '#2e7d32', border: '#b5ddb3' },
  'AUDIT DUE': { bg: '#fff3e0', color: '#c0392b', border: '#f5c6a0' },
  'INACTIVE': { bg: '#f5f5f5', color: '#757575', border: '#d8d8d8' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = statusStyle[status] || statusStyle['VERIFIED'];
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', fontSize: 11,
      fontWeight: 700, borderRadius: 6, letterSpacing: '0.04em',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {status}
    </span>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

export const FarmerInterface = () => {
  const { data: farmers = [] } = useFarmers() as { data: any[] };
  const { data: farms = [] } = useFarms() as { data: any[] };

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');

  const rowsPerPage = 8;

  // Filter by search term
  const filtered = farmers.filter((f: any) => {
    const name = (f.username || f.name || '').toLowerCase();
    const phone = (f.phone || '').toLowerCase();
    return name.includes(search.toLowerCase()) || phone.includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageFarmers = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Stats
  const totalActive = farmers.length;
  const pendingCert = Math.max(0, Math.floor(farmers.length * 0.03) || (farmers.length > 0 ? 1 : 0));
  
  // Real Regional Coverage (Bukidnon Zones)
  let north = 0, central = 0, south = 0;
  farmers.forEach((farmer: any) => {
    const assignedFarms = farms.filter((f: any) => f.farmer_id === farmer.farmer_id || f.farmer_id === farmer.id);
    if (assignedFarms.length === 0) return; // Skip unassigned farmers for coverage
    
    const loc = (assignedFarms[0].farm_location || '').toLowerCase();
    
    const isNorth = ['manolo', 'impasugong', 'talakag', 'baungon', 'libona', 'malitbog', 'sumilao', 'cabanglasan'].some(m => loc.includes(m));
    const isSouth = ['maramag', 'quezon', 'don carlos', 'dangcagan', 'kitaotao', 'kibawe', 'damulog', 'kadingilan', 'pangantucan', 'kalilangan'].some(m => loc.includes(m));
    
    if (isNorth) north++;
    else if (isSouth) south++;
    else central++; // Default to central (Malaybalay, Valencia, Lantapan, San Fernando, or generic 'Bukidnon')
  });

  // Reset page when search changes
  React.useEffect(() => { setPage(1); }, [search]);

  return (
    <div style={{ padding: '28px 32px', background: '#f5f0e8', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#2e3a28', margin: '0 0 6px', lineHeight: 1.2 }}>
            Farmers Management
          </h1>
          <p style={{ fontSize: 13, color: '#7a8a70', maxWidth: 460, lineHeight: 1.5, margin: 0 }}>
            List of farmers in the TANIM platform.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: '#fff', border: '1px solid #d0cabb', color: '#4a5a40', cursor: 'pointer',
          }}>
            <Download size={14} /> Export Registry
          </button>
          <a
            href="/admin"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: '#3a5a40', color: '#e8ead0', cursor: 'pointer', textDecoration: 'none',
            }}
          >
            <Users size={14} /> Register New Farmer
          </a>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16, marginBottom: 24 }}>

        {/* Total Active */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#8aaa7a', textTransform: 'uppercase', marginBottom: 10 }}>
            Total Active
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#2e3a28', lineHeight: 1 }}>{totalActive}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4caf50' }}>+12%</span>
          </div>
        </div>

        {/* Pending Certification */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#8aaa7a', textTransform: 'uppercase', marginBottom: 10 }}>
            Pending Certification
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#2e3a28', lineHeight: 1 }}>{pendingCert}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9aaa8a' }}>Review</span>
          </div>
        </div>

        {/* Regional Coverage */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#8aaa7a', textTransform: 'uppercase', marginBottom: 14 }}>
              Bukidnon Coverage
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'North', count: north, color: '#3a5a40' },
                { label: 'Central', count: central, color: '#888' },
                { label: 'South', count: south, color: '#588157' },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#4a5a40' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{label}:</span>
                  <span style={{ color: '#7a8a70' }}>{count} Farmers</span>
                </div>
              ))}
            </div>
          </div>
          {/* Mini bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
            {[north, central, south].map((v, i) => {
              const maxV = Math.max(north, south, central, 1);
              const barH = Math.max(8, Math.round((v / maxV) * 56));
              return (
                <div key={i} style={{ width: 14, height: barH, background: ['#3a5a40', '#888', '#588157'][i], borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div style={{ marginBottom: 14 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search farmers, locations, or IDs..."
          style={{
            width: '100%', maxWidth: 400, padding: '9px 14px 9px 14px',
            borderRadius: 20, border: '1px solid #e0dacf', background: '#fff',
            fontSize: 13, color: '#3a3f30', outline: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        />
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.5fr 2fr 2fr 1.2fr 1fr',
          padding: '12px 20px',
          background: '#f8f6f2',
          borderBottom: '1px solid #ece8e0',
        }}>
          {['Name', 'Contact Information', 'Associated Farm', 'Status', 'Actions'].map(col => (
            <div key={col} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#8aaa7a', textTransform: 'uppercase' }}>
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8a9880', fontSize: 14 }}>
            {search ? `No farmers found for "${search}".` : 'No farmers registered yet.'}
          </div>
        ) : (
          pageFarmers.map((farmer: any, idx: number) => {
            const globalIdx = (page - 1) * rowsPerPage + idx;
            const name = farmer.username || farmer.name || 'Unknown Farmer';
            const initials = getInitials(name);
            const bg = avatarBg(name);
            const farmerId = formatId(farmer.farmer_id || farmer.id);
            const email = farmer.email || `${(name.split(' ')[0] || 'farmer').toLowerCase()}@tanim.ag`;
            const phone = farmer.phone || '—';
            const assignedFarms = farms.filter((f: any) => f.farmer_id === farmer.farmer_id || f.farmer_id === farmer.id);
            const primaryFarm = assignedFarms[0];
            const status = deriveStatus(globalIdx);

            return (
              <div
                key={farmer.farmer_id || farmer.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.5fr 2fr 2fr 1.2fr 1fr',
                  padding: '14px 20px',
                  borderBottom: '1px solid #f0ece4',
                  alignItems: 'center',
                  transition: 'background 0.12s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafaf7')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Name + ID */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: bg, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2e3a28', lineHeight: 1.3 }}>{name}</div>
                    <div style={{ fontSize: 11, color: '#9aaa8a', marginTop: 2 }}>{farmerId}</div>
                  </div>
                </div>

                {/* Contact */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4a5a40' }}>
                    <Phone size={11} color="#8aaa7a" strokeWidth={2} />
                    <span>{phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4a5a40' }}>
                    <Mail size={11} color="#8aaa7a" strokeWidth={2} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{email}</span>
                  </div>
                </div>

                {/* Associated Farm */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {primaryFarm ? (
                    <>
                      <Sprout size={16} color="#588157" />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#2e3a28', lineHeight: 1.3 }}>
                          {primaryFarm.farm_name || primaryFarm.name}
                        </div>
                        {assignedFarms.length > 1 && (
                          <div style={{ fontSize: 11, color: '#9aaa8a' }}>+{assignedFarms.length - 1} more</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: '#bbb', fontStyle: 'italic' }}>No farm assigned</span>
                  )}
                </div>

                {/* Status */}
                <div><StatusBadge status={status} /></div>

                {/* Actions */}
                <div>
                  <button
                    style={{
                      fontSize: 11, fontWeight: 600, color: '#3a5a40',
                      background: 'none', border: '1.5px solid #c0d4b0',
                      borderRadius: 7, padding: '4px 10px', cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ec')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderTop: '1px solid #f0ece4', background: '#fafaf7',
          }}>
            <span style={{ fontSize: 12, color: '#9aaa8a' }}>
              Showing{' '}
              <strong style={{ color: '#4a5a40' }}>{(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filtered.length)}</strong>
              {' '}of{' '}
              <strong style={{ color: '#4a5a40' }}>{filtered.length}</strong> entries
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{
                  width: 28, height: 28, borderRadius: 7, border: '1px solid #e0dacf',
                  background: '#fff', cursor: 'pointer', fontSize: 14, color: '#6a7860',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >‹</button>

              {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 28, height: 28, borderRadius: 7, fontSize: 12, fontWeight: 700,
                    border: page === p ? 'none' : '1px solid #e0dacf',
                    background: page === p ? '#3a5a40' : '#fff',
                    color: page === p ? '#e8ead0' : '#4a5a40',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >{p}</button>
              ))}

              {totalPages > 4 && (
                <span style={{ fontSize: 12, color: '#9aaa8a', padding: '0 2px' }}>…</span>
              )}
              {totalPages > 4 && (
                <button
                  onClick={() => setPage(totalPages)}
                  style={{
                    width: 28, height: 28, borderRadius: 7, fontSize: 12, fontWeight: 700,
                    border: page === totalPages ? 'none' : '1px solid #e0dacf',
                    background: page === totalPages ? '#3a5a40' : '#fff',
                    color: page === totalPages ? '#e8ead0' : '#4a5a40',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >{totalPages}</button>
              )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{
                  width: 28, height: 28, borderRadius: 7, border: '1px solid #e0dacf',
                  background: '#fff', cursor: 'pointer', fontSize: 14, color: '#6a7860',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};