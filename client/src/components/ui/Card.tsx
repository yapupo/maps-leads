import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accent?: 'amber' | 'green' | 'cyan' | 'red' | 'none';
}

const ACCENT_MAP = {
  amber: 'border-l-accent',
  green: 'border-l-green',
  cyan:  'border-l-cyan',
  red:   'border-l-red',
  none:  '',
};

export function Card({ children, className, accent = 'none' }: CardProps) {
  return (
    <div className={cn(
      'bg-card border border-border rounded-md p-4',
      accent !== 'none' && ACCENT_MAP[accent],
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-extrabold text-xs uppercase tracking-widest text-muted">
      {children}
    </h3>
  );
}
