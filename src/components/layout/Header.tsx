import { NavLink } from 'react-router-dom';
import { canCreateRecipe } from '../../auth/roles';
import { useUserRole } from '../../auth/useUserRole';
import { useLanguage } from '../../i18n/useLanguage';
import { LanguageToggle } from './LanguageToggle';
import { UserRoleToggle } from './UserRoleToggle';

export function Header() {
  const { t } = useLanguage();
  const { role } = useUserRole();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-sm font-medium text-slate-900'
      : 'text-sm font-medium text-slate-500 transition-colors hover:text-slate-900';

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">{t('appTitle')}</h1>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4" aria-label={t('navAria')}>
          <NavLink to="/" end className={linkClass}>
            {t('navHome')}
          </NavLink>
          <NavLink to="/recipes" className={linkClass}>
            {t('navRecipes')}
          </NavLink>
          {canCreateRecipe(role) && (
            <NavLink to="/recipes/new" className={linkClass}>
              {t('navAddRecipe')}
            </NavLink>
          )}
          </nav>
          <UserRoleToggle />
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
