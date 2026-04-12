import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: 'amber' | 'green' | 'cyan' | 'red' | 'none';
  icon?: React.ReactNode;
}

export function StatCard({ label, value, sub, accent = 'none', icon }: StatCardProps) {
  const textColor = {
    amber: 'text-accent',
    green: 'text-green',
    cyan:  'text-cyan',
    red:   'text-red',
    none:  'text-text',
  }[accent];

  return (
    <Card accent={accent} className="animate-fade-in">
      <div className="flex items-start justify-between mb-2">
        <p className="font-display font-extrabold text-xs uppercase tracking-widest text-muted">{label}</p>
        {icon && <span className={cn('opacity-60', textColor)}>{icon}</span>}
      </div>
      <p className={cn('stat-number', textColor)}>{value}</p>
      {sub && <p className="text-xs text-dim mt-1 font-mono">{sub}</p>}
    </Card>
  );
}
