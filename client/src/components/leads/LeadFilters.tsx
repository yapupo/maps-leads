import { Search, Phone, Mail, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LeadFiltersState {
  search: string;
  hasPhone: boolean | null;
  hasEmail: boolean | null;
  sentWA: boolean | null;
}

interface LeadFiltersProps {
  filters: LeadFiltersState;
  onChange: (f: LeadFiltersState) => void;
  total: number;
  filtered: number;
}

function ToggleChip({
  active, onClick, children
}: { active: boolean | null; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-colors',
        active === true  && 'bg-green/10 text-green border-green/30',
        active === false && 'bg-red/10 text-red border-red/30',
        active === null  && 'text-muted border-border hover:border-border-bright hover:text-text',
      )}
    >
      {children}
    </button>
  );
}

export function LeadFilters({ filters, onChange, total, filtered }: LeadFiltersProps) {
  const cycle = (val: boolean | null): boolean | null =>
    val === null ? true : val === true ? false : null;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex-1 min-w-[200px] max-w-[320px]">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Buscar por nome, telefone, email…"
            className={cn(
              'w-full bg-elevated border border-border rounded pl-8 pr-3 py-1.5 text-sm text-text',
              'placeholder:text-dim focus:outline-none focus:border-accent/60 transition-colors'
            )}
          />
        </div>
      </div>

      <ToggleChip active={filters.hasPhone} onClick={() => onChange({ ...filters, hasPhone: cycle(filters.hasPhone) })}>
        <Phone size={11} /> Telefone
      </ToggleChip>
      <ToggleChip active={filters.hasEmail} onClick={() => onChange({ ...filters, hasEmail: cycle(filters.hasEmail) })}>
        <Mail size={11} /> Email
      </ToggleChip>
      <ToggleChip active={filters.sentWA} onClick={() => onChange({ ...filters, sentWA: cycle(filters.sentWA) })}>
        <MessageCircle size={11} /> Enviado WA
      </ToggleChip>

      <span className="text-xs text-dim font-mono ml-auto">
        {filtered} / {total} leads
      </span>
    </div>
  );
}
