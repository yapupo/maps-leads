import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'amber' | 'cyan' | 'dim';
}

const VARS = {
  green: 'bg-green/10 text-green border-green/20',
  red:   'bg-red/10 text-red border-red/20',
  amber: 'bg-accent/10 text-accent border-accent/20',
  cyan:  'bg-cyan/10 text-cyan border-cyan/20',
  dim:   'bg-elevated text-dim border-border',
};

export function Badge({ children, variant = 'dim' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono border',
      VARS[variant]
    )}>
      {children}
    </span>
  );
}
