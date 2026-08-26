import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import { useLanguage } from '../../i18n/useLanguage';

type AuthTab = 'login' | 'register' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoggedIn: () => void;
}

export function AuthModal({ isOpen, onClose, onLoggedIn }: AuthModalProps) {
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
      setTab('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
      setErrorMessage(error.message || t('authGenericError'));
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
      setErrorMessage(error.message || t('authGenericError'));
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
      setErrorMessage(error.message || t('authGenericError'));
      return;
    }

    setSuccessMessage(t('authResetEmailSent'));
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