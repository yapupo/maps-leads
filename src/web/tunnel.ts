import { Tunnel } from 'cloudflared';

export async function startTunnel(port: number): Promise<void> {
  console.log('\n  [TUNNEL] Iniciando túnel remoto Cloudflare...');

  const t = Tunnel.quick(`http://localhost:${port}`);

  const publicUrl = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Túnel não iniciou em 60s')), 60_000);
    t.once('url', (url: string) => { clearTimeout(timeout); resolve(url); });
    t.once('error', (err: Error) => { clearTimeout(timeout); reject(err); });
  });

  console.log('\n  ╔════════════════════════════════════════════════════╗');
  console.log('  ║  ACESSO REMOTO ATIVO                               ║');
  console.log(`  ║  ${publicUrl.padEnd(51)}║`);
  console.log('  ╚════════════════════════════════════════════════════╝');
  console.log('\n  Abra esse link no celular para controlar de qualquer lugar.\n');

  const stop = () => { t.stop(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
