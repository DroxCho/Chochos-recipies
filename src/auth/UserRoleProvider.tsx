import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserRole } from './roles';
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

  useEffect(() => {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  }, [role]);

  const userId = role === 'admin' ? 'admin-user-1' : role === 'registered' ? 'registered-user-1' : null;

  const value = useMemo(() => ({ role, setRole, userId }), [role, userId]);

  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
}
