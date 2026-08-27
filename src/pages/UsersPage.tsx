import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserRole } from '../auth/useUserRole';
import { readUserAdminControls, resolveManagedRole } from '../auth/userAdminControls';
import supabaseUsersSnapshot from '../data/supabaseUsersSnapshot.json';
import { useLanguage } from '../i18n/useLanguage';
import { openPublicUserCard } from '../lib/publicUserCard';

interface SnapshotUser {
  id: string;
  email: string | null;
  role?: string;
}

interface DisplayUser {
  id: string;
  email: string;
  role: 'registered' | 'admin' | 'blocked';
}

function normalizeRole(value: unknown): 'registered' | 'admin' {
  return value === 'admin' ? 'admin' : 'registered';
}

export function UsersPage() {
  const { t } = useLanguage();
  const { role } = useUserRole();
  const [controlsVersion, setControlsVersion] = useState(0);
  const snapshotUsers = useMemo(
    () => ((supabaseUsersSnapshot as { users?: SnapshotUser[] }).users ?? []),
    [],
  );

  useEffect(() => {
    function handleControlsUpdated() {
      setControlsVersion((current) => current + 1);
    }

    function handleStorage(event: StorageEvent) {
      if (!event.key || event.key === 'recipes_user_admin_controls_v1') {
        setControlsVersion((current) => current + 1);
      }
    }

    window.addEventListener('user-controls-updated', handleControlsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('user-controls-updated', handleControlsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const users = useMemo(() => {
    void controlsVersion;

    const controls = readUserAdminControls();

    return snapshotUsers
      .map((entry) => {
        const managedRole = resolveManagedRole(controls[entry.id]);
        const effectiveRole = managedRole ?? normalizeRole(entry.role);

        return {
          id: entry.id,
          email: entry.email ?? '',
          role: effectiveRole,
        } satisfies DisplayUser;
      })
      .sort((a, b) => {
        if (a.role === b.role) {
          return a.email.localeCompare(b.email);
        }

        if (a.role === 'admin') {
          return -1;
        }

        if (b.role === 'admin') {
          return 1;
        }

        if (a.role === 'blocked') {
          return 1;
        }

        if (b.role === 'blocked') {
          return -1;
        }

        return 0;
      });
  }, [controlsVersion, snapshotUsers]);

  if (role !== 'admin') {
    return (
      <section aria-label="users-page" className="min-h-[320px] rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">{t('usersPageTitle')}</h2>
        <p className="mt-3 text-sm text-amber-700">{t('usersPageAdminOnly')}</p>
        <Link className="mt-4 inline-flex text-sm text-slate-700 underline" to="/recipes">
          {t('backToRecipes')}
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="users-page" className="min-h-[320px] rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-slate-900">{t('usersPageTitle')}</h2>
      <p className="mt-1 text-sm text-slate-600">{t('usersPageSubtitle')}</p>

      <div className="mt-4 space-y-2">
        {users.map((entry) => {
          const roleLabel = entry.role === 'admin'
            ? t('roleAdmin')
            : entry.role === 'blocked'
              ? t('roleBlocked')
              : t('roleRegistered');

          return (
            <div
              key={`users-page-${entry.id}`}
              className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{entry.email || entry.id}</p>
                <p className="text-xs text-slate-600">{roleLabel}</p>
              </div>

              <button
                type="button"
                className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                onClick={() => openPublicUserCard(entry.id, entry.role === 'admin' ? 'admin' : 'registered')}
              >
                {t('openUserCard')}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
