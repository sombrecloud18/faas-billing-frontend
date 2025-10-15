// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { saveAuth } from '../utils/auth';

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const DEMO = (import.meta.env.VITE_DEMO_AUTH ?? 'false') === 'true';

  async function doLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { token, role } = await api.login(email, password);
      saveAuth(token, role);
      nav(role === 'admin' ? '/admin' : '/client', { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function quick(role: 'admin' | 'client') {
    if (role === 'admin') {
      setEmail('admin@demo.io');
      setPassword('admin123');
    } else {
      setEmail('client@demo.io');
      setPassword('client123');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>FaaS Billing</div>
          <div style={{ opacity: 0.7, marginTop: 4 }}>Войти в аккаунт</div>
        </div>

        <div style={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 20,
          background: 'rgba(255,255,255,0.03)'
        }}>
          {DEMO && (
            <div style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 8,
              background: 'rgba(102, 187, 106, 0.1)',
              border: '1px solid rgba(102, 187, 106, 0.25)',
              fontSize: 13
            }}>
              Быстрый вход: admin@demo.io / admin123, client@demo.io / client123
            </div>
          )}

          <form onSubmit={doLogin} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, opacity: 0.8 }}>Email</label>
              <input
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, opacity: 0.8 }}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <input
                  placeholder="••••••••"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 84 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={ghostBtn}
                >
                  {showPwd ? 'Спрятать' : 'Показать'}
                </button>
              </div>
            </div>

            <button disabled={loading} type="submit" style={primaryBtn}>
              {loading ? 'авторизация' : 'Войти'}
            </button>

            {DEMO && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => quick('admin')} style={secondaryBtn}>
                  Заполнить данные админа
                </button>
                <button type="button" onClick={() => quick('client')} style={secondaryBtn}>
                  Заполнить данные клиента
                </button>
                <button type="button" onClick={() => doLogin()} style={accentBtn} disabled={loading}>
                  Быстрый вход
                </button>
              </div>
            )}

            {err && (
              <div style={{
                color: '#ff6b6b',
                fontSize: 13,
                border: '1px solid rgba(255,107,107,0.35)',
                background: 'rgba(255,107,107,0.08)',
                padding: 10,
                borderRadius: 8
              }}>
                {err}
              </div>
            )}
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12, opacity: 0.6, fontSize: 12 }}>
          © {new Date().getFullYear()} FaaS Billing
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(0,0,0,0.2)',
  outline: 'none'
};

const primaryBtn: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(110,168,254,0.5)',
  background: 'linear-gradient(180deg, rgba(110,168,254,0.25), rgba(110,168,254,0.15))',
  color: '#e8f0fe',
  fontWeight: 700,
  cursor: 'pointer'
};

const secondaryBtn: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.06)',
  color: 'inherit',
  flex: 1,
  cursor: 'pointer'
};

const accentBtn: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(102,187,106,0.45)',
  background: 'rgba(102,187,106,0.15)',
  color: 'inherit',
  whiteSpace: 'nowrap',
  cursor: 'pointer'
};

const ghostBtn: React.CSSProperties = {
  position: 'absolute',
  right: 6,
  top: 6,
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.06)',
  color: 'inherit',
  cursor: 'pointer'
};