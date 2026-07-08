// Generates an RSA keypair for signing/verifying client JWTs against the self-hosted
// PowerSync service. The public key's JWK fields get written into .env (consumed by
// service.yaml's inline `client_auth.jwks`, so no separate JWKS server is needed for
// this demo). The private key is saved locally (gitignored) — step 3 uses it to mint
// a demo JWT for the app to connect with.
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(rootDir, '.env');
const keysDir = join(rootDir, 'keys');

if (!existsSync(envPath)) {
  console.error('powersync/.env not found — copy .env.example to .env first.');
  process.exit(1);
}

mkdirSync(keysDir, { recursive: true });

const kid = `powersync-${randomBytes(5).toString('hex')}`;
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

const publicJwk = { ...publicKey.export({ format: 'jwk' }), alg: 'RS256', kid, use: 'sig' };
const privateJwk = { ...privateKey.export({ format: 'jwk' }), alg: 'RS256', kid, use: 'sig' };

writeFileSync(join(keysDir, 'public.jwk.json'), JSON.stringify(publicJwk, null, 2));
writeFileSync(join(keysDir, 'private.jwk.json'), JSON.stringify(privateJwk, null, 2));

const env = readFileSync(envPath, 'utf8')
  .replace(/^PS_JWK_KID=.*$/m, `PS_JWK_KID=${publicJwk.kid}`)
  .replace(/^PS_JWK_N=.*$/m, `PS_JWK_N=${publicJwk.n}`)
  .replace(/^PS_JWK_E=.*$/m, `PS_JWK_E=${publicJwk.e}`);
writeFileSync(envPath, env);

console.log(`Generated signing key (kid: ${kid})`);
console.log('Wrote PS_JWK_KID / PS_JWK_N / PS_JWK_E into powersync/.env');
console.log('Private key saved to powersync/keys/private.jwk.json (gitignored, not synced anywhere)');
