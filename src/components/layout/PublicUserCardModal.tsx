import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { WheelEvent as ReactWheelEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUserRole } from '../../auth/useUserRole';
import { readUserAdminControls, resolveManagedRole, writeUserAdminControls } from '../../auth/userAdminControls';
import { deleteRecipeById } from '../../data/recipes';
import { fetchRecipes } from '../../data/recipes';
import supabaseUsersSnapshot from '../../data/supabaseUsersSnapshot.json';
import { getLocalizedRecipe } from '../../i18n/recipeContent';
import { useLanguage } from '../../i18n/useLanguage';
import {
  CLOSE_PUBLIC_USER_CARD_EVENT,
  OPEN_PUBLIC_USER_CARD_EVENT,
  closePublicUserCard,
  openPublicUserCard,
} from '../../lib/publicUserCard';
import { getUserProfileLinkId } from '../../lib/userDisplay';
import type { Recipe } from '../../types/recipe';

const PROFILE_STORAGE_KEY = 'recipes_user_profiles_v1';
const PHOTO_EDITOR_PREVIEW_SIZE = 288;

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

interface ManagedUserSummary {
  id: string;
  email: string;
  role: 'registered' | 'admin' | 'blocked';
  alias: string;
  profilePhotoDataUrl: string;
}

function toTrimmedText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function InlineSpinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
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

function getFallbackName(fullName: unknown, email: unknown, id: string): string {
  const trimmedName = toTrimmedText(fullName);
  if (trimmedName) {
    return trimmedName;
  }

  const trimmedEmail = toTrimmedText(email);
  if (trimmedEmail) {
    const atIndex = trimmedEmail.indexOf('@');
    if (atIndex > 0) {
      return trimmedEmail.slice(0, atIndex);
    }

    return trimmedEmail;
  }

  return id;
}

function writeProfiles(value: LocalProfilesMap): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event('profile-updated'));
}

export function PublicUserCardModal() {
  const { t, language } = useLanguage();
  const { role } = useUserRole();
  const location = useLocation();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [profilesVersion, setProfilesVersion] = useState(0);
  const [controlsVersion, setControlsVersion] = useState(0);
  const [isRecipesModalOpen, setIsRecipesModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isEditingUserProfile, setIsEditingUserProfile] = useState(false);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [editorSourceUrl, setEditorSourceUrl] = useState('');
  const [editorZoom, setEditorZoom] = useState(1);
  const [editorNaturalSize, setEditorNaturalSize] = useState({ width: 0, height: 0 });
  const [editorImageSize, setEditorImageSize] = useState({ width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 });
  const [selectionSquare, setSelectionSquare] = useState({ x: 0, y: 0, size: 0 });
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [isApplyingPhotoEdit, setIsApplyingPhotoEdit] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    fullName: '',
    phone: '',
    city: '',
    bio: '',
    profilePhotoDataUrl: '',
  });
  const [profileSavedMessage, setProfileSavedMessage] = useState('');
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);
  const [isDeletingAllRecipes, setIsDeletingAllRecipes] = useState(false);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const previousEditorZoomRef = useRef(1);
  const editorPreviewRef = useRef<HTMLDivElement | null>(null);
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
        setIsUserManagementModalOpen(false);
      }
    }

    function handleClose() {
      setSelectedUserId('');
      setIsRecipesModalOpen(false);
      setIsUserManagementModalOpen(false);
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
        if (isPhotoEditorOpen) {
          setIsPhotoEditorOpen(false);
          return;
        }

        if (isUserManagementModalOpen) {
          setIsUserManagementModalOpen(false);
          return;
        }

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
  }, [isPhotoEditorOpen, isRecipesModalOpen, isUserManagementModalOpen]);

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function getImageRenderRect(width: number, height: number, zoomValue: number = 1) {
    if (!width || !height) {
      return { width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 };
    }

    const previewSize = editorPreviewRef.current?.clientWidth || PHOTO_EDITOR_PREVIEW_SIZE;
    const baseScale = Math.min(previewSize / width, previewSize / height);
    const scale = baseScale * clamp(zoomValue, 0.4, 3);
    const renderedWidth = width * scale;
    const renderedHeight = height * scale;

    return {
      width: renderedWidth,
      height: renderedHeight,
      scale,
      offsetX: (previewSize - renderedWidth) / 2,
      offsetY: (previewSize - renderedHeight) / 2,
    };
  }

  function initializeSelectionFromImage(width: number, height: number, zoomValue: number = editorZoom) {
    const rect = getImageRenderRect(width, height, zoomValue);
    const size = Math.min(200, rect.width, rect.height);

    setEditorImageSize(rect);
    setSelectionSquare({
      size,
      x: rect.offsetX + (rect.width - size) / 2,
      y: rect.offsetY + (rect.height - size) / 2,
    });
  }

  function clampSelectionPosition(x: number, y: number, size: number = selectionSquare.size) {
    const minX = editorImageSize.offsetX;
    const minY = editorImageSize.offsetY;
    const maxX = editorImageSize.offsetX + editorImageSize.width - size;
    const maxY = editorImageSize.offsetY + editorImageSize.height - size;

    return {
      x: clamp(x, minX, Math.max(minX, maxX)),
      y: clamp(y, minY, Math.max(minY, maxY)),
    };
  }

  function loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('photo-load-failed'));
      image.src = source;
    });
  }

  async function createSquareImage(
    source: string,
    selectionX: number,
    selectionY: number,
    selectionSize: number,
    zoomValue: number,
  ): Promise<string> {
    const image = await loadImage(source);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const renderRect = getImageRenderRect(width, height, zoomValue);
    const srcX = (selectionX - renderRect.offsetX) / renderRect.scale;
    const srcY = (selectionY - renderRect.offsetY) / renderRect.scale;
    const srcSize = selectionSize / renderRect.scale;

    const canvas = document.createElement('canvas');
    const outputSize = 1024;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('photo-canvas-failed');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, outputSize, outputSize);
    context.drawImage(image, srcX, srcY, srcSize, srcSize, 0, 0, outputSize, outputSize);

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  async function applyPhotoEdits() {
    const source = editorSourceUrl.trim();
    if (!source || selectionSquare.size <= 0) {
      return;
    }

    setIsApplyingPhotoEdit(true);

    try {
      const nextPhoto = await createSquareImage(
        source,
        selectionSquare.x,
        selectionSquare.y,
        selectionSquare.size,
        editorZoom,
      );
      setProfileDraft((current) => ({ ...current, profilePhotoDataUrl: nextPhoto }));
      setIsPhotoEditorOpen(false);
    } finally {
      setIsApplyingPhotoEdit(false);
    }
  }

  function handleEditorWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const zoomStep = 0.1;
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextZoom = clamp(Number((editorZoom + direction * zoomStep).toFixed(2)), 0.4, 3);

    if (nextZoom !== editorZoom) {
      setEditorZoom(nextZoom);
    }
  }

  function startCropDrag(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      startX: selectionSquare.x,
      startY: selectionSquare.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingSelection(true);
  }

  function moveCropDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingSelection || !dragStartRef.current) {
      return;
    }

    event.preventDefault();

    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;
    const next = clampSelectionPosition(dragStartRef.current.startX + deltaX, dragStartRef.current.startY + deltaY);
    setSelectionSquare((current) => ({ ...current, x: next.x, y: next.y }));
  }

  function endCropDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStartRef.current = null;
    setIsDraggingSelection(false);
  }

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
      fullName: toTrimmedText(profile?.fullName),
      phone: toTrimmedText(profile?.phone),
      city: toTrimmedText(profile?.city),
      bio: toTrimmedText(profile?.bio),
      profilePhotoDataUrl: profile?.profilePhotoDataUrl ?? '',
      isBlocked: Boolean(control?.blocked),
      isDeleted: Boolean(control?.deleted),
    } satisfies UserCardSummary;
  }, [controlsVersion, profilesVersion, selectedUserId, snapshotUsers]);

  useEffect(() => {
    setIsEditingUserProfile(false);
    setProfileSavedMessage('');
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedUser || role !== 'admin') {
      return;
    }

    setProfileDraft({
      fullName: getFallbackName(selectedUser.fullName, selectedUser.email, selectedUser.id),
      phone: selectedUser.phone,
      city: selectedUser.city,
      bio: selectedUser.bio,
      profilePhotoDataUrl: selectedUser.profilePhotoDataUrl,
    });
    setIsEditingUserProfile(true);
  }, [role, selectedUser]);

  useEffect(() => {
    if (!selectedUser || typeof window === 'undefined') {
      return;
    }

    const html = document.documentElement;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverflow = html.style.overflow;
    const previousHtmlOverscroll = html.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      html.style.overflow = previousHtmlOverflow;
      html.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [selectedUser]);

  const managedUsers = useMemo(() => {
    if (role !== 'admin') {
      return [] as ManagedUserSummary[];
    }

    void controlsVersion;

    const controls = readUserAdminControls();
    const profiles = readProfiles();

    return snapshotUsers
      .map((entry) => {
        const managedRole = resolveManagedRole(controls[entry.id]);
        const effectiveRole = managedRole ?? normalizeRole(entry.role);
        const profile = profiles[entry.id];
        const alias = getFallbackName(profile?.fullName, entry.email, entry.id);

        return {
          id: entry.id,
          email: entry.email ?? '',
          role: effectiveRole,
          alias,
          profilePhotoDataUrl: profile?.profilePhotoDataUrl ?? '',
        } satisfies ManagedUserSummary;
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
  }, [controlsVersion, role, snapshotUsers]);

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

  function handleStartEditUserProfile() {
    if (!selectedUser || role !== 'admin') {
      return;
    }

    setProfileDraft({
      fullName: selectedUser.fullName,
      phone: selectedUser.phone,
      city: selectedUser.city,
      bio: selectedUser.bio,
      profilePhotoDataUrl: selectedUser.profilePhotoDataUrl,
    });
    setProfileSavedMessage('');
    setIsEditingUserProfile(true);
  }

  function handleSaveUserProfile() {
    if (!selectedUser || role !== 'admin') {
      return;
    }

    const profiles = readProfiles();
    profiles[selectedUser.id] = {
      fullName: profileDraft.fullName.trim(),
      phone: profileDraft.phone.trim(),
      city: profileDraft.city.trim(),
      bio: profileDraft.bio.trim(),
      profilePhotoDataUrl: profileDraft.profilePhotoDataUrl || undefined,
    };

    writeProfiles(profiles);
    setIsEditingUserProfile(true);
    setProfileSavedMessage(t('profileSaveSuccess'));
  }

  function handleProfilePhotoSelect(file: File | null) {
    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        return;
      }

      setEditorSourceUrl(result);
      setEditorZoom(1);
      previousEditorZoomRef.current = 1;
      setEditorNaturalSize({ width: 0, height: 0 });
      setEditorImageSize({ width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 });
      setSelectionSquare({ x: 0, y: 0, size: 0 });
      setIsPhotoEditorOpen(true);
    };
    reader.readAsDataURL(file);
  }

  function openPhotoEditor() {
    const source = profileDraft.profilePhotoDataUrl.trim();
    if (!source) {
      return;
    }

    setEditorSourceUrl(source);
    setEditorZoom(1);
    previousEditorZoomRef.current = 1;
    setEditorNaturalSize({ width: 0, height: 0 });
    setEditorImageSize({ width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 });
    setSelectionSquare({ x: 0, y: 0, size: 0 });
    setIsPhotoEditorOpen(true);
  }

  useEffect(() => {
    if (!isPhotoEditorOpen || selectionSquare.size <= 0) {
      return;
    }

    const next = clampSelectionPosition(selectionSquare.x, selectionSquare.y);
    if (next.x !== selectionSquare.x || next.y !== selectionSquare.y) {
      setSelectionSquare((current) => ({ ...current, x: next.x, y: next.y }));
    }
  }, [isPhotoEditorOpen, editorImageSize.width, editorImageSize.height, selectionSquare.size]);

  useEffect(() => {
    if (!isPhotoEditorOpen || !editorNaturalSize.width || !editorNaturalSize.height) {
      return;
    }

    const previousZoom = previousEditorZoomRef.current;

    if (selectionSquare.size <= 0) {
      initializeSelectionFromImage(editorNaturalSize.width, editorNaturalSize.height, editorZoom);
      previousEditorZoomRef.current = editorZoom;
      return;
    }

    const previousRect = getImageRenderRect(editorNaturalSize.width, editorNaturalSize.height, previousZoom);
    const nextRect = getImageRenderRect(editorNaturalSize.width, editorNaturalSize.height, editorZoom);
    const centerX = selectionSquare.x + selectionSquare.size / 2;
    const centerY = selectionSquare.y + selectionSquare.size / 2;
    const sourceCenterX = (centerX - previousRect.offsetX) / previousRect.scale;
    const sourceCenterY = (centerY - previousRect.offsetY) / previousRect.scale;
    const nextCenterX = nextRect.offsetX + sourceCenterX * nextRect.scale;
    const nextCenterY = nextRect.offsetY + sourceCenterY * nextRect.scale;
    const nextSize = Math.min(selectionSquare.size, nextRect.width, nextRect.height);
    const nextX = nextCenterX - nextSize / 2;
    const nextY = nextCenterY - nextSize / 2;
    const minX = nextRect.offsetX;
    const minY = nextRect.offsetY;
    const maxX = nextRect.offsetX + nextRect.width - nextSize;
    const maxY = nextRect.offsetY + nextRect.height - nextSize;

    setEditorImageSize(nextRect);
    setSelectionSquare((current) => ({
      ...current,
      size: nextSize,
      x: clamp(nextX, minX, Math.max(minX, maxX)),
      y: clamp(nextY, minY, Math.max(minY, maxY)),
    }));
    previousEditorZoomRef.current = editorZoom;
  }, [editorZoom, isPhotoEditorOpen, editorNaturalSize.width, editorNaturalSize.height]);

  if (!selectedUser) {
    return null;
  }

  const selectedRole = selectedUser.isBlocked ? 'blocked' : selectedUser.role;
  const selectedRoleLabel = selectedRole === 'admin'
    ? t('roleAdmin')
    : selectedRole === 'blocked'
      ? t('roleBlocked')
      : t('roleRegistered');

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto overscroll-contain bg-slate-900/70 p-3 sm:items-center sm:p-4" onClick={() => closePublicUserCard()}>
      <div className="w-full max-w-lg max-h-[calc(100vh-1.5rem)] overflow-y-auto overscroll-contain rounded-xl bg-white p-4 shadow-xl touch-pan-y sm:max-h-[calc(100vh-2rem)]" onClick={(event) => event.stopPropagation()}>
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
                    alt={selectedUser.fullName || selectedUser.id}
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
                <p className="font-medium text-slate-900">{selectedUser.fullName || selectedUser.id}</p>
                <p className={`text-xs ${selectedUser.isBlocked || selectedUser.isDeleted ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {t('userStatusLabel')}: {selectedUser.isDeleted ? t('deleteUser') : selectedUser.isBlocked ? t('userStatusBlocked') : t('userStatusActive')}
                </p>

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

                <a
                  href="#"
                  className="mt-2 inline-block text-xs text-slate-700 underline underline-offset-2 hover:text-slate-900"
                  onClick={(event) => {
                    event.preventDefault();
                    void handleOpenRecipesModal();
                  }}
                >
                  {t('userAllRecipesButton')}
                </a>

                {role === 'admin' ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                      onClick={() => {
                        setIsRecipesModalOpen(false);
                        setIsUserManagementModalOpen(true);
                      }}
                    >
                      {t('adminUserManagementTitle')}
                    </button>

                    <button
                      type="button"
                      className="mt-2 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100"
                      onClick={handleDeleteUser}
                    >
                      {t('deleteUser')}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {role === 'admin' ? (
              <p className="mt-1 text-xs text-slate-500">{t('profileFieldUserId')}: {selectedUser.id}</p>
            ) : null}
          </div>

          {role === 'admin' ? (
            !isEditingUserProfile ? (
              <>
                <p className="text-xs text-slate-600">{t('profileFieldPhone')}: {selectedUser.phone || '-'}</p>
                <p className="text-xs text-slate-600">{t('profileFieldCity')}: {selectedUser.city || '-'}</p>
                <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">{t('profileFieldBio')}: {selectedUser.bio || '-'}</p>
              </>
            ) : null
          ) : (
            <>
              {selectedUser.phone ? <p className="text-xs text-slate-600">{t('profileFieldPhone')}: {selectedUser.phone}</p> : null}
              {selectedUser.city ? <p className="text-xs text-slate-600">{t('profileFieldCity')}: {selectedUser.city}</p> : null}
              {selectedUser.bio ? <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">{selectedUser.bio}</p> : null}
              {selectedUser.isBlocked || selectedUser.isDeleted ? (
                <p className="text-xs text-rose-700">{selectedUser.isDeleted ? t('deleteUser') : t('userStatusBlocked')}</p>
              ) : null}
            </>
          )}

          {role === 'admin' && profileSavedMessage ? (
            <p className="text-xs text-emerald-700">{profileSavedMessage}</p>
          ) : null}

          {role === 'admin' && isEditingUserProfile ? (
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center gap-3">
                {profileDraft.profilePhotoDataUrl ? (
                  <img
                    alt={t('photoItem')}
                    className="h-20 w-20 rounded-full border border-slate-200 object-cover"
                    src={profileDraft.profilePhotoDataUrl}
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white px-2 text-center text-xs text-slate-500">
                    {t('noPhotoPlaceholder')}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    <input
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        handleProfilePhotoSelect(event.target.files?.[0] ?? null);
                        event.currentTarget.value = '';
                      }}
                      type="file"
                    />
                    {t('uploadPhoto')}
                  </label>
                  {profileDraft.profilePhotoDataUrl ? (
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={openPhotoEditor}
                    >
                      {t('openPhotoEditor')}
                    </button>
                  ) : null}
                  {profileDraft.profilePhotoDataUrl ? (
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setProfileDraft((current) => ({ ...current, profilePhotoDataUrl: '' }))}
                    >
                      {t('removePhoto')}
                    </button>
                  ) : null}
                </div>
              </div>

              <label className="flex flex-col gap-1 text-xs text-slate-700">
                <span>{t('profileFieldFullName')}</span>
                <input
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  value={profileDraft.fullName}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, fullName: event.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-slate-700">
                <span>{t('profileFieldEmail')}</span>
                <input
                  className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-sm text-slate-600"
                  value={selectedUser.email || '-'}
                  readOnly
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-slate-700">
                <span>{t('profileFieldPhone')}</span>
                <input
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  value={profileDraft.phone}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-slate-700">
                <span>{t('profileFieldCity')}</span>
                <input
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  value={profileDraft.city}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, city: event.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-slate-700">
                <span>{t('profileFieldBio')}</span>
                <textarea
                  className="min-h-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  value={profileDraft.bio}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, bio: event.target.value }))}
                />
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                  onClick={handleSaveUserProfile}
                >
                  {t('profileSave')}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  onClick={handleStartEditUserProfile}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : null}

        </div>
      </div>

      {isPhotoEditorOpen ? (
        <div className="fixed inset-0 z-[102] flex items-center justify-center bg-slate-900/75 p-4" onClick={() => setIsPhotoEditorOpen(false)}>
          <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h5 className="text-base font-semibold text-slate-900">{t('photoEditorTitle')}</h5>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
                onClick={() => setIsPhotoEditorOpen(false)}
              >
                Х
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[320px,1fr]">
              <div
                ref={editorPreviewRef}
                className="relative mx-auto h-[min(68vw,18rem)] w-[min(68vw,18rem)] overflow-hidden rounded-lg border border-slate-300 bg-slate-100 sm:h-72 sm:w-72"
                onWheel={handleEditorWheel}
              >
                <img
                  src={editorSourceUrl}
                  alt={t('photoItem')}
                  className="h-full w-full select-none object-contain"
                  draggable={false}
                  onLoad={(event) => {
                    const width = event.currentTarget.naturalWidth;
                    const height = event.currentTarget.naturalHeight;
                    setEditorNaturalSize({ width, height });
                    initializeSelectionFromImage(width, height, editorZoom);
                  }}
                  style={{ transform: `scale(${editorZoom})` }}
                />
                {selectionSquare.size > 0 ? (
                  <div
                    className={`absolute border-2 border-orange-500 bg-orange-500/10 ${
                      isDraggingSelection ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                    style={{
                      left: `${selectionSquare.x}px`,
                      top: `${selectionSquare.y}px`,
                      width: `${selectionSquare.size}px`,
                      height: `${selectionSquare.size}px`,
                    }}
                    onPointerDown={(event) => startCropDrag(event)}
                    onPointerMove={(event) => moveCropDrag(event)}
                    onPointerUp={(event) => endCropDrag(event)}
                    onPointerCancel={(event) => endCropDrag(event)}
                  >
                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold leading-none text-orange-700">
                      +
                    </span>
                    <span className="absolute -bottom-5 left-0 text-[10px] font-medium text-orange-700">{t('photoCropAreaLabel')}</span>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-600">{t('photoDragHint')}</p>
                <p className="text-xs text-slate-500">{t('photoSquareLockHint')}</p>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    onClick={() => {
                      void applyPhotoEdits();
                    }}
                    disabled={isApplyingPhotoEdit}
                  >
                    {isApplyingPhotoEdit ? t('photoProcessing') : t('applyPhotoEdits')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700"
                    onClick={() => setIsPhotoEditorOpen(false)}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isRecipesModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/75 p-3 sm:items-center sm:p-4" onClick={() => setIsRecipesModalOpen(false)}>
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white p-4 shadow-xl sm:max-h-[calc(100vh-2rem)]" onClick={(event) => event.stopPropagation()}>
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
                    {isDeletingAllRecipes ? (
                      <span className="inline-flex items-center gap-2">
                        <InlineSpinner className="h-3.5 w-3.5" />
                        {t('loadingGeneric')}
                      </span>
                    ) : t('deleteAllUserRecipes')}
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
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
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
                          {deletingRecipeId === recipe.id ? <InlineSpinner className="h-4 w-4" /> : '×'}
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

      {isUserManagementModalOpen && role === 'admin' ? (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-slate-900/75 p-4" onClick={() => setIsUserManagementModalOpen(false)}>
          <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h5 className="text-base font-semibold text-slate-900">{t('adminUserManagementTitle')}</h5>
                <p className="text-xs text-slate-600">{t('adminUserManagementSubtitle')}</p>
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
                onClick={() => setIsUserManagementModalOpen(false)}
              >
                Х
              </button>
            </div>

            <div className="max-h-[55vh] space-y-2 overflow-y-auto">
              {managedUsers.map((entry) => {
                const roleLabel = entry.role === 'admin'
                  ? t('roleAdmin')
                  : entry.role === 'blocked'
                    ? t('roleBlocked')
                    : t('roleRegistered');

                return (
                  <div
                    key={`user-manage-${entry.id}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {entry.profilePhotoDataUrl ? (
                        <img
                          alt={entry.alias}
                          className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
                          src={entry.profilePhotoDataUrl}
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-[10px] text-slate-500">
                          {t('noPhotoPlaceholder')}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{entry.alias}</p>
                        <p className="truncate text-xs text-slate-600">{entry.email || entry.id}</p>
                      </div>
                    </div>

                    <div className="min-w-0">
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
