import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle } from './ui/Card';

export function TunnelQR() {
  const { data } = useQuery({
    queryKey: ['tunnel-url'],
    queryFn: api.tunnel.getUrl,
    refetchInterval: 10_000,
  });

  const url = data?.url ?? null;

  return (
    <Card accent={url ? 'green' : 'none'}>
      <CardHeader>
        <CardTitle>Acesso Remoto</CardTitle>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {url ? (
            <span className="flex items-center gap-1 text-green">
              <Wifi size={12} /> Túnel ativo
            </span>
          ) : (
            <span className="flex items-center gap-1 text-dim">
              <WifiOff size={12} /> Túnel inativo
            </span>
          )}
        </div>
      </CardHeader>

      {url ? (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* QR Code */}
          <div className="p-3 bg-white rounded shrink-0">
            <QRCodeSVG value={url} size={140} bgColor="#ffffff" fgColor="#080B10" />
          </div>

          {/* Info */}
          <div className="space-y-3 min-w-0">
            <p className="text-xs text-muted">
              Escaneie o QR code com o celular para acessar o painel de qualquer lugar.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-cyan hover:text-text transition-colors break-all"
            >
              <ExternalLink size={11} className="shrink-0" />
              {url}
            </a>
            <p className="text-xs text-dim">
              O link muda a cada reinício do servidor.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted">
          Defina <code className="font-mono text-accent">REMOTE_TUNNEL=true</code> no{' '}
          <code className="font-mono text-accent">.env</code> e reinicie o servidor para ativar.
        </p>
      )}
    </Card>
  );
}
