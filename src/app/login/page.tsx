'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 50%, #d1fae5 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 1rem' }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(37,99,235,.35)'
          }}>
            <span style={{ fontSize: 28 }}>📦</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>FMCL Inventory</h1>
          <p style={{ color: '#64748b', marginTop: '.375rem', fontSize: '.875rem' }}>
            Facility Management Control Layer
          </p>
        </div>

        <div className="card" style={{ borderRadius: 16, padding: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 1.5 + 'rem', color: '#1e293b' }}>
            Sign in to your account
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, color: '#374151', marginBottom: '.375rem' }}>
                Email Address
              </label>
              <input
                className="form-input"
                type="email" required placeholder="your@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '.8125rem', fontWeight: 600, color: '#374151', marginBottom: '.375rem' }}>
                Password
              </label>
              <input
                className="form-input"
                type="password" required placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '.75rem', marginBottom: '1rem', color: '#dc2626', fontSize: '.875rem' }}>
                {error}
              </div>
            )}
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '.75rem' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', background: '#f0f9ff', borderRadius: 8, padding: '1rem', fontSize: '.8rem', color: '#475569' }}>
            <strong>Demo credentials:</strong><br />
            Admin: admin@fmcl.com / Admin@123<br />
            Tech Manager: tech.manager@fmcl.com / Pass@123
          </div>
        </div>
      </div>
    </div>
  );
}
