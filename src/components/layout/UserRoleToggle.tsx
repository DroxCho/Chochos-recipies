import type { ChangeEvent } from 'react';
import { useUserRole } from '../../auth/useUserRole';
import type { UserRole } from '../../auth/roles';
import { useLanguage } from '../../i18n/useLanguage';

export function UserRoleToggle() {
  const { role, setRole } = useUserRole();
  const { t } = useLanguage();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    setRole(event.target.value as UserRole);
  }

  if (role !== 'admin') {
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
      </select>
    </label>
  );
}
