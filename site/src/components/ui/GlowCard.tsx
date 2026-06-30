import type { ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlowCard({ children, className = '', hover = true }: GlowCardProps) {
  return (
    <div
      className={`
        bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl
        ${hover ? 'hover:border-green-400/30 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-0.5' : ''}
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}
