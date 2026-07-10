import { createPrivateKey } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';

// Must match `client_auth.audience` in powersync/config/service.yaml.
const AUDIENCE = ['powersync-dev', 'powersync'];

// Placeholder identity source: a small hardcoded map of demo users, standing in
// for real login/signup. This is the ONLY place that needs to change when real
// authentication replaces it — sync rules, backend routes, and the client schema
// only ever consume the resulting user_id (the JWT's `sub` claim), never this map.
export const DEMO_USER_IDS = ['user-a', 'user-b'] as const;
export type DemoUserId = (typeof DEMO_USER_IDS)[number];

function isDemoUserId(value: string): value is DemoUserId {
  return (DEMO_USER_IDS as readonly string[]).includes(value);
}

const defaultKeyPath = join(dirname(fileURLToPath(import.meta.url)), '../../keys/private.jwk.json');
const privateJwk = JSON.parse(readFileSync(process.env.PRIVATE_KEY_PATH ?? defaultKeyPath, 'utf8'));
const privateKey = createPrivateKey({ key: privateJwk, format: 'jwk' });

export function mintDemoToken(demoUserId: string): string {
  if (!isDemoUserId(demoUserId)) {
    throw new Error(`Unknown demo user: ${demoUserId}`);
  }
  return jwt.sign({}, privateKey, {
    algorithm: 'RS256',
    keyid: privateJwk.kid,
    subject: demoUserId,
    audience: AUDIENCE,
    expiresIn: '5m',
  });
}
