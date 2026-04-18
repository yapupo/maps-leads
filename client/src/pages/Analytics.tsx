import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAnalytics } from '../hooks';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { formatDate, formatDuration } from '../lib/utils';

const FIELD_LABELS: Record<string, string> = {
  phone:    'Telefone',
  email:    'Email',
  website:  'Site',
  category: 'Categoria',
  rating:   'Avaliação',
};

const FIELD_COLORS: Record<string, string> = {
  phone:    '#58A6FF',
  email:    '#3FB950',
  website:  '#F0B429',
  category: '#A371F7',
  rating:   '#F85149',
};

function FieldRateBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted uppercase tracking-wider">{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 bg-elevated border border-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded px-3 py-2 text-xs font-mono shadow-lg">
      <p className="text-text">{payload[0]?.payload?.name}</p>
      <p className="text-accent mt-0.5">{payload[0]?.value} negócios</p>
    </div>
  );
}

export function Analytics() {
  const { data, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner />
      </div>
    );
  }

  const fieldRates = data?.fieldRates ?? { phone: 0, email: 0, website: 0, category: 0, rating: 0 };
  const topCategories = data?.topCategories ?? [];
  const sessionStats = data?.sessionStats ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl uppercase tracking-widest text-text">
          Analytics
        </h1>
        <p className="text-sm text-muted mt-1">
          Estatísticas de qualidade dos dados e sessões de raspagem.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Field rates */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Preenchimento por Campo</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {Object.entries(fieldRates).map(([key, val]) => (
              <FieldRateBar
                key={key}
                label={FIELD_LABELS[key] ?? key}
                value={val}
                color={FIELD_COLORS[key] ?? '#7D8590'}
              />
            ))}
          </div>
        </Card>

        {/* Top categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categorias</CardTitle>
          </CardHeader>
          {topCategories.length === 0 ? (
            <p className="text-xs text-dim font-mono">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topCategories.slice(0, 10)}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: '#7D8590', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fill: '#7D8590', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(240,180,41,0.05)' }} />
                <Bar dataKey="count" radius={2}>
                  {topCategories.slice(0, 10).map((_entry, idx) => (
                    <Cell key={idx} fill={idx === 0 ? '#F0B429' : '#30363D'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Session stats table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Sessões</CardTitle>
          <span className="text-xs font-mono text-dim">{sessionStats.length} sessões</span>
        </CardHeader>
        {sessionStats.length === 0 ? (
          <p className="text-xs text-dim font-mono">Nenhuma sessão ainda.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-2 pr-4 font-mono text-muted uppercase tracking-wider font-normal">Query</th>
                  <th className="pb-2 pr-4 font-mono text-muted uppercase tracking-wider font-normal">Localização</th>
                  <th className="pb-2 pr-4 font-mono text-muted uppercase tracking-wider font-normal">Data</th>
                  <th className="pb-2 pr-4 font-mono text-muted uppercase tracking-wider font-normal text-right">Found</th>
                  <th className="pb-2 pr-4 font-mono text-muted uppercase tracking-wider font-normal text-right">Tel%</th>
                  <th className="pb-2 pr-4 font-mono text-muted uppercase tracking-wider font-normal text-right">Email%</th>
                  <th className="pb-2 font-mono text-muted uppercase tracking-wider font-normal text-right">Duração</th>
                </tr>
              </thead>
              <tbody>
                {sessionStats.map((s) => {
                  const phonePct = s.found > 0 ? Math.round((s.withPhone / s.found) * 100) : 0;
                  const emailPct = s.found > 0 ? Math.round((s.withEmail / s.found) * 100) : 0;
                  return (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-elevated/50 transition-colors">
                      <td className="py-2 pr-4 text-text font-mono max-w-[160px] truncate">{s.query}</td>
                      <td className="py-2 pr-4 text-muted font-mono">{s.location ?? '—'}</td>
                      <td className="py-2 pr-4 text-muted font-mono whitespace-nowrap">{formatDate(s.startedAt)}</td>
                      <td className="py-2 pr-4 text-right">
                        <span className="font-mono text-cyan">{s.found}</span>
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <span className="font-mono text-text">{phonePct}%</span>
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <span className="font-mono text-text">{emailPct}%</span>
                      </td>
                      <td className="py-2 text-right">
                        <span className="font-mono text-dim">{formatDuration(s.durationMs)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
