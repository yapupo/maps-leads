import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-mono text-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(
          'bg-elevated border border-border rounded px-3 py-2 text-sm text-text',
          'placeholder:text-dim focus:outline-none focus:border-accent/60 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      />
      {hint && <p className="text-xs text-dim">{hint}</p>}
    </div>
  );
}
