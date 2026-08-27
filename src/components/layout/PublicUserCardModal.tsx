import { useEffect, useMemo, useState } from 'react';
import { readUserAdminControls } from '../../auth/userAdminControls';
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
  const [selectedUserId, setSelectedUserId] = useState('');
  const [profilesVersion, setProfilesVersion] = useState(0);
  const [controlsVersion, setControlsVersion] = useState(0);
  const [isRecipesModalOpen, setIsRecipesModalOpen] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
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
            {t('cancel')}
          </button>
        </div>

        <div className="space-y-3 text-sm text-slate-700">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            {selectedUser.profilePhotoDataUrl ? (
              <img
                alt={selectedUser.fullName || selectedUser.email || selectedUser.id}
                className="mb-3 h-20 w-20 rounded-full border border-slate-200 object-cover"
                src={selectedUser.profilePhotoDataUrl}
              />
            ) : null}
            <p className="font-medium text-slate-900">{selectedUser.fullName || selectedUser.email || selectedUser.id}</p>
            {selectedUser.fullName && selectedUser.email ? <p className="text-xs text-slate-600">{selectedUser.email}</p> : null}
            {selectedUser.role === 'admin' ? (
              <p className="mt-1 text-xs text-slate-500">{t('profileFieldUserId')}: {selectedUser.id}</p>
            ) : null}
          </div>

          {selectedUser.phone ? <p className="text-xs text-slate-600">{t('profileFieldPhone')}: {selectedUser.phone}</p> : null}
          {selectedUser.city ? <p className="text-xs text-slate-600">{t('profileFieldCity')}: {selectedUser.city}</p> : null}
          {selectedUser.bio ? <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">{selectedUser.bio}</p> : null}
          {selectedUser.isBlocked || selectedUser.isDeleted ? (
            <p className="text-xs text-rose-700">{selectedUser.isDeleted ? t('deleteUser') : t('userStatusBlocked')}</p>
          ) : null}

          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            onClick={handleOpenRecipesModal}
          >
            {t('userAllRecipesButton')}
          </button>
        </div>
      </div>

      {isRecipesModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/75 p-4" onClick={() => setIsRecipesModalOpen(false)}>
          <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h5 className="text-base font-semibold text-slate-900">{t('userRecipesModalTitle')}</h5>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
                onClick={() => setIsRecipesModalOpen(false)}
              >
                {t('cancel')}
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

                  return (
                    <div key={`user-recipe-${recipe.id}`} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-sm font-medium text-slate-900">{localizedRecipe.title}</p>
                      <p className="text-xs text-slate-600">{localizedRecipe.description}</p>
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
