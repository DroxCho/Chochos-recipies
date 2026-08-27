import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserRole } from './roles';
import { getSupabaseClient } from '../lib/supabase';
import { UserRoleContext } from './userRoleContext';

const ROLE_STORAGE_KEY = 'recipes_user_role';

interface UserRoleProviderProps {
  children: ReactNode;
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
      setAuthUserId(id);

      if (id) {
        setRole((previousRole) => (previousRole === 'visitor' ? 'registered' : previousRole));
      } else {
        setRole((previousRole) => (previousRole === 'registered' ? 'visitor' : previousRole));
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id ?? null;
      setAuthUserId(id);

      if (id) {
        setRole((previousRole) => (previousRole === 'visitor' ? 'registered' : previousRole));
      } else {
        setRole((previousRole) => (previousRole === 'registered' ? 'visitor' : previousRole));
      }
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
