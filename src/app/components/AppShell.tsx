import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from './Sidebar';

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div>
      <Sidebar user={{ name: session.name, email: session.email, role: session.role }} />
      <div className="main-content">
        <div style={{ padding: '2rem' }}>{children}</div>
      </div>
    </div>
  );
}
