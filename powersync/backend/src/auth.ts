import { createPrivateKey } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';

// Must match `client_auth.audience` in powersync/config/service.yaml.
const AUDIENCE = ['powersync-dev', 'powersync'];

// Placeholder: mints a token for one fixed dev user with no real login/auth check.
// Replace with per-user issuance backed by real authentication in a later phase.
const DEV_USER_ID = 'dev-user';

const defaultKeyPath = join(dirname(fileURLToPath(import.meta.url)), '../../keys/private.jwk.json');
const privateJwk = JSON.parse(readFileSync(process.env.PRIVATE_KEY_PATH ?? defaultKeyPath, 'utf8'));
const privateKey = createPrivateKey({ key: privateJwk, format: 'jwk' });

export function mintDevToken(): string {
  return jwt.sign({}, privateKey, {
    algorithm: 'RS256',
    keyid: privateJwk.kid,
    subject: DEV_USER_ID,
    audience: AUDIENCE,
    expiresIn: '5m',
  });
}
