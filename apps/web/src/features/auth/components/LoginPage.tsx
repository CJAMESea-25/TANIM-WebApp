import React, { useState } from 'react';
import { loginAdmin } from '../services/auth.service';
import { useGlobalAuth } from '../hooks/useGlobalAuth';
import { toast } from 'sonner';

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#DAD7CD',
  card: '#ffffff',
  cardTop: '#344E41',
  secondary: '#A3B18A',
  primary: '#588157',
  dark: '#3A5A40',
  sidebar: '#344E41',
  inputBg: '#F0EDE6',
  border: '#C8C4BB',
  text: '#2C3E2D',
  muted: '#6B7C6B',
  label: '#4a5568',
};

// ─── Tractor SVG icon (matches the image) 
const TractorIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11v-1a4 4 0 0 1 4-4h1l2-3h5v3h2a2 2 0 0 1 2 2v3" />
    <circle cx="7" cy="15" r="3" />
    <circle cx="17" cy="15" r="2" />
    <path d="M10 15h4" />
  </svg>
);

// ─── Eye icons 
const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ─── EmailIcon & LockIcon 
const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useGlobalAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginAdmin({ username, password });
      if (response.status === 'success' && response.data) {
        const adminData = response.data;
        login({
          id: adminData.id || adminData.admin_id || 1,
          username: adminData.username || username,
          role: 'admin',
        });
        toast.success('Successfully logged in as Admin');
        return;
      }
      throw new Error('Invalid username or password. Please check your credentials.');
    } catch (error: any) {
      console.error('Auth error details:', error);
      toast.error(error.message || 'An error occurred during authentication.', { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: C.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>

      {/* ── Logo + Brand ── */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: '50%',
          backgroundColor: C.sidebar,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          boxShadow: `0 4px 16px ${C.dark}44`,
        }}>
          <TractorIcon size={36} />
        </div>
        <h1 style={{
          fontSize: '26px',
          fontWeight: 800,
          letterSpacing: '0.18em',
          color: C.sidebar,
          margin: 0,
        }}>TANIM</h1>
      </div>

      {/* ── Card ── */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: C.card,
        borderRadius: '20px',
        boxShadow: '0 8px 40px rgba(52, 78, 65, 0.14)',
        overflow: 'hidden',
      }}>
        {/* Card top accent bar */}
        <div style={{ height: '6px', backgroundColor: C.sidebar }} />

        <div style={{ padding: '32px 36px 36px' }}>
          {/* Heading */}
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
            Admin Access
          </h2>
          <p style={{ fontSize: '13.5px', color: C.muted, margin: '0 0 28px' }}>
            Enter your credentials to manage agricultural intelligence.
          </p>

          <form onSubmit={handleAuth}>

            {/* Email / Username */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: C.label, textTransform: 'uppercase', marginBottom: '7px' }}>
                Email
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '13px', color: C.muted, display: 'flex' }}>
                  <EmailIcon />
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="admin@tanim.agri"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    backgroundColor: C.inputBg,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: C.text,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: C.label, textTransform: 'uppercase' }}>
                  Password
                </label>
                <button type="button" style={{ fontSize: '12px', color: C.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '13px', color: C.muted, display: 'flex' }}>
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 44px 11px 40px',
                    backgroundColor: C.inputBg,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: C.text,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '13px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: C.muted, display: 'flex', padding: 0,
                  }}
                >
                  {showPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', cursor: 'pointer' }}>
              <div
                onClick={() => setRememberMe(!rememberMe)}
                style={{
                  width: '38px', height: '22px',
                  borderRadius: '11px',
                  backgroundColor: rememberMe ? C.primary : C.border,
                  position: 'relative',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: rememberMe ? '19px' : '3px',
                  width: '16px', height: '16px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize: '13.5px', color: C.muted, userSelect: 'none' }}>Remember this device</span>
            </label>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: loading ? C.dark : C.sidebar,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s, transform 0.1s',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.backgroundColor = C.dark); }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.backgroundColor = C.sidebar); }}
              onMouseDown={(e) => { if (!loading) (e.currentTarget.style.transform = 'scale(0.98)'); }}
              onMouseUp={(e) => { (e.currentTarget.style.transform = 'scale(1)'); }}
            >
              {loading ? 'Signing in…' : (
                <>
                  Login
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p style={{
            textAlign: 'center',
            fontSize: '11px',
            letterSpacing: '0.08em',
            color: C.muted,
            textTransform: 'uppercase',
            marginTop: '28px',
            marginBottom: '4px',
          }}>
            Authorized Admin and Super Admin Access Only.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
            {[C.primary, C.secondary, C.border].map((color, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};