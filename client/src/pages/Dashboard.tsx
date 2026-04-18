import { useQuery } from '@tanstack/react-query';
import { Database, Phone, Mail, Send } from 'lucide-react';
import { api } from '../lib/api';
import { StatCard }    from '../components/dashboard/StatCard';
import { FunnelChart } from '../components/dashboard/FunnelChart';
import { LiveFeed }    from '../components/dashboard/LiveFeed';
import { Spinner }     from '../components/ui/Spinner';

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: api.analytics.get,
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner />
      </div>
    );
  }

  const f = data?.funnel ?? { total: 0, withPhone: 0, withEmail: 0, waSent: 0, emailSent: 0 };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={f.total}
          icon={<Database size={16} />}
          accent="none"
        />
        <StatCard
          label="Com Telefone"
          value={f.withPhone}
          sub={f.total ? `${Math.round(f.withPhone / f.total * 100)}%` : '—'}
          icon={<Phone size={16} />}
          accent="cyan"
        />
        <StatCard
          label="Com Email"
          value={f.withEmail}
          sub={f.total ? `${Math.round(f.withEmail / f.total * 100)}%` : '—'}
          icon={<Mail size={16} />}
          accent="green"
        />
        <StatCard
          label="Mensagens Enviadas"
          value={f.waSent + f.emailSent}
          sub={`WA: ${f.waSent} | Email: ${f.emailSent}`}
          icon={<Send size={16} />}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {data && <FunnelChart funnel={data.funnel} />}
        </div>
        <LiveFeed />
      </div>
    </div>
  );
}
