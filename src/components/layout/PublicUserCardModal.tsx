import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUserRole } from '../../auth/useUserRole';
import { readUserAdminControls, writeUserAdminControls } from '../../auth/userAdminControls';
import { deleteRecipeById } from '../../data/recipes';
import { fetchRecipes } from '../../data/recipes';
import supabaseUsersSnapshot from '../../data/supabaseUsersSnapshot.json';
import { getLocalizedRecipe } from '../../i18n/recipeContent';
import { useLanguage } from '../../i18n/useLanguage';
import { CLOSE_PUBLIC_USER_CARD_EVENT, OPEN_PUBLIC_USER_CARD_EVENT, closePublicUserCard } from '../../lib/publicUserCard';
import { getUserProfileLinkId } from '../../lib/userDisplay';
import type { Recipe } from '../../types/recipe';

const PROFILE_STORAGE_KEY = 'recipes_user_profiles_v1';

interface SnapshotUser {
  id: string;
  email: string | null;
  role?: string;
}

interface LocalProfile {
  fullName?: string;
  phone?: string;
  city?: string;
  bio?: string;
  profilePhotoDataUrl?: string;
}

type LocalProfilesMap = Record<string, LocalProfile>;

interface UserCardSummary {
  id: string;
  email: string;
  role: 'registered' | 'admin';
  fullName: string;
  phone: string;
  city: string;
  bio: string;
  profilePhotoDataUrl: string;
  isBlocked: boolean;
  isDeleted: boolean;
}

interface OpenPublicUserCardEventDetail {
  userId: string;
}

function normalizeRole(value: unknown): 'registered' | 'admin' {
  return value === 'admin' ? 'admin' : 'registered';
}

function readProfiles(): LocalProfilesMap {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as LocalProfilesMap;
  } catch {
    return {};
  }
}

export function PublicUserCardModal() {
  const { t, language } = useLanguage();
  const { role } = useUserRole();
  const location = useLocation();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [profilesVersion, setProfilesVersion] = useState(0);
  const [controlsVersion, setControlsVersion] = useState(0);
  const [isRecipesModalOpen, setIsRecipesModalOpen] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);
  const [isDeletingAllRecipes, setIsDeletingAllRecipes] = useState(false);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const snapshotUsers = useMemo(
    () => ((supabaseUsersSnapshot as { users?: SnapshotUser[] }).users ?? []),
    [],
  );

  useEffect(() => {
    function handleOpen(event: Event) {
      const typedEvent = event as CustomEvent<OpenPublicUserCardEventDetail>;
      const userId = typedEvent.detail?.userId?.trim() ?? '';
      if (userId) {
        setSelectedUserId(userId);
        setIsRecipesModalOpen(false);
      }
    }

    function handleClose() {
      setSelectedUserId('');
      setIsRecipesModalOpen(false);
    }

    function handleStorage(event: StorageEvent) {
      if (!event.key) {
        return;
      }

      if (event.key === PROFILE_STORAGE_KEY) {
        setProfilesVersion((current) => current + 1);
      }

      if (event.key === 'recipes_user_admin_controls_v1') {
        setControlsVersion((current) => current + 1);
      }
    }

    function handleProfileUpdated() {
      setProfilesVersion((current) => current + 1);
    }

    function handleControlsUpdated() {
      setControlsVersion((current) => current + 1);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (isRecipesModalOpen) {
          setIsRecipesModalOpen(false);
          return;
        }

        setSelectedUserId('');
      }
    }

    window.addEventListener(OPEN_PUBLIC_USER_CARD_EVENT, handleOpen as EventListener);
    window.addEventListener(CLOSE_PUBLIC_USER_CARD_EVENT, handleClose);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('profile-updated', handleProfileUpdated);
    window.addEventListener('user-controls-updated', handleControlsUpdated);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener(OPEN_PUBLIC_USER_CARD_EVENT, handleOpen as EventListener);
      window.removeEventListener(CLOSE_PUBLIC_USER_CARD_EVENT, handleClose);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('profile-updated', handleProfileUpdated);
      window.removeEventListener('user-controls-updated', handleControlsUpdated);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isRecipesModalOpen]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) {
      return null;
    }

    void profilesVersion;
    void controlsVersion;

    const profiles = readProfiles();
    const controls = readUserAdminControls();
    const snapshotUser = snapshotUsers.find((entry) => entry.id === selectedUserId);
    const profile = profiles[selectedUserId];
    const control = controls[selectedUserId];

    return {
      id: selectedUserId,
      email: snapshotUser?.email ?? '',
      role: normalizeRole(control?.role ?? snapshotUser?.role),
      fullName: profile?.fullName?.trim() ?? '',
      phone: profile?.phone?.trim() ?? '',
      city: profile?.city?.trim() ?? '',
      bio: profile?.bio?.trim() ?? '',
      profilePhotoDataUrl: profile?.profilePhotoDataUrl ?? '',
      isBlocked: Boolean(control?.blocked),
      isDeleted: Boolean(control?.deleted),
    } satisfies UserCardSummary;
  }, [controlsVersion, profilesVersion, selectedUserId, snapshotUsers]);

  if (!selectedUser) {
    return null;
  }

  async function handleOpenRecipesModal() {
    if (!selectedUser) {
      return;
    }

    setIsLoadingRecipes(true);
    setIsRecipesModalOpen(true);

    try {
      const allRecipes = await fetchRecipes();
      const filteredRecipes = allRecipes.filter(
        (recipe) => getUserProfileLinkId(recipe.ownerId, recipe.ownerRole) === selectedUser.id,
      );
      setUserRecipes(filteredRecipes);
    } catch {
      setUserRecipes([]);
    } finally {
      setIsLoadingRecipes(false);
    }
  }

  async function handleDeleteRecipe(recipeId: string) {
    if (role !== 'admin' || deletingRecipeId || isDeletingAllRecipes) {
      return;
    }

    if (!window.confirm(t('deleteRecipeConfirm'))) {
      return;
    }

    setDeletingRecipeId(recipeId);

    try {
      await deleteRecipeById(recipeId);
      setUserRecipes((current) => current.filter((recipe) => recipe.id !== recipeId));
    } finally {
      setDeletingRecipeId(null);
    }
  }

  async function handleDeleteAllUserRecipes() {
    if (role !== 'admin' || isDeletingAllRecipes || userRecipes.length === 0) {
      return;
    }

    if (!window.confirm(t('deleteAllUserRecipesConfirm'))) {
      return;
    }

    setIsDeletingAllRecipes(true);

    try {
      for (const recipe of userRecipes) {
        await deleteRecipeById(recipe.id);
      }
      setUserRecipes([]);
    } finally {
      setIsDeletingAllRecipes(false);
    }
  }

  function updateSelectedUserControl(
    updater: (entry: { role?: 'registered' | 'admin'; blocked?: boolean; deleted?: boolean }) => {
      role?: 'registered' | 'admin';
      blocked?: boolean;
      deleted?: boolean;
    },
  ) {
    if (!selectedUser) {
      return;
    }

    const current = readUserAdminControls();
    const nextEntry = updater(current[selectedUser.id] ?? {});
    const next = {
      ...current,
      [selectedUser.id]: nextEntry,
    };

    writeUserAdminControls(next);
  }

  function handleDeleteUser() {
    updateSelectedUserControl((entry) => ({
      ...entry,
      deleted: true,
      blocked: true,
    }));
  }

  function handleRoleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextRole = event.target.value as 'registered' | 'admin' | 'blocked';

    updateSelectedUserControl((entry) => {
      if (nextRole === 'blocked') {
        return {
          ...entry,
          role: 'registered',
          blocked: true,
          deleted: false,
        };
      }

      return {
        ...entry,
        role: nextRole,
        blocked: false,
        deleted: false,
      };
    });
  }

  const selectedRole = selectedUser.isBlocked ? 'blocked' : selectedUser.role;
  const selectedRoleLabel = selectedRole === 'admin'
    ? t('roleAdmin')
    : selectedRole === 'blocked'
      ? t('roleBlocked')
      : t('roleRegistered');

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/70 p-4" onClick={() => closePublicUserCard()}>
      <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-base font-semibold text-slate-900">{t('userCardDetailsTitle')}</h4>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
            onClick={() => closePublicUserCard()}
          >
            Х
          </button>
        </div>

        <div className="space-y-3 text-sm text-slate-700">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-start gap-3">
              {selectedUser.profilePhotoDataUrl ? (
                <div className="relative inline-flex">
                  <img
                    alt={selectedUser.fullName || selectedUser.email || selectedUser.id}
                    className="h-20 w-20 rounded-full border border-slate-200 object-cover"
                    src={selectedUser.profilePhotoDataUrl}
                  />
                  {selectedUser.isBlocked ? (
                    <span
                      aria-label={t('userStatusBlocked')}
                      className="instant-tooltip absolute right-0 top-0 inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-300/70 bg-rose-400/60 text-sm text-white"
                      data-tooltip={t('userStatusBlocked')}
                    >
                      🔒
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{selectedUser.fullName || selectedUser.email || selectedUser.id}</p>
                {selectedUser.fullName && selectedUser.email ? <p className="text-xs text-slate-600">{selectedUser.email}</p> : null}

                <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <span>{t('profileRoleLabel')}:</span>
                  {role === 'admin' ? (
                    <select
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                      onChange={handleRoleChange}
                      value={selectedRole}
                    >
                      <option value="registered">{t('roleRegistered')}</option>
                      <option value="admin">{t('roleAdmin')}</option>
                      <option value="blocked">{t('roleBlocked')}</option>
                    </select>
                  ) : (
                    <span className="text-xs text-slate-700">{selectedRoleLabel}</span>
                  )}
                </div>
              </div>
            </div>

            {role === 'admin' && selectedUser.role === 'admin' ? (
              <p className="mt-1 text-xs text-slate-500">{t('profileFieldUserId')}: {selectedUser.id}</p>
            ) : null}
          </div>

          {selectedUser.phone ? <p className="text-xs text-slate-600">{t('profileFieldPhone')}: {selectedUser.phone}</p> : null}
          {selectedUser.city ? <p className="text-xs text-slate-600">{t('profileFieldCity')}: {selectedUser.city}</p> : null}
          {selectedUser.bio ? <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">{selectedUser.bio}</p> : null}
          {selectedUser.isBlocked || selectedUser.isDeleted ? (
            <p className="text-xs text-rose-700">{selectedUser.isDeleted ? t('deleteUser') : t('userStatusBlocked')}</p>
          ) : null}

          {role === 'admin' ? (
            <div className="flex justify-center gap-2">
              <button
                type="button"
                className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100"
                onClick={handleDeleteUser}
              >
                {t('deleteUser')}
              </button>
            </div>
          ) : null}

          <div className="flex justify-center">
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              onClick={handleOpenRecipesModal}
            >
              {t('userAllRecipesButton')}
            </button>
          </div>
        </div>
      </div>

      {isRecipesModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/75 p-4" onClick={() => setIsRecipesModalOpen(false)}>
          <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h5 className="text-base font-semibold text-slate-900">{t('userRecipesModalTitle')}</h5>
                {role === 'admin' ? (
                  <button
                    type="button"
                    className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => void handleDeleteAllUserRecipes()}
                    disabled={isDeletingAllRecipes || userRecipes.length === 0}
                  >
                    {isDeletingAllRecipes ? '…' : t('deleteAllUserRecipes')}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
                onClick={() => setIsRecipesModalOpen(false)}
              >
                Х
              </button>
            </div>

            {isLoadingRecipes ? <p className="text-sm text-slate-500">{t('loadingGeneric')}</p> : null}

            {!isLoadingRecipes && userRecipes.length === 0 ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{t('noUserRecipes')}</p>
            ) : null}

            {!isLoadingRecipes && userRecipes.length > 0 ? (
              <div className="max-h-[55vh] space-y-2 overflow-y-auto">
                {userRecipes.map((recipe) => {
                  const localizedRecipe = getLocalizedRecipe(recipe, language);
                  const recipeImage = recipe.photoUrls?.[0]?.trim();
                  const recipePath = `/recipes/${recipe.id}${location.search ? location.search : ''}`;

                  return (
                    <div key={`user-recipe-${recipe.id}`} className="relative">
                      <Link
                        className="flex items-stretch gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 pr-12 transition-colors hover:bg-slate-100"
                        to={recipePath}
                        onClick={() => {
                          setIsRecipesModalOpen(false);
                          closePublicUserCard();
                        }}
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                          {recipeImage ? (
                            <img
                              alt={localizedRecipe.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              src={recipeImage}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-slate-500">
                              {t('noPhotoPlaceholder')}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">{localizedRecipe.title}</p>
                          <p className="text-xs text-slate-600">{localizedRecipe.description}</p>
                        </div>
                      </Link>

                      {role === 'admin' ? (
                        <button
                          type="button"
                          aria-label={t('deleteRecipe')}
                          className="instant-tooltip absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-300 bg-white text-base font-bold leading-none text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => void handleDeleteRecipe(recipe.id)}
                          disabled={deletingRecipeId === recipe.id}
                          data-tooltip={t('deleteRecipe')}
                        >
                          {deletingRecipeId === recipe.id ? '…' : '×'}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
