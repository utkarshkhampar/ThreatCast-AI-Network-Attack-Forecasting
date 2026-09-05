import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'danger' | 'warning' | 'none';
  title?: string;
  badge?: string;
  action?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = 'none',
  title,
  badge,
  action
}) => {
  const glowClasses = {
    cyan: 'border-cyan-500/30 shadow-[0_0_20px_-5px_rgba(0,240,255,0.15)]',
    danger: 'border-rose-500/30 shadow-[0_0_20px_-5px_rgba(255,0,85,0.2)]',
    warning: 'border-amber-500/30 shadow-[0_0_20px_-5px_rgba(255,184,0,0.15)]',
    none: 'border-slate-800/80'
  };

  return (
    <div className={`glass-panel rounded-xl border p-5 ${glowClasses[glow]} ${className}`}>
      {(title || badge || action) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            {title && <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-mono">{title}</h3>}
            {badge && (
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                {badge}
              </span>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
