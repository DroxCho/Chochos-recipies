export type ManagedUserRole = 'registered' | 'admin';

export interface UserAdminControl {
  role?: ManagedUserRole;
  blocked?: boolean;
  deleted?: boolean;
}

export type UserAdminControlMap = Record<string, UserAdminControl>;

export const USER_ADMIN_CONTROLS_STORAGE_KEY = 'recipes_user_admin_controls_v1';

export function readUserAdminControls(): UserAdminControlMap {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = localStorage.getItem(USER_ADMIN_CONTROLS_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as UserAdminControlMap;
  } catch {
    return {};
  }
}

export function writeUserAdminControls(value: UserAdminControlMap): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(USER_ADMIN_CONTROLS_STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event('user-controls-updated'));
}

export function resolveManagedRole(
  control: UserAdminControl | undefined,
): 'blocked' | ManagedUserRole | null {
  if (!control) {
    return null;
  }

  if (control.deleted || control.blocked) {
    return 'blocked';
  }

  if (control.role === 'admin' || control.role === 'registered') {
    return control.role;
  }

  return null;
}
