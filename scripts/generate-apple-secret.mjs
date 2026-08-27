import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function main() {
  const teamId = requireEnv('APPLE_TEAM_ID');
  const keyId = requireEnv('APPLE_KEY_ID');
  const clientId = requireEnv('APPLE_CLIENT_ID');
  const privateKeyPath = requireEnv('APPLE_PRIVATE_KEY_PATH');
  const expiresIn = process.env.APPLE_SECRET_EXPIRES_IN?.trim() || '180d';

  const absoluteKeyPath = path.resolve(process.cwd(), privateKeyPath);
  if (!fs.existsSync(absoluteKeyPath)) {
    throw new Error(`Private key file not found: ${absoluteKeyPath}`);
  }

  const privateKey = fs.readFileSync(absoluteKeyPath, 'utf8');

  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    issuer: teamId,
    audience: 'https://appleid.apple.com',
    subject: clientId,
    expiresIn,
    header: {
      kid: keyId,
    },
  });

  process.stdout.write(`${token}\n`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Failed to generate Apple secret: ${message}\n`);
  process.exit(1);
}
