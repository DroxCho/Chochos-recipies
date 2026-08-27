import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserRole } from './roles';
import { getSupabaseClient } from '../lib/supabase';
import { UserRoleContext } from './userRoleContext';

const ROLE_STORAGE_KEY = 'recipes_user_role';

interface UserRoleProviderProps {
  children: ReactNode;
}

async function fetchRoleFromProfile(userId: string): Promise<UserRole> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return 'registered';
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle<{ role: UserRole | null }>();

  if (error) {
    return 'registered';
  }

  if (data?.role === 'admin') {
    return 'admin';
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

      const resolvedRole = await fetchRoleFromProfile(id);
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

      void fetchRoleFromProfile(id).then((resolvedRole) => {
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
