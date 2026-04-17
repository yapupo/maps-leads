import 'dotenv/config';
import { createServer } from './src/web/server';
import { startTunnel } from './src/web/tunnel';

const PORT = parseInt(process.env.PORT ?? '3000');
const REMOTE = process.env.REMOTE_TUNNEL === 'true';

process.on('unhandledRejection', (reason) => {
  console.error('\n[ERRO] Unhandled rejection:', reason);
});

createServer(PORT).then(async () => {
  if (REMOTE) {
    if (!process.env.AUTH_USER || !process.env.AUTH_PASS) {
      console.error('\n  [ERRO] REMOTE_TUNNEL=true exige AUTH_USER e AUTH_PASS definidos no .env!\n');
      process.exit(1);
    }
    await startTunnel(PORT);
  } else {
    const { exec } = require('child_process');
    exec(`start http://localhost:${PORT}`);
  }
}).catch((err) => {
  console.error('[ERRO FATAL]', err);
  process.exit(1);
});
