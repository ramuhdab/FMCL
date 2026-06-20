'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { roleLabel } from '@/lib/utils';

const NAV = [
  { href: '/dashboard',   icon: '📊', label: 'Dashboard' },
  { href: '/employees',   icon: '👷', label: 'Employees' },
  { href: '/inventory',   icon: '📦', label: 'Inventory' },
  { href: '/allocations', icon: '🔄', label: 'Allocations' },
  { href: '/procurement', icon: '🛒', label: 'Procurement' },
  { href: '/approvals',   icon: '✅', label: 'Approvals' },
  { href: '/deductions',  icon: '💰', label: 'Deductions' },
  { href: '/vendors',     icon: '🏭', label: 'Vendors' },
  { href: '/admin',       icon: '⚙️', label: 'Admin', adminOnly: true },
];

interface Props {
  user: { name: string; email: string; role: string };
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="sidebar">
      {/* Brand */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>📦</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '.9375rem', lineHeight: 1.2 }}>FMCL</div>
            <div style={{ color: '#64748b', fontSize: '.6875rem' }}>Inventory System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: '.5rem', overflowY: 'auto' }}>
        {NAV.filter(n => !n.adminOnly || user.role === 'admin').map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={`nav-item ${pathname.startsWith(n.href) ? 'active' : ''}`}
          >
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: '.75rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '.875rem', flexShrink: 0,
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ color: '#64748b', fontSize: '.6875rem' }}>{roleLabel(user.role)}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 8, padding: '.5rem', color: '#94a3b8', fontSize: '.8125rem',
            cursor: 'pointer', transition: 'all .15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,.15)')}
          onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,.08)')}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
