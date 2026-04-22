import React from 'react';
import {
  ShieldCheck, Plus, Pencil, Trash2, X, Check,
  AlertTriangle, Crown, Lock, User, Eye, EyeOff,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdmins, createAdmin, updateAdmin, deleteAdmin,
} from '@/features/profile/services/adminService';

// ── The hardcoded super admin username ─────────────────────────────────────
// Only an account with this username can add / edit / delete other admins.
// Change this to match whatever username you created in Supabase.
const SUPER_ADMIN_USERNAME = 'superadmin@tanim.agri';

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ── Sub-components ──────────────────────────────────────────────────────────

const AdminAvatar = ({ username, size = 40 }: { username: string; size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: 'linear-gradient(135deg, #3a5a40, #6a8e5f)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    border: '2px solid rgba(255,255,255,0.3)',
    boxShadow: '0 2px 8px rgba(58,90,64,0.25)',
  }}>
    {(username || 'A').charAt(0).toUpperCase()}
  </div>
);

const PasswordInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '••••••••'}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '9px 36px 9px 12px', borderRadius: 8, fontSize: 13,
          border: '1.5px solid #d4e0c8', outline: 'none', background: '#fafaf8',
          color: '#2e3a28', fontFamily: 'inherit',
        }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: '#8a9880', padding: 0,
        }}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
};

// ── Add/Edit Modal ───────────────────────────────────────────────────────────
const AdminFormModal = ({
  mode, admin, onClose, onSave,
}: {
  mode: 'add' | 'edit';
  admin?: any;
  onClose: () => void;
  onSave: (data: { username: string; password: string }) => Promise<void>;
}) => {
  const [username, setUsername] = React.useState(admin?.username || '');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSave = async () => {
    if (!username.trim()) { setError('Username is required.'); return; }
    if (mode === 'add' && !password.trim()) { setError('Password is required.'); return; }
    if (password && password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    try {
      setBusy(true);
      setError('');
      await onSave({ username: username.trim(), password: password.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(30,42,30,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3a5a40, #4f6e45)',
          padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {mode === 'add' ? <Plus size={18} color="#fff" /> : <Pencil size={18} color="#fff" />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>
                {mode === 'add' ? 'Add New Admin' : 'Edit Admin Account'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                {mode === 'add' ? 'Create a new administrator account' : `Editing: ${admin?.username}`}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 8,
              padding: '10px 14px', fontSize: 12, color: '#b91c1c',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5a7a50', marginBottom: 6 }}>
              Username <span style={{ color: '#e53935' }}>*</span>
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. admin_juan"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 12px', borderRadius: 8, fontSize: 13,
                border: '1.5px solid #d4e0c8', outline: 'none', background: '#fafaf8',
                color: '#2e3a28', fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5a7a50', marginBottom: 6 }}>
              Password {mode === 'add' ? <span style={{ color: '#e53935' }}>*</span> : <span style={{ fontSize: 10, color: '#9aaa8a', fontWeight: 400 }}>(leave blank to keep current)</span>}
            </label>
            <PasswordInput value={password} onChange={setPassword} placeholder={mode === 'edit' ? '(unchanged)' : '••••••••'} />
          </div>

          <div style={{
            background: '#f8fbf4', border: '1px solid #d4e8c0', borderRadius: 8,
            padding: '10px 14px', fontSize: 11, color: '#5a7a50', lineHeight: 1.6,
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <Lock size={13} style={{ marginTop: 2, flexShrink: 0 }} />
            This admin account will have access to the TANIM Agricultural Framework dashboard. Assign credentials carefully.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 26px', borderTop: '1px solid #f0ede4',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          background: '#f8f5f0',
        }}>
          <button onClick={onClose} disabled={busy} style={{
            padding: '9px 20px', borderRadius: 8, border: '1.5px solid #d0cabb',
            background: '#fff', color: '#5a6a50', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={busy} style={{
            padding: '9px 22px', borderRadius: 8, border: 'none',
            background: busy ? '#8aaa7a' : '#3a5a40', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 2px 8px rgba(58,90,64,0.25)',
          }}>
            <Check size={14} /> {busy ? 'Saving...' : mode === 'add' ? 'Create Admin' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteConfirmModal = ({ admin, onClose, onConfirm }: { admin: any; onClose: () => void; onConfirm: () => Promise<void> }) => {
  const [busy, setBusy] = React.useState(false);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(30,42,30,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
        <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#fff5f5',
            border: '2px solid #fca5a5', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Trash2 size={22} color="#e53935" />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1e2a1e', marginBottom: 8 }}>Delete Admin Account?</div>
          <div style={{ fontSize: 13, color: '#6a7a60', lineHeight: 1.6 }}>
            This will permanently remove <strong style={{ color: '#2e3a28' }}>@{admin?.username}</strong> from the system. This action cannot be undone.
          </div>
        </div>
        <div style={{ padding: '12px 28px 24px', display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onClose} disabled={busy} style={{
            padding: '9px 24px', borderRadius: 8, border: '1.5px solid #d0cabb',
            background: '#fff', color: '#5a6a50', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={async () => { setBusy(true); await onConfirm(); onClose(); }} disabled={busy} style={{
            padding: '9px 24px', borderRadius: 8, border: 'none',
            background: '#e53935', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <Trash2 size={14} /> {busy ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main SuperAdminPage ──────────────────────────────────────────────────────
export interface SuperAdminPageProps {
  currentUsername: string; // logged-in admin's username
}

export const SuperAdminPage = ({ currentUsername }: SuperAdminPageProps) => {
  const isSuperAdmin = currentUsername === SUPER_ADMIN_USERNAME;
  const queryClient = useQueryClient();

  // Fetch all admins
  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: getAdmins,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: { username: string; password: string }) => createAdmin(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { username?: string; password?: string } }) => updateAdmin(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdmin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins'] }),
  });

  // Modal state
  const [showAdd, setShowAdd] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<any>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<any>(null);

  return (
    <div style={{ padding: '32px 36px', background: '#f0ede4', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div style={{ maxWidth: 540 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1e2a1e', margin: 0, lineHeight: 1.2, letterSpacing: '-0.5px' }}>
              Admin Management
            </h1>
            {isSuperAdmin && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'linear-gradient(135deg, #3a5a40, #4f6e45)',
                color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase',
              }}>
                <Crown size={10} /> Super Admin
              </span>
            )}
          </div>
          <p style={{ fontSize: 13.5, color: '#6a7a60', margin: 0, lineHeight: 1.6 }}>
            {isSuperAdmin
              ? 'Manage all administrator accounts. Only Super Admin can add, edit, or delete other admins.'
              : 'View registered administrator accounts. Contact Super Admin to make changes.'}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px',
              borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: '#3a5a40', color: '#fff', border: 'none', whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(58,90,64,0.25)',
            }}
          >
            <Plus size={14} /> Add New Admin
          </button>
        )}
      </div>

      {/* Super Admin badge card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a28, #2e4a38)',
        borderRadius: 16, padding: '20px 24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 18,
        boxShadow: '0 4px 20px rgba(30,42,30,0.25)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Crown size={22} color="#e8d080" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#e8ead0', marginBottom: 4 }}>
            Super Admin Account
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            Username: <strong style={{ color: '#b8d4a0' }}>@{SUPER_ADMIN_USERNAME}</strong> — This account is the only one that can manage other admins. It is a single, protected account.
            {isSuperAdmin && <span style={{ color: '#80c870', marginLeft: 6 }}>✓ You are logged in as Super Admin.</span>}
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px',
          fontSize: 11, fontWeight: 700, color: '#b8d4a0', letterSpacing: '0.04em', whiteSpace: 'nowrap',
        }}>
          PROTECTED
        </div>
      </div>

      {/* Admins table */}
      <div style={{
        background: '#fff', borderRadius: 16,
        border: '1.5px solid #e0ddd4', overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr',
          padding: '13px 24px', borderBottom: '1px solid #f0ede4',
          background: '#f8f5f0',
        }}>
          {['Admin Account', 'Username', 'Created', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#8a9880', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Body */}
        {isLoading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#8a9880', fontSize: 13 }}>
            Loading admin accounts...
          </div>
        ) : admins.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#8a9880', fontSize: 13 }}>
            <ShieldCheck size={32} color="#c4d8b0" style={{ marginBottom: 10, display: 'block', margin: '0 auto 12px' }} />
            No admin accounts found.
          </div>
        ) : (
          admins.map((admin: any, idx: number) => {
            const isSelf = admin.username === currentUsername;
            const isSuper = admin.username === SUPER_ADMIN_USERNAME;
            const canAct = isSuperAdmin && !isSuper; // super admin cannot delete/edit the super admin account

            return (
              <div
                key={admin.admin_id}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr',
                  padding: '16px 24px', alignItems: 'center',
                  borderBottom: idx < admins.length - 1 ? '1px solid #f5f0e8' : 'none',
                  background: isSelf ? 'rgba(58,90,64,0.04)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                {/* Account info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AdminAvatar username={admin.username} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e2a1e', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {admin.username}
                      {isSuper && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#fdf3c0', color: '#92700a', fontSize: 9,
                          fontWeight: 700, padding: '2px 6px', borderRadius: 10, letterSpacing: '0.04em',
                        }}>
                          <Crown size={9} /> SUPER
                        </span>
                      )}
                      {isSelf && !isSuper && (
                        <span style={{
                          background: '#e8f4e8', color: '#3a5a40', fontSize: 9,
                          fontWeight: 700, padding: '2px 7px', borderRadius: 10, letterSpacing: '0.04em',
                        }}>YOU</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#9aaa8a', marginTop: 1 }}>
                      {isSuper ? 'Super Administrator' : 'System Administrator'}
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div style={{ fontSize: 13, color: '#4a6a50', fontFamily: 'monospace' }}>
                  @{admin.username}
                </div>

                {/* Created date */}
                <div style={{ fontSize: 12, color: '#8a9880' }}>
                  {fmtDate(admin.created_at)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {canAct ? (
                    <>
                      <button
                        onClick={() => setEditTarget(admin)}
                        title="Edit admin"
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: '1.5px solid #d4e8c0',
                          background: '#f4faf0', color: '#4a6a50', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(admin)}
                        title="Delete admin"
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: '1.5px solid #fca5a5',
                          background: '#fff5f5', color: '#e53935', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 11, color: '#b0a898', fontStyle: 'italic',
                    }}>
                      {isSuper ? <><Crown size={12} /> Protected</> : <><User size={12} /> Read-only</>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Permissions info box */}
      <div style={{
        marginTop: 20, background: '#f8fbf4', border: '1.5px solid #d4e8c0',
        borderRadius: 12, padding: '14px 20px',
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <Lock size={16} color="#5a7a50" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: '#5a7a50', lineHeight: 1.7 }}>
          <strong>Access Rules:</strong> Only the <strong>@{SUPER_ADMIN_USERNAME}</strong> account can add, edit, or delete admin users.
          The Super Admin account itself is protected and cannot be modified from this panel.
          Regular admin accounts can view this list but cannot make changes.
        </div>
      </div>

      {/* ── Modals ── */}
      {showAdd && (
        <AdminFormModal
          mode="add"
          onClose={() => setShowAdd(false)}
          onSave={async ({ username, password }) => {
            await createMutation.mutateAsync({ username, password });
          }}
        />
      )}

      {editTarget && (
        <AdminFormModal
          mode="edit"
          admin={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={async ({ username, password }) => {
            const updates: any = {};
            if (username) updates.username = username;
            if (password) updates.password = password;
            await updateMutation.mutateAsync({ id: editTarget.admin_id, data: updates });
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          admin={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteMutation.mutateAsync(deleteTarget.admin_id);
          }}
        />
      )}
    </div>
  );
};

export default SuperAdminPage;
