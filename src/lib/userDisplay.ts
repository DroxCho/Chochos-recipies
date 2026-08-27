import supabaseUsersSnapshot from '../data/supabaseUsersSnapshot.json';

const PROFILE_STORAGE_KEY = 'recipes_user_profiles_v1';

interface LocalProfile {
  fullName?: string;
}

type LocalProfilesMap = Record<string, LocalProfile>;

interface SnapshotUser {
  id: string;
  email: string | null;
}

const snapshotUsers = ((supabaseUsersSnapshot as { users?: SnapshotUser[] }).users ?? []);

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

  if (userId === 'admin-user-1' || ownerRole === 'admin') {
    return 'Admin';
  }

  const profiles = readLocalProfiles();
  const fullName = profiles[userId]?.fullName?.trim();
  if (fullName) {
    return fullName;
  }

  const snapshotUser = snapshotUsers.find((user) => user.id === userId);
  if (snapshotUser?.email) {
    return snapshotUser.email;
  }

  return userId;
}
