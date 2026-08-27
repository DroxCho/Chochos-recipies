import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function normalizeEnvValue(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

const SUPABASE_URL = normalizeEnvValue(process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL).');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in your shell before running sync.');
}

function assertAscii(name, value) {
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) > 255) {
      throw new Error(
        `${name} contains non-ASCII characters. Use the real Supabase key value, not placeholder text.`,
      );
    }
  }
}

function assertLikelySupabaseKey(value) {
  const looksLikeJwt = value.split('.').length === 3;
  const looksLikeSbSecret = value.startsWith('sb_secret_');

  if (!looksLikeJwt && !looksLikeSbSecret) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY has an invalid format. Expected a service_role JWT or an sb_secret_* key.',
    );
  }
}

function assertNotMaskedKey(value) {
  if (value.includes('*') || value.includes('...') || value.includes('•')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY looks masked/truncated. Copy the full key from Supabase using the copy button.',
    );
  }
}

assertAscii('SUPABASE_URL', SUPABASE_URL);
assertAscii('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);
assertNotMaskedKey(SUPABASE_SERVICE_ROLE_KEY);
assertLikelySupabaseKey(SUPABASE_SERVICE_ROLE_KEY);

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outputPath = path.join(root, 'src', 'data', 'supabaseUsersSnapshot.json');

async function supabaseFetch(endpoint) {
  const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase request failed (${response.status}) on ${endpoint}: ${body}`);
  }

  return response.json();
}

function normalizeRole(value) {
  if (typeof value === 'string' && value.toLowerCase() === 'admin') {
    return 'admin';
  }

  return 'registered';
}

async function readAllUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const payload = await supabaseFetch(`/auth/v1/admin/users?page=${page}&per_page=${perPage}`);
    const chunk = Array.isArray(payload?.users) ? payload.users : [];
    users.push(...chunk);

    if (chunk.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

async function readProfilesRoleMap() {
  try {
    const rows = await supabaseFetch('/rest/v1/profiles?select=user_id,role');
    const roleMap = new Map();

    for (const row of rows) {
      if (row?.user_id) {
        roleMap.set(row.user_id, normalizeRole(row.role));
      }
    }

    return roleMap;
  } catch {
    return new Map();
  }
}

async function main() {
  const [users, profileRoleMap] = await Promise.all([readAllUsers(), readProfilesRoleMap()]);

  const snapshot = users
    .map((user) => {
      const email = typeof user?.email === 'string' ? user.email : null;
      const appMetaRole = user?.app_metadata?.role;
      const profileRole = profileRoleMap.get(user?.id);
      const role = normalizeRole(profileRole ?? appMetaRole);

      return {
        id: user?.id,
        email,
        role,
        created_at: user?.created_at ?? null,
        last_sign_in_at: user?.last_sign_in_at ?? null,
      };
    })
    .filter((item) => Boolean(item.id))
    .sort((a, b) => {
      const left = a.email ?? '';
      const right = b.email ?? '';
      return left.localeCompare(right);
    });

  const payload = {
    synced_at: new Date().toISOString(),
    source_url: SUPABASE_URL,
    total: snapshot.length,
    users: snapshot,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Synced ${snapshot.length} users to ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
