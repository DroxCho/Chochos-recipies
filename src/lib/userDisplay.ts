import supabaseUsersSnapshot from '../data/supabaseUsersSnapshot.json';

const PROFILE_STORAGE_KEY = 'recipes_user_profiles_v1';

interface LocalProfile {
  fullName?: string;
}

type LocalProfilesMap = Record<string, LocalProfile>;

interface SnapshotUser {
  id: string;
  email: string | null;
  role?: string;
}

const snapshotUsers = ((supabaseUsersSnapshot as { users?: SnapshotUser[] }).users ?? []);

function findCanonicalAdminUserId(): string | null {
  const adminUser = snapshotUsers.find((user) => user.role === 'admin');
  return adminUser?.id ?? null;
}

function resolveCanonicalUserId(userId: string, ownerRole?: 'registered' | 'admin'): string {
  const isLegacyAdminId = userId === 'admin-user-1' || userId.startsWith('admin-user-');
  if (!isLegacyAdminId && ownerRole !== 'admin') {
    return userId;
  }

  const canonicalAdminId = findCanonicalAdminUserId();
  return canonicalAdminId ?? userId;
}

function readLocalProfiles(): LocalProfilesMap {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as LocalProfilesMap;
  } catch {
    return {};
  }
}

export function getUserDisplayName(userId: string, ownerRole?: 'registered' | 'admin'): string {
  if (!userId) {
    return '';
  }

  const canonicalUserId = resolveCanonicalUserId(userId, ownerRole);

  const profiles = readLocalProfiles();
  const fullName = profiles[canonicalUserId]?.fullName?.trim();
  if (fullName) {
    return fullName;
  }

  const snapshotUser = snapshotUsers.find((user) => user.id === canonicalUserId);
  if (snapshotUser?.email) {
    return snapshotUser.email;
  }

  return canonicalUserId;
}

export function getUserProfileLinkId(userId: string, ownerRole?: 'registered' | 'admin'): string {
  if (!userId) {
    return '';
  }

  return resolveCanonicalUserId(userId, ownerRole);
}
