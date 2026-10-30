import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  color?: 'ketrika' | 'accent' | 'green' | 'amber' | 'purple' | 'red';
}

const colorClasses = {
  ketrika: 'bg-ketrika-50 text-ketrika-700',
  accent: 'bg-accent-50 text-accent-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  purple: 'bg-purple-50 text-purple-700',
  red: 'bg-red-50 text-red-700',
};

export function StatCard({ label, value, icon, color = 'ketrika' }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
