import { useEffect, useRef, useState } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!roleMenuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isMenuOpen]);

  const roleOptions: Array<{ value: UserRole; label: string }> = [
    { value: 'visitor', label: t('roleVisitor') },
    { value: 'registered', label: t('roleRegistered') },
    { value: 'admin', label: t('roleAdmin') },
    { value: 'blocked', label: t('roleBlocked') },
  ];

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
    <div className="relative flex max-w-full flex-wrap items-center gap-2 text-xs text-slate-600" ref={roleMenuRef}>
      <span>{t('userTypeLabel')}:</span>
      <button
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        className="inline-flex min-w-[128px] items-center justify-between rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
      >
        <span className="truncate">{roleOptions.find((option) => option.value === role)?.label ?? t('roleVisitor')}</span>
        <span aria-hidden="true" className="ml-2 text-[10px]">▾</span>
      </button>

      {isMenuOpen && (
        <div
          className="absolute right-0 top-full z-30 mt-1 w-[min(14rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md"
          role="menu"
        >
          {roleOptions.map((option) => {
            const isSelected = role === option.value;

            return (
              <button
                key={option.value}
                className={`flex w-full items-center rounded px-2 py-1.5 text-left text-sm ${isSelected ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                onClick={() => {
                  setRole(option.value);
                  setIsMenuOpen(false);
                }}
                role="menuitemradio"
                aria-checked={isSelected}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
