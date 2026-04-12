import { ExternalLink, Phone, Mail } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { type Contact } from '../../lib/api';
import { formatPhone, formatDate, truncate, cn } from '../../lib/utils';

interface LeadsTableProps { contacts: Contact[] }

export function LeadsTable({ contacts }: LeadsTableProps) {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-dim text-4xl mb-3">◈</p>
        <p className="text-muted font-display font-extrabold uppercase tracking-widest text-sm">Nenhum lead encontrado</p>
        <p className="text-dim text-xs mt-1">Ajuste os filtros ou execute um scrape</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {['Negócio', 'Telefone', 'Email', 'Categoria', 'Rating', 'Status', 'Coletado'].map((h) => (
              <th key={h} className="text-left px-3 py-2 text-xs font-mono uppercase tracking-wider text-dim font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contacts.map((c, i) => (
            <tr
              key={c.id}
              className={cn(
                'border-b border-border/50 transition-colors hover:bg-elevated/50 group',
                i % 2 === 0 ? 'bg-transparent' : 'bg-card/30'
              )}
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-text font-medium">{truncate(c.businessName, 30)}</span>
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noreferrer"
                       className="text-dim hover:text-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                {c.address && <p className="text-dim text-xs mt-0.5">{truncate(c.address, 40)}</p>}
              </td>
              <td className="px-3 py-2.5">
                {c.phone
                  ? <span className="font-mono text-cyan text-xs flex items-center gap-1"><Phone size={11} />{formatPhone(c.phone)}</span>
                  : <span className="text-dim">—</span>
                }
              </td>
              <td className="px-3 py-2.5">
                {c.email
                  ? <span className="font-mono text-green text-xs flex items-center gap-1"><Mail size={11} />{truncate(c.email, 24)}</span>
                  : <span className="text-dim">—</span>
                }
              </td>
              <td className="px-3 py-2.5">
                {c.category
                  ? <Badge variant="cyan">{truncate(c.category, 20)}</Badge>
                  : <span className="text-dim">—</span>
                }
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-accent">
                {c.rating ?? '—'}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex gap-1">
                  {c.messageSentWhatsapp && <Badge variant="green">WA</Badge>}
                  {c.messageSentEmail    && <Badge variant="cyan">Mail</Badge>}
                  {!c.messageSentWhatsapp && !c.messageSentEmail && (
                    <Badge variant="dim">Novo</Badge>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5 text-xs font-mono text-dim">
                {formatDate(c.scrapedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
