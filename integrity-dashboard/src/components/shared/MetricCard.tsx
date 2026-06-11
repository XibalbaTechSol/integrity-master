import type { ReactNode } from 'react';

interface MetricCardProps {
  label: ReactNode;
  value: ReactNode;
  subValue?: ReactNode;
  accentColor?: string;
  progress?: number;
  isLoading?: boolean;
}

export function MetricCard({ 
  label, 
  value, 
  subValue, 
  accentColor = 'var(--primary)', 
  progress, 
  isLoading 
}: MetricCardProps) {
  return (
    <div className="panel" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      
      {isLoading ? (
        <div className="skeleton" style={{ height: '32px', width: '60%', marginBottom: 'var(--space-1)' }} />
      ) : (
        <div className="mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
          {value}
        </div>
      )}
      
      {subValue && !isLoading && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
          {subValue}
        </div>
      )}
      
      {progress !== undefined && (
        <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${Math.max(0, Math.min(100, progress))}%`, 
              background: accentColor,
              boxShadow: `0 0 10px ${accentColor}`,
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }} 
          />
        </div>
      )}
    </div>
  );
}
