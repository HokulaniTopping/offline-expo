import { createPublicKey } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Must match `client_auth.audience` in powersync/config/service.yaml.
const AUDIENCE = ['powersync-dev', 'powersync'];

const defaultKeyPath = join(dirname(fileURLToPath(import.meta.url)), '../../../keys/public.jwk.json');
const publicJwk = JSON.parse(readFileSync(process.env.PUBLIC_KEY_PATH ?? defaultKeyPath, 'utf8'));
const publicKey = createPublicKey({ key: publicJwk, format: 'jwk' });

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

// Verifies the same token the client uses to connect to PowerSync. This is a
// second, independent check — sync rules alone only stop a user from *seeing*
// another user's rows, not from a write request *touching* them directly.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }
  try {
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'], audience: AUDIENCE });
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      res.status(403).json({ error: 'Token missing subject' });
      return;
    }
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
