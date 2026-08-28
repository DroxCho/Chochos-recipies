import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { canCreateRecipe } from '../../auth/roles';
import { useUserRole } from '../../auth/useUserRole';
import { useLanguage } from '../../i18n/useLanguage';
import { getSupabaseClient } from '../../lib/supabase';
import { AuthModal } from './AuthModal';
import { LanguageToggle } from './LanguageToggle';
import { UserRoleToggle } from './UserRoleToggle';

const ProfilePage = lazy(async () => {
  const module = await import('../../pages/ProfilePage');
  return { default: module.ProfilePage };
});

const PROFILE_STORAGE_KEY = 'recipes_user_profiles_v1';

function readUserProfilePhoto(userId: string | null | undefined): string {
  if (!userId || typeof window === 'undefined') {
    return '';
  }

  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    return '';
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, { profilePhotoDataUrl?: string }>;
    return parsed[userId]?.profilePhotoDataUrl ?? '';
  } catch {
    return '';
  }
}

export function Header() {
  const { t } = useLanguage();
  const { role, setRole, userId } = useUserRole();
  const isSignedIn = role !== 'visitor';
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profilePhotoDataUrl, setProfilePhotoDataUrl] = useState('');
  const authMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setProfilePhotoDataUrl(readUserProfilePhoto(userId));
  }, [userId]);

  useEffect(() => {
    function refreshProfilePhoto() {
      setProfilePhotoDataUrl(readUserProfilePhoto(userId));
    }

    window.addEventListener('storage', refreshProfilePhoto);
    window.addEventListener('profile-updated', refreshProfilePhoto);
    return () => {
      window.removeEventListener('storage', refreshProfilePhoto);
      window.removeEventListener('profile-updated', refreshProfilePhoto);
    };
  }, [userId]);

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

  useEffect(() => {
    if (!isProfileModalOpen) {
      return;
    }

    function handleEscClose(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileModalOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscClose);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscClose);
    };
  }, [isProfileModalOpen]);

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
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:h-16 sm:flex-nowrap sm:justify-between sm:px-4">
        <h1 className="order-1 truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">{t('appTitle')}</h1>

        <nav className="order-3 flex w-full items-center gap-4 overflow-x-auto pb-1 text-sm sm:order-2 sm:w-auto sm:overflow-visible sm:pb-0" aria-label={t('navAria')}>
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

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:ml-0 sm:gap-4">
          {isSignedIn && (
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
          <div className="relative" ref={authMenuRef}>
            <button
              aria-expanded={isAuthMenuOpen}
              aria-haspopup="menu"
              aria-label={t('authMenuLabel')}
              className="instant-tooltip inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white text-base text-slate-700 transition-colors hover:bg-slate-50"
              data-tooltip={t('authMenuLabel')}
              onClick={() => setIsAuthMenuOpen((open) => !open)}
              type="button"
            >
              {profilePhotoDataUrl ? (
                <img
                  alt={t('authMenuLabel')}
                  className="h-full w-full object-cover"
                  src={profilePhotoDataUrl}
                />
              ) : (
                '👤'
              )}
            </button>

            {isAuthMenuOpen && (
              <div className="absolute left-0 top-full z-30 mt-2 w-[min(16rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md sm:left-auto sm:right-0 sm:min-w-[140px] sm:w-auto" role="menu">
                {isSignedIn && (
                  <button
                    className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileModalOpen(true);
                      setIsAuthMenuOpen(false);
                    }}
                    role="menuitem"
                    type="button"
                  >
                    {t('profileMenuLink')}
                  </button>
                )}
                {isSignedIn ? (
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
                ) : (
                  <>
                    <a
                      className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setAuthModalInitialTab('login');
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
                      onClick={(event) => {
                        event.preventDefault();
                        setAuthModalInitialTab('register');
                        setIsAuthModalOpen(true);
                        setIsAuthMenuOpen(false);
                      }}
                      role="menuitem"
                    >
                      {t('authTabRegister')}
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
          {role === 'visitor' ? (
            <button
              type="button"
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setAuthModalInitialTab('register');
                setIsAuthModalOpen(true);
              }}
            >
              {t('authTabRegister')}
            </button>
          ) : (
            <UserRoleToggle />
          )}
          <LanguageToggle />
        </div>
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalInitialTab}
        onClose={() => setIsAuthModalOpen(false)}
        onLoggedIn={() => {
          setRole('registered');
          setIsAuthModalOpen(false);
        }}
      />

      {isProfileModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('profileTitle')}
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label={t('cancel')}
              className="absolute right-3 top-3 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setIsProfileModalOpen(false)}
              type="button"
            >
              X
            </button>
            <Suspense fallback={<div className="p-6 text-sm text-slate-500">Зареждане...</div>}>
              <ProfilePage />
            </Suspense>
          </div>
        </div>
      )}
    </header>
  );
}
