import type { ReactNode } from 'react';

interface StatBadgeProps {
  value: string;
  label: string;
  icon?: ReactNode;
  color?: 'green' | 'amber';
}

export function StatBadge({ value, label, icon, color = 'green' }: StatBadgeProps) {
  const colorClass = color === 'green' ? 'text-green-400' : 'text-amber-400';
  const glowClass = color === 'green' ? 'shadow-green-500/10' : 'shadow-amber-500/10';

  return (
    <div className={`flex items-center gap-3 bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 ${glowClass} shadow-sm`}>
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}
