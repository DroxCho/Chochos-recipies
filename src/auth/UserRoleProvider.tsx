import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserRole } from './roles';
import { getSupabaseClient } from '../lib/supabase';
import { UserRoleContext } from './userRoleContext';

const ROLE_STORAGE_KEY = 'recipes_user_role';
const ADMIN_EMAIL = 'drumeshki@gmail.com';

interface UserRoleProviderProps {
  children: ReactNode;
}

function resolveRoleForSession(
  previousRole: UserRole,
  userId: string | null,
  userEmail: string | null | undefined,
): UserRole {
  if (!userId) {
    return 'visitor';
  }

  if (userEmail?.toLowerCase() === ADMIN_EMAIL) {
    return 'admin';
  }

  if (previousRole === 'admin') {
    return 'registered';
  }

  return previousRole === 'visitor' ? 'registered' : previousRole;
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

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      const id = data.session?.user?.id ?? null;
      const email = data.session?.user?.email;
      setAuthUserId(id);
      setRole((previousRole) => resolveRoleForSession(previousRole, id, email));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id ?? null;
      const email = session?.user?.email;
      setAuthUserId(id);
      setRole((previousRole) => resolveRoleForSession(previousRole, id, email));
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const userId = role === 'admin' ? 'admin-user-1' : role === 'registered' ? authUserId : null;

  const value = useMemo(() => ({ role, setRole, userId }), [role, userId]);

  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
}
