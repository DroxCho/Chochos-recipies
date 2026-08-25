import { useContext } from 'react';
import { UserRoleContext } from './userRoleContext';

export function useUserRole() {
  const context = useContext(UserRoleContext);

  if (!context) {
    throw new Error('useUserRole must be used within UserRoleProvider');
  }

  return context;
}
