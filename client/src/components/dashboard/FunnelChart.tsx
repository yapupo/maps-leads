import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import type { Analytics } from '../../lib/api';

interface FunnelChartProps { funnel: Analytics['funnel'] }

export function FunnelChart({ funnel }: FunnelChartProps) {
  const data = [
    { name: 'Total',     value: funnel.total,     color: '#7D8590' },
    { name: 'Telefone',  value: funnel.withPhone,  color: '#58A6FF' },
    { name: 'Email',     value: funnel.withEmail,  color: '#3FB950' },
    { name: 'WA Sent',   value: funnel.waSent,     color: '#F0B429' },
    { name: 'Mail Sent', value: funnel.emailSent,  color: '#F0B429' },
  ];

  return (
    <Card>
      <CardHeader><CardTitle>Funil de Leads</CardTitle></CardHeader>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#7D8590', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: '#7D8590', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#0D1117', border: '1px solid #21262D',
              borderRadius: 4, color: '#E6EDF3', fontSize: 12,
              fontFamily: 'JetBrains Mono',
            }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
