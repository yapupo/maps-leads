import 'dotenv/config';
import { createServer } from './src/web/server';

const PORT = parseInt(process.env.PORT ?? '3000');

process.on('unhandledRejection', (reason) => {
  console.error('\n[ERRO] Unhandled rejection:', reason);
});

createServer(PORT).then(() => {
  // Auto-open browser on Windows
  const { exec } = require('child_process');
  exec(`start http://localhost:${PORT}`);
}).catch((err) => {
  console.error('[ERRO FATAL]', err);
  process.exit(1);
});
