export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Admin',
    tech_manager: 'Tech Manager',
    senior_manager: 'Senior Manager',
    finance_manager: 'Finance Manager',
    managing_director: 'Managing Director',
    staff: 'Staff',
  };
  return labels[role] ?? role;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function calcTenureDays(joinDate: string, leaveDate?: string | null): number {
  const start = new Date(joinDate);
  const end = leaveDate ? new Date(leaveDate) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function calcDeductionAmount(unitCost: number, tenureDays: number, yearlyDays = 365): number {
  if (tenureDays <= 1) return unitCost; // OJT next day = full recovery
  if (tenureDays <= 7) return unitCost; // left within a week = full recovery
  const ratio = Math.max(0, 1 - tenureDays / yearlyDays);
  return Math.round(unitCost * ratio * 100) / 100;
}

export function statusBadge(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    left: 'bg-gray-100 text-gray-600',
    terminated: 'bg-red-100 text-red-700',
    issued: 'bg-blue-100 text-blue-700',
    returned: 'bg-gray-100 text-gray-600',
    deducted: 'bg-orange-100 text-orange-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    ordered: 'bg-blue-100 text-blue-700',
    received: 'bg-emerald-100 text-emerald-700',
    draft: 'bg-gray-100 text-gray-600',
    processed: 'bg-emerald-100 text-emerald-700',
    waived: 'bg-purple-100 text-purple-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}
