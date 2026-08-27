import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import { useLanguage } from '../../i18n/useLanguage';

type AuthTab = 'login' | 'register' | 'reset';
type OAuthProvider = 'google' | 'apple' | 'facebook' | 'github';
const SHOW_SOCIAL_LOGIN_OPTIONS = false;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoggedIn: () => void;
  initialTab?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, onLoggedIn, initialTab = 'login' }: AuthModalProps) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setTab(initialTab);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTab(initialTab);
  }, [initialTab, isOpen]);

  const tabTitle = useMemo(() => {
    if (tab === 'register') {
      return t('authTabRegister');
    }

    if (tab === 'reset') {
      return t('authTabReset');
    }

    return t('authTabLogin');
  }, [tab, t]);

  const showRegisterSuccessOnly = tab === 'register' && Boolean(successMessage);

  if (!isOpen) {
    return null;
  }

  function mapAuthErrorMessage(rawMessage: string | null | undefined): string {
    const message = rawMessage?.trim();
    if (!message) {
      return t('authGenericError');
    }

    const normalized = message.toLowerCase();
    if (normalized.includes('unsupported provider') || normalized.includes('provider is not enabled')) {
      return t('authProviderNotEnabled');
    }

    return message;
  }

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMessage(t('authUnavailable'));
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(mapAuthErrorMessage(error.message));
      return;
    }

    onLoggedIn();
  }

  async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage(t('authPasswordMismatch'));
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMessage(t('authUnavailable'));
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(mapAuthErrorMessage(error.message));
      return;
    }

    setSuccessMessage(t('authRegisterEmailSent'));
  }

  async function handleResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMessage(t('authUnavailable'));
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/`,
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(mapAuthErrorMessage(error.message));
      return;
    }

    setSuccessMessage(t('authResetEmailSent'));
  }

  async function handleOAuthLogin(provider: OAuthProvider) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMessage(t('authUnavailable'));
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(mapAuthErrorMessage(error.message));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4" onClick={onClose}>
      <div
        aria-label={t('authModalTitle')}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {!showRegisterSuccessOnly && (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{t('authModalTitle')}</p>
                <h2 className="text-xl font-semibold text-slate-900">{tabTitle}</h2>
              </div>
              <button
                aria-label={t('cancel')}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-600"
                onClick={onClose}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              <button
                className={`rounded-md px-3 py-1.5 text-sm ${tab === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
                onClick={() => setTab('login')}
                type="button"
              >
                {t('authTabLogin')}
              </button>
              <button
                className={`rounded-md px-3 py-1.5 text-sm ${tab === 'register' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
                onClick={() => setTab('register')}
                type="button"
              >
                {t('authTabRegister')}
              </button>
            </div>
          </>
        )}

        {showRegisterSuccessOnly && successMessage && <p className="text-sm text-emerald-700">{successMessage}</p>}

        {!showRegisterSuccessOnly && tab === 'login' && (
          <form className="space-y-3" onSubmit={handleLoginSubmit}>
            <label className="block text-sm text-slate-700">
              {t('authEmailLabel')}
              <input
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="block text-sm text-slate-700">
              {t('authPasswordLabel')}
              <input
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            <button
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? t('saving') : t('authLoginButton')}
            </button>
            {SHOW_SOCIAL_LOGIN_OPTIONS && (
              <>
                <p className="pt-1 text-center text-xs text-slate-500">{t('authOrContinueWith')}</p>
                <div className="space-y-2">
                  <button
                    className="relative inline-flex w-full items-center justify-center rounded-md bg-[#1877F2] px-3 py-3 text-base font-semibold text-white transition-colors hover:bg-[#166FE5] disabled:opacity-60"
                    disabled={isSubmitting}
                    onClick={() => {
                      void handleOAuthLogin('facebook');
                    }}
                    type="button"
                  >
                    <span aria-hidden="true" className="absolute left-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1877F2]">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                        <path d="M14 8h-1.5c-1 0-1.5.4-1.5 1.5V11H14l-.5 3H11v7H8v-7H5v-3h3V9c0-2.4 1.4-4 4.2-4H14v3z" />
                      </svg>
                    </span>
                    {t('authLoginFacebook')}
                  </button>
                  <button
                    className="relative inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-3 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-60"
                    disabled={isSubmitting}
                    onClick={() => {
                      void handleOAuthLogin('google');
                    }}
                    type="button"
                  >
                    <span aria-hidden="true" className="absolute left-3 inline-flex h-8 w-8 items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                        <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.5-5.4 3.5-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 2.9 14.5 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12z" />
                        <path fill="#34A853" d="M2.8 11.2c0 1.6.6 3.1 1.6 4.2l3.1-2.4c-.4-.6-.6-1.2-.6-1.8s.2-1.2.6-1.8L4.4 7C3.4 8.1 2.8 9.6 2.8 11.2z" />
                        <path fill="#FBBC05" d="M12 20.4c2.5 0 4.6-.8 6.2-2.3l-3-2.3c-.8.5-1.8.8-3.2.8-2.5 0-4.6-1.7-5.3-3.9l-3.1 2.4c1.6 3.1 4.8 5.3 8.4 5.3z" />
                        <path fill="#4285F4" d="M21.2 11.8c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.2 1.1-.9 2-2 2.7l3 2.3c1.8-1.7 2.8-4.1 2.8-7.3z" />
                      </svg>
                    </span>
                    {t('authLoginGoogle')}
                  </button>
                  <button
                    className="relative inline-flex w-full items-center justify-center rounded-md bg-black px-3 py-3 text-base font-semibold text-white transition-colors hover:bg-slate-900 disabled:opacity-60"
                    disabled={isSubmitting}
                    onClick={() => {
                      void handleOAuthLogin('apple');
                    }}
                    type="button"
                  >
                    <span aria-hidden="true" className="absolute left-3 inline-flex h-8 w-8 items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                        <path d="M17.57 12.62c-.02-2.1 1.72-3.1 1.8-3.15-.98-1.43-2.5-1.63-3.03-1.65-1.29-.13-2.52.76-3.18.76-.67 0-1.69-.74-2.77-.72-1.42.02-2.74.83-3.47 2.1-1.49 2.57-.38 6.37 1.07 8.47.71 1.03 1.56 2.18 2.67 2.14 1.06-.04 1.46-.68 2.74-.68 1.28 0 1.63.68 2.76.66 1.14-.02 1.85-1.03 2.56-2.06.82-1.19 1.16-2.35 1.18-2.41-.03-.01-2.25-.86-2.27-3.46z" />
                        <path d="M15.72 6.63c.59-.71 1-1.7.89-2.68-.85.03-1.89.56-2.5 1.26-.56.63-1.05 1.64-.92 2.6.95.07 1.93-.48 2.53-1.18z" />
                      </svg>
                    </span>
                    {t('authLoginApple')}
                  </button>
                  <button
                    className="relative inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-3 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-60"
                    disabled={isSubmitting}
                    onClick={() => {
                      void handleOAuthLogin('github');
                    }}
                    type="button"
                  >
                    <span aria-hidden="true" className="absolute left-3 inline-flex h-8 w-8 items-center justify-center text-slate-900">
                      <svg viewBox="0 0 16 16" className="h-6 w-6" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
                      </svg>
                    </span>
                    {t('authLoginGithub')}
                  </button>
                </div>
              </>
            )}
            <button
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              onClick={() => setTab('reset')}
              type="button"
            >
              {t('authForgotPasswordLink')}
            </button>
          </form>
        )}

        {!showRegisterSuccessOnly && tab === 'register' && (
          <form className="space-y-3" onSubmit={handleRegisterSubmit}>
            <label className="block text-sm text-slate-700">
              {t('authEmailLabel')}
              <input
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="block text-sm text-slate-700">
              {t('authPasswordLabel')}
              <input
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            <label className="block text-sm text-slate-700">
              {t('authConfirmPasswordLabel')}
              <input
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                minLength={6}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </label>
            <button
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? t('saving') : t('authRegisterButton')}
            </button>
          </form>
        )}

        {!showRegisterSuccessOnly && tab === 'reset' && (
          <form className="space-y-3" onSubmit={handleResetSubmit}>
            <label className="block text-sm text-slate-700">
              {t('authEmailLabel')}
              <input
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <button
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? t('saving') : t('authResetButton')}
            </button>
          </form>
        )}

        {!showRegisterSuccessOnly && errorMessage && <p className="mt-3 text-sm text-rose-700">{errorMessage}</p>}
        {!showRegisterSuccessOnly && successMessage && <p className="mt-3 text-sm text-emerald-700">{successMessage}</p>}
      </div>
    </div>
  );
}