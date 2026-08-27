import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useUserRole } from '../../auth/useUserRole';
import type { UserRole } from '../../auth/roles';
import { readUserAdminControls, resolveManagedRole } from '../../auth/userAdminControls';
import supabaseUsersSnapshot from '../../data/supabaseUsersSnapshot.json';
import { useLanguage } from '../../i18n/useLanguage';
import { getSupabaseClient } from '../../lib/supabase';

interface SnapshotUser {
  id: string;
  role: string;
}

const snapshotUsers = Array.isArray((supabaseUsersSnapshot as { users?: unknown[] }).users)
  ? ((supabaseUsersSnapshot as { users: SnapshotUser[] }).users)
  : [];

export function UserRoleToggle() {
  const { role, setRole } = useUserRole();
  const { t } = useLanguage();
  const [canSwitchRole, setCanSwitchRole] = useState(role === 'admin');

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCanSwitchRole(false);
      return;
    }
    const client = supabase;

    let isMounted = true;

    async function refreshCanSwitchRole() {
      const { data } = await client.auth.getSession();
      const sessionUser = data.session?.user;

      if (!isMounted) {
        return;
      }

      if (!sessionUser?.id) {
        setCanSwitchRole(false);
        return;
      }

      const managedRole = resolveManagedRole(readUserAdminControls()[sessionUser.id]);
      if (managedRole === 'admin') {
        setCanSwitchRole(true);
        return;
      }

      if (managedRole === 'blocked' || managedRole === 'registered') {
        setCanSwitchRole(false);
        return;
      }

      if (sessionUser.app_metadata?.role === 'admin') {
        setCanSwitchRole(true);
        return;
      }

      const snapshotRole = snapshotUsers.find((entry) => entry.id === sessionUser.id)?.role;
      if (snapshotRole === 'admin') {
        setCanSwitchRole(true);
        return;
      }

      const { data: profileData, error } = await client
        .from('profiles')
        .select('role')
        .eq('user_id', sessionUser.id)
        .maybeSingle<{ role: UserRole | null }>();

      if (!isMounted) {
        return;
      }

      if (!error && profileData?.role === 'admin') {
        setCanSwitchRole(true);
        return;
      }

      setCanSwitchRole(false);
    }

    void refreshCanSwitchRole();

    const { data: authSubscription } = client.auth.onAuthStateChange(() => {
      void refreshCanSwitchRole();
    });

    function handleUserControlsUpdated() {
      void refreshCanSwitchRole();
    }

    window.addEventListener('user-controls-updated', handleUserControlsUpdated);
    window.addEventListener('storage', handleUserControlsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('user-controls-updated', handleUserControlsUpdated);
      window.removeEventListener('storage', handleUserControlsUpdated);
      authSubscription.subscription.unsubscribe();
    };
  }, [role]);

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    setRole(event.target.value as UserRole);
  }

  if (!canSwitchRole) {
    const roleLabel = role === 'registered'
      ? t('roleRegistered')
      : role === 'blocked'
        ? t('roleBlocked')
        : t('roleVisitor');

    return (
      <span className="text-xs text-slate-600">{roleLabel}</span>
    );
  }

  return (
    <label className="flex items-center gap-2 text-xs text-slate-600">
      {t('userTypeLabel')}:
      <select
        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
        onChange={handleChange}
        value={role}
      >
        <option value="visitor">{t('roleVisitor')}</option>
        <option value="registered">{t('roleRegistered')}</option>
        <option value="admin">{t('roleAdmin')}</option>
        <option value="blocked">{t('roleBlocked')}</option>
      </select>
    </label>
  );
}
