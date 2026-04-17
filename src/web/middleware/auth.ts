import basicAuth from 'express-basic-auth';
import type { RequestHandler } from 'express';

export function createAuthMiddleware(): RequestHandler | null {
  const user = process.env.AUTH_USER?.trim();
  const pass = process.env.AUTH_PASS?.trim();

  if (!user || !pass) return null;

  return basicAuth({
    users: { [user]: pass },
    challenge: true,
    realm: 'Maps Leads',
    unauthorizedResponse: () => ({ error: 'Acesso negado' }),
  }) as RequestHandler;
}
