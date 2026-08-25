import { createContext } from 'react';
import type { UserRole } from './roles';

export interface UserRoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userId: string | null;
}

export const UserRoleContext = createContext<UserRoleContextValue | undefined>(undefined);
