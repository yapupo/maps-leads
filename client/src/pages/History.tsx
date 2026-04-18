import { useState } from 'react';
import { ChevronDown, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import { useHistory, useSessionContacts } from '../hooks';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { formatDate, formatPhone } from '../lib/utils';
import type { ScrapeSession } from '../lib/api';

function StatusBadge({ status }: { status: ScrapeSession['status'] }) {
  const variant =
    status === 'done' ? 'green' : status === 'error' ? 'red' : 'amber';
  const label =
    status === 'done' ? 'Concluído' : status === 'error' ? 'Erro' : 'Executando';
  return <Badge variant={variant}>{label}</Badge>;
}

function SessionRow({
  session,
  isSelected,
  onToggle,
}: {
  session: ScrapeSession;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const { data: contacts, isLoading } = useSessionContacts(isSelected ? session.id : null);

  return (
    <>
      <tr
        className="border-b border-border hover:bg-elevated/50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-3 pr-3">
          {isSelected ? (
            <ChevronDown size={14} className="text-accent" />
          ) : (
            <ChevronRight size={14} className="text-dim" />
          )}
        </td>
        <td className="py-3 pr-4">
          <span className="text-sm text-text font-medium">{session.query}</span>
        </td>
        <td className="py-3 pr-4">
          <span className="text-xs text-muted font-mono">{session.location ?? '—'}</span>
        </td>
        <td className="py-3 pr-4">
          <span className="text-xs text-muted font-mono whitespace-nowrap">
            {formatDate(session.startedAt)}
          </span>
        </td>
        <td className="py-3 pr-4">
          <StatusBadge status={session.status} />
        </td>
        <td className="py-3 text-right">
          <span className="text-xs font-mono text-cyan">{session.found}</span>
        </td>
      </tr>

      {isSelected && (
        <tr className="border-b border-border/50">
          <td colSpan={6} className="px-0 py-0">
            <div className="bg-base border-t border-border/50 px-4 py-4 animate-fade-in">
              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted py-2">
                  <Spinner className="w-4 h-4" />
                  <span>Carregando contatos…</span>
                </div>
              ) : !contacts || contacts.length === 0 ? (
                <p className="text-xs text-dim font-mono py-2">Nenhum contato nesta sessão.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left border-b border-border">
                        <th className="pb-2 pr-4 font-mono text-muted uppercase tracking-wider font-normal">
                          Nome
                        </th>
                        <th className="pb-2 pr-4 font-mono text-muted uppercase tracking-wider font-normal">
                          Telefone
                        </th>
                        <th className="pb-2 font-mono text-muted uppercase tracking-wider font-normal">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-border/30 hover:bg-elevated/30 transition-colors"
                        >
                          <td className="py-2 pr-4 text-text font-mono max-w-[200px] truncate">
                            {c.businessName}
                          </td>
                          <td className="py-2 pr-4">
                            {c.phone ? (
                              <span className="flex items-center gap-1 text-cyan font-mono">
                                <Phone size={10} />
                                {formatPhone(c.phone)}
                              </span>
                            ) : (
                              <span className="text-dim">—</span>
                            )}
                          </td>
                          <td className="py-2">
                            {c.email ? (
                              <span className="flex items-center gap-1 text-green font-mono">
                                <Mail size={10} />
                                {c.email}
                              </span>
                            ) : (
                              <span className="text-dim">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function History() {
  const { data: sessions, isLoading } = useHistory();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggle = (id: string) => setSelectedId((prev) => (prev === id ? null : id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner />
      </div>
    );
  }

  const list = sessions ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl uppercase tracking-widest text-text">
          Histórico
        </h1>
        <p className="text-sm text-muted mt-1">
          Sessões de raspagem anteriores. Clique para ver os contatos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessões de Raspagem</CardTitle>
          <span className="text-xs font-mono text-dim">{list.length} sessão{list.length !== 1 ? 'ões' : ''}</span>
        </CardHeader>

        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MapPin size={24} className="text-dim" />
            <p className="text-sm text-muted">Nenhuma sessão encontrada.</p>
            <p className="text-xs text-dim">Execute uma raspagem para ver o histórico aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-2 pr-3 w-6" />
                  <th className="pb-2 pr-4 font-mono text-muted uppercase tracking-wider font-normal">
                    Query
                  </th>
                  <th className="pb-2 pr-4 font-mono text-muted uppercase tracking-wider font-normal">
                    Localização
                  </th>
                  <th className="pb-2 pr-4 font-mono text-muted uppercase tracking-wider font-normal">
                    Data
                  </th>
                  <th className="pb-2 pr-4 font-mono text-muted uppercase tracking-wider font-normal">
                    Status
                  </th>
                  <th className="pb-2 font-mono text-muted uppercase tracking-wider font-normal text-right">
                    Found
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    isSelected={selectedId === session.id}
                    onToggle={() => toggle(session.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
