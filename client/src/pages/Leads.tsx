import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { LeadsTable }                          from '../components/leads/LeadsTable';
import { LeadFilters, type LeadFiltersState }  from '../components/leads/LeadFilters';
import { Button }  from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export function Leads() {
  const qc = useQueryClient();
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: api.contacts.list,
  });

  const [filters, setFilters] = useState<LeadFiltersState>({
    search: '', hasPhone: null, hasEmail: null, sentWA: null,
  });

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return contacts.filter((c) => {
      if (q && ![c.businessName, c.phone ?? '', c.email ?? '', c.address ?? '']
        .some((v) => v.toLowerCase().includes(q))) return false;
      if (filters.hasPhone === true  && !c.phone)  return false;
      if (filters.hasPhone === false && c.phone)   return false;
      if (filters.hasEmail === true  && !c.email)  return false;
      if (filters.hasEmail === false && c.email)   return false;
      if (filters.sentWA   === true  && !c.messageSentWhatsapp) return false;
      if (filters.sentWA   === false && c.messageSentWhatsapp)  return false;
      return true;
    });
  }, [contacts, filters]);

  async function handleClear() {
    if (!confirm(`Apagar todos os ${contacts.length} leads? Esta ação não pode ser desfeita.`)) return;
    await api.contacts.clear();
    qc.invalidateQueries({ queryKey: ['contacts'] });
    qc.invalidateQueries({ queryKey: ['analytics'] });
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <LeadFilters
          filters={filters}
          onChange={setFilters}
          total={contacts.length}
          filtered={filtered.length}
        />
        <div className="flex gap-2 ml-4">
          <a href={api.contacts.downloadUrl()}>
            <Button variant="secondary" size="sm"><Download size={13} /> CSV</Button>
          </a>
          <Button variant="danger" size="sm" onClick={handleClear}>
            <Trash2 size={13} /> Limpar
          </Button>
        </div>
      </div>
      <LeadsTable contacts={filtered} />
    </div>
  );
}
