import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { canCreateRecipe } from '../../auth/roles';
import { useUserRole } from '../../auth/useUserRole';
import { useLanguage } from '../../i18n/useLanguage';
import { getSupabaseClient } from '../../lib/supabase';
import { AuthModal } from './AuthModal';
import { LanguageToggle } from './LanguageToggle';
import { UserRoleToggle } from './UserRoleToggle';

export function Header() {
  const { t } = useLanguage();
  const { role, setRole } = useUserRole();
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const authMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAuthMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!authMenuRef.current?.contains(event.target as Node)) {
        setIsAuthMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAuthMenuOpen]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-sm font-medium text-slate-900'
      : 'text-sm font-medium text-slate-500 transition-colors hover:text-slate-900';

  async function handleLogout() {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }

    setRole('visitor');
    setIsAuthMenuOpen(false);
  }

  return (
    <header className="rustic-header border-b border-slate-200 bg-white">
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
          {(role === 'registered' || role === 'admin') && (
            <NavLink
              aria-label={t('navFavorites')}
              className={({ isActive }) =>
                isActive
                  ? 'instant-tooltip inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-base text-rose-600'
                  : 'instant-tooltip inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-base text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-600'
              }
              to="/favorites"
              data-tooltip={t('navFavorites')}
            >
              {'\u2665'}
            </NavLink>
          )}
          {canCreateRecipe(role) && (
            <NavLink to="/recipes/new" className={linkClass}>
              {t('navAddRecipe')}
            </NavLink>
          )}
          </nav>
          <div className="relative" ref={authMenuRef}>
            <button
              aria-expanded={isAuthMenuOpen}
              aria-haspopup="menu"
              aria-label={t('authMenuLabel')}
              className="instant-tooltip inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-base text-slate-700 transition-colors hover:bg-slate-50"
              data-tooltip={t('authMenuLabel')}
              onClick={() => setIsAuthMenuOpen((open) => !open)}
              type="button"
            >
              👤
            </button>

            {isAuthMenuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 min-w-[140px] rounded-md border border-slate-200 bg-white p-1 shadow-md" role="menu">
                <a
                  className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setIsAuthModalOpen(true);
                    setIsAuthMenuOpen(false);
                  }}
                  role="menuitem"
                >
                  {t('loginLink')}
                </a>
                <a
                  className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  href="#"
                  onClick={async (event) => {
                    event.preventDefault();
                    await handleLogout();
                  }}
                  role="menuitem"
                >
                  {t('logoutLink')}
                </a>
              </div>
            )}
          </div>
          <UserRoleToggle />
          <LanguageToggle />
        </div>
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoggedIn={() => {
          setRole('registered');
          setIsAuthModalOpen(false);
        }}
      />
    </header>
  );
}
