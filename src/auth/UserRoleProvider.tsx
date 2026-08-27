import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserRole } from './roles';
import { getSupabaseClient } from '../lib/supabase';
import { UserRoleContext } from './userRoleContext';
import supabaseUsersSnapshot from '../data/supabaseUsersSnapshot.json';

const ROLE_STORAGE_KEY = 'recipes_user_role';

interface UserRoleProviderProps {
  children: ReactNode;
}

interface SnapshotUser {
  id: string;
  role: string;
}

const snapshotUsers = Array.isArray((supabaseUsersSnapshot as { users?: unknown[] }).users)
  ? ((supabaseUsersSnapshot as { users: SnapshotUser[] }).users)
  : [];

function normalizeRole(value: unknown): UserRole | null {
  if (value === 'admin') {
    return 'admin';
  }

  if (value === 'registered') {
    return 'registered';
  }

  return null;
}

async function fetchRoleFromProfile(userId: string): Promise<UserRole | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle<{ role: UserRole | null }>();

  if (error) {
    return null;
  }

  return normalizeRole(data?.role);
}

async function resolveRoleForUser(userId: string, appMetaRole: unknown): Promise<UserRole> {
  const profileRole = await fetchRoleFromProfile(userId);
  if (profileRole) {
    return profileRole;
  }

  const snapshotRole = normalizeRole(snapshotUsers.find((user) => user.id === userId)?.role);
  if (snapshotRole) {
    return snapshotRole;
  }

  const metadataRole = normalizeRole(appMetaRole);
  if (metadataRole) {
    return metadataRole;
  }

  return 'registered';
}

export function UserRoleProvider({ children }: UserRoleProviderProps) {
  const [role, setRole] = useState<UserRole>(() => {
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY);
    if (storedRole === 'visitor' || storedRole === 'registered' || storedRole === 'admin') {
      return storedRole;
    }

    return 'visitor';
  });
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  }, [role]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) {
        return;
      }

      const id = data.session?.user?.id ?? null;
      setAuthUserId(id);

      if (!id) {
        setRole('visitor');
        return;
      }

      const resolvedRole = await resolveRoleForUser(id, data.session?.user?.app_metadata?.role);
      if (isMounted) {
        setRole(resolvedRole);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id ?? null;
      setAuthUserId(id);

      if (!id) {
        setRole('visitor');
        return;
      }

      void resolveRoleForUser(id, session?.user?.app_metadata?.role).then((resolvedRole) => {
        if (isMounted) {
          setRole(resolvedRole);
        }
      });
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const userId = role === 'visitor' ? null : authUserId;

  const value = useMemo(() => ({ role, setRole, userId }), [role, userId]);

  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
}
