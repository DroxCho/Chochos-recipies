import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { WheelEvent as ReactWheelEvent } from 'react';
import { useUserRole } from '../auth/useUserRole';
import type { ManagedUserRole, UserAdminControlMap } from '../auth/userAdminControls';
import { readUserAdminControls, writeUserAdminControls } from '../auth/userAdminControls';
import { useLanguage } from '../i18n/useLanguage';
import { getSupabaseClient } from '../lib/supabase';
import type { TranslationKey } from '../i18n/translations';
import supabaseUsersSnapshot from '../data/supabaseUsersSnapshot.json';

interface UserProfileDetails {
  fullName: string;
  phone: string;
  city: string;
  bio: string;
  profilePhotoDataUrl?: string;
}

type UserProfileMap = Record<string, UserProfileDetails>;

const PROFILE_STORAGE_KEY = 'recipes_user_profiles_v1';
const PHOTO_EDITOR_PREVIEW_SIZE = 288;

interface SnapshotUser {
  id: string;
  email: string | null;
  role: string;
}

function normalizeManagedRole(value: unknown): ManagedUserRole {
  return value === 'admin' ? 'admin' : 'registered';
}

function readProfiles(): UserProfileMap {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as UserProfileMap;
  } catch {
    return {};
  }
}

function writeProfiles(value: UserProfileMap): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event('profile-updated'));
}

export function ProfilePage() {
  const { t } = useLanguage();
  const { role, userId } = useUserRole();
  const canEditProfile = role === 'registered' || role === 'admin';
  const isAdmin = role === 'admin';
  const roleLabel = role === 'admin' ? t('roleAdmin') : role === 'blocked' ? t('roleBlocked') : t('roleRegistered');
  const requiredMark = <span className="text-rose-600">*</span>;
  const snapshotUsers = useMemo(
    () => ((supabaseUsersSnapshot as { users?: SnapshotUser[] }).users ?? []),
    [],
  );

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhotoDataUrl, setProfilePhotoDataUrl] = useState('');
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [editorSourceUrl, setEditorSourceUrl] = useState('');
  const [editorZoom, setEditorZoom] = useState(1);
  const [editorNaturalSize, setEditorNaturalSize] = useState({ width: 0, height: 0 });
  const [editorImageSize, setEditorImageSize] = useState({ width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 });
  const [selectionSquare, setSelectionSquare] = useState({ x: 0, y: 0, size: 0 });
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [isApplyingPhotoEdit, setIsApplyingPhotoEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [photoError, setPhotoError] = useState<TranslationKey | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ photo?: boolean; fullName?: boolean; email?: boolean }>({});
  const [userControls, setUserControls] = useState<UserAdminControlMap>(() => readUserAdminControls());
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedManagedUserId, setSelectedManagedUserId] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const previousEditorZoomRef = useRef(1);

  const managedUsers = useMemo(() => {
    const profiles = readProfiles();

    return snapshotUsers
      .filter((user) => !userControls[user.id]?.deleted)
      .map((user) => {
        const control = userControls[user.id];
        const fullName = profiles[user.id]?.fullName?.trim() ?? '';
        return {
          ...user,
          fullName,
          selectedRole: normalizeManagedRole(control?.role ?? user.role),
          isBlocked: Boolean(control?.blocked),
        };
      })
      .sort((left, right) => (left.email ?? '').localeCompare(right.email ?? ''));
  }, [snapshotUsers, userControls]);

  const filteredManagedUsers = useMemo(() => {
    const query = userSearchQuery.trim().toLowerCase();
    if (!query) {
      return managedUsers;
    }

    return managedUsers.filter((user) => {
      const emailMatch = (user.email ?? '').toLowerCase().includes(query);
      const nameMatch = user.fullName.toLowerCase().includes(query);
      return emailMatch || nameMatch;
    });
  }, [managedUsers, userSearchQuery]);

  const selectedManagedUser = useMemo(
    () => managedUsers.find((user) => user.id === selectedManagedUserId) ?? null,
    [managedUsers, selectedManagedUserId],
  );

  function inputBorderClass(hasError: boolean): string {
    return hasError ? 'border-rose-500' : 'border-slate-300';
  }

  function validateRequiredFields(): { photo?: boolean; fullName?: boolean; email?: boolean } {
    const nextFieldErrors: { photo?: boolean; fullName?: boolean; email?: boolean } = {};

    if (!profilePhotoDataUrl.trim()) {
      nextFieldErrors.photo = true;
    }

    if (!fullName.trim()) {
      nextFieldErrors.fullName = true;
    }

    if (!email.trim()) {
      nextFieldErrors.email = true;
    }

    return nextFieldErrors;
  }

  function hasValidationErrors(errors: { photo?: boolean; fullName?: boolean; email?: boolean }): boolean {
    return Object.keys(errors).length > 0;
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function getImageRenderRect(width: number, height: number, zoomValue: number = 1) {
    if (!width || !height) {
      return { width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 };
    }

    const baseScale = Math.min(PHOTO_EDITOR_PREVIEW_SIZE / width, PHOTO_EDITOR_PREVIEW_SIZE / height);
    const scale = baseScale * clamp(zoomValue, 0.4, 3);
    const renderedWidth = width * scale;
    const renderedHeight = height * scale;

    return {
      width: renderedWidth,
      height: renderedHeight,
      scale,
      offsetX: (PHOTO_EDITOR_PREVIEW_SIZE - renderedWidth) / 2,
      offsetY: (PHOTO_EDITOR_PREVIEW_SIZE - renderedHeight) / 2,
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

      if (source.startsWith('http')) {
        image.crossOrigin = 'anonymous';
      }

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('photo-load-failed'));
      image.src = source;
    });
  }

  async function optimizeImageDataUrl(source: string, maxSide: number = 1600, quality: number = 0.88): Promise<string> {
    if (!source.startsWith('data:image/')) {
      return source;
    }

    const image = await loadImage(source);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const longestSide = Math.max(width, height);

    if (!longestSide || longestSide <= maxSide) {
      return source;
    }

    const scale = maxSide / longestSide;
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('photo-canvas-failed');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    return canvas.toDataURL('image/jpeg', quality);
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
      setProfilePhotoDataUrl(nextPhoto);
      setIsPhotoEditorOpen(false);
      setPhotoError(null);
      if (successMessage) {
        setSuccessMessage('');
      }
    } catch {
      setPhotoError('validationPhotoProcessFailed');
    } finally {
      setIsApplyingPhotoEdit(false);
    }
  }

  function openPhotoEditor() {
    const source = profilePhotoDataUrl.trim();
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

  useEffect(() => {
    if (!canEditProfile || !userId) {
      return;
    }

    const profiles = readProfiles();
    const saved = profiles[userId];
    if (saved) {
      setFullName(saved.fullName);
      setPhone(saved.phone);
      setCity(saved.city);
      setBio(saved.bio);
      setProfilePhotoDataUrl(saved.profilePhotoDataUrl ?? '');
    } else {
      setFullName('');
      setPhone('');
      setCity('');
      setBio('');
      setProfilePhotoDataUrl('');
    }

    let isMounted = true;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setEmail('');
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setEmail(data.user?.email ?? '');
    });

    return () => {
      isMounted = false;
    };
  }, [canEditProfile, userId]);

  useEffect(() => {
    function refreshUserControls() {
      setUserControls(readUserAdminControls());
    }

    window.addEventListener('storage', refreshUserControls);
    window.addEventListener('user-controls-updated', refreshUserControls);

    return () => {
      window.removeEventListener('storage', refreshUserControls);
      window.removeEventListener('user-controls-updated', refreshUserControls);
    };
  }, []);

  function updateUserControl(
    userEntryId: string,
    updater: (entry: { role?: ManagedUserRole; blocked?: boolean; deleted?: boolean }) => { role?: ManagedUserRole; blocked?: boolean; deleted?: boolean },
  ) {
    const current = readUserAdminControls();
    const nextEntry = updater(current[userEntryId] ?? {});
    const next = {
      ...current,
      [userEntryId]: nextEntry,
    };

    setUserControls(next);
    writeUserAdminControls(next);
  }

  function handleManagedRoleChange(userEntryId: string, nextRole: ManagedUserRole) {
    updateUserControl(userEntryId, (entry) => ({
      ...entry,
      role: nextRole,
    }));
  }

  function handleToggleBlocked(userEntryId: string) {
    updateUserControl(userEntryId, (entry) => ({
      ...entry,
      blocked: !entry.blocked,
      deleted: entry.deleted ? false : entry.deleted,
    }));
  }

  function handleDeleteManagedUser(userEntryId: string) {
    updateUserControl(userEntryId, (entry) => ({
      ...entry,
      deleted: true,
      blocked: true,
    }));

    if (selectedManagedUserId === userEntryId) {
      setSelectedManagedUserId(null);
    }
  }

  function openManagedUserCard(userEntryId: string) {
    setSelectedManagedUserId(userEntryId);
  }

  function closeManagedUserCard() {
    setSelectedManagedUserId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || !canEditProfile) {
      return;
    }

    const nextFieldErrors = validateRequiredFields();
    if (hasValidationErrors(nextFieldErrors)) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});

    setIsSaving(true);

    const profiles = readProfiles();
    profiles[userId] = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      bio: bio.trim(),
      profilePhotoDataUrl: profilePhotoDataUrl || undefined,
    };
    writeProfiles(profiles);

    setSuccessMessage(t('profileSaveSuccess'));
    setIsSaving(false);
  }

  function handleProfilePhotoSelect(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('validationPhotosUrl');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        setPhotoError('validationPhotoUploadFailed');
        return;
      }

      try {
        const optimizedOriginal = await optimizeImageDataUrl(result);
        setProfilePhotoDataUrl(optimizedOriginal);
        setEditorSourceUrl(optimizedOriginal);
        setEditorZoom(1);
        previousEditorZoomRef.current = 1;
        setEditorNaturalSize({ width: 0, height: 0 });
        setEditorImageSize({ width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 });
        setSelectionSquare({ x: 0, y: 0, size: 0 });
        setIsPhotoEditorOpen(true);
        setPhotoError(null);
        if (successMessage) {
          setSuccessMessage('');
        }
      } catch {
        setPhotoError('validationPhotoProcessFailed');
      }
    };

    reader.onerror = () => {
      setPhotoError('validationPhotoUploadFailed');
    };

    reader.readAsDataURL(file);
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

  if (!canEditProfile) {
    return (
      <section className="min-h-[320px]" aria-label="profile-page">
        <h2 className="mb-3 text-xl font-semibold text-slate-900">{t('profileTitle')}</h2>
        <p className="text-sm text-slate-500">{t('profileOnlyRegistered')}</p>
      </section>
    );
  }

  return (
    <section className="min-h-[320px]" aria-label="profile-page">
      <h2 className="mb-1 text-xl font-semibold text-slate-900">{t('profileTitle')}</h2>
      <p className="mb-5 text-sm text-slate-500">{t('profileSubtitle')}</p>

      <form className="max-w-2xl space-y-4" noValidate onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 text-sm text-slate-700">
          <span>{t('photoItem')} {requiredMark}</span>
          <div className="flex flex-wrap items-center gap-4">
            {profilePhotoDataUrl ? (
              <img
                alt={t('photoItem')}
                className={`rounded-full border object-cover ${inputBorderClass(Boolean(fieldErrors.photo))}`}
                style={{ width: '150px', height: '150px' }}
                src={profilePhotoDataUrl}
              />
            ) : (
              <div
                className={`flex flex-col items-center justify-center rounded-full border border-dashed bg-slate-50 text-slate-500 ${inputBorderClass(Boolean(fieldErrors.photo))}`}
                style={{ width: '150px', height: '150px' }}
              >
                <span aria-hidden="true" className="flex h-28 w-28 items-center justify-center rounded-full border border-slate-300 bg-white">
                  <svg viewBox="0 0 24 24" className="h-16 w-16 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="9" r="2.5" />
                    <path d="M7.5 17c1.2-2 2.8-3 4.5-3s3.3 1 4.5 3" />
                  </svg>
                </span>
                <span className="mt-3 px-4 text-center text-xs leading-4">{t('noPhotoPlaceholder')}</span>
              </div>
            )}
            <div className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              {t('profileRoleLabel')}: {roleLabel}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <input
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  handleProfilePhotoSelect(event.target.files?.[0] ?? null);
                  if (fieldErrors.photo) {
                    setFieldErrors((current) => ({ ...current, photo: false }));
                  }
                  event.currentTarget.value = '';
                }}
                type="file"
              />
              {t('uploadPhoto')}
            </label>
            {profilePhotoDataUrl && (
              <button
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => openPhotoEditor()}
                type="button"
              >
                {t('openPhotoEditor')}
              </button>
            )}
            {profilePhotoDataUrl && (
              <button
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setProfilePhotoDataUrl('');
                  setFieldErrors((current) => ({ ...current, photo: true }));
                  setPhotoError(null);
                  if (successMessage) {
                    setSuccessMessage('');
                  }
                }}
                type="button"
              >
                {t('removePhoto')}
              </button>
            )}
          </div>
          {fieldErrors.photo && <span className="text-xs text-rose-700">{t('validationFieldRequired')}</span>}
          {photoError && <span className="text-xs text-rose-700">{t(photoError)}</span>}
        </div>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>{t('profileFieldFullName')} {requiredMark}</span>
          <input
            className={`rounded-md border bg-white px-3 py-2 ${inputBorderClass(Boolean(fieldErrors.fullName))}`}
            aria-invalid={Boolean(fieldErrors.fullName)}
            onChange={(event) => {
              setFullName(event.target.value);
              if (fieldErrors.fullName) {
                setFieldErrors((current) => ({ ...current, fullName: false }));
              }
              if (successMessage) {
                setSuccessMessage('');
              }
            }}
            required
            value={fullName}
          />
          {fieldErrors.fullName && <span className="text-xs text-rose-700">{t('validationFieldRequired')}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>{t('profileFieldEmail')} {requiredMark}</span>
          <input
            className={`rounded-md border bg-slate-100 px-3 py-2 text-slate-600 ${inputBorderClass(Boolean(fieldErrors.email))}`}
            aria-invalid={Boolean(fieldErrors.email)}
            readOnly
            required
            value={email}
          />
          {fieldErrors.email && <span className="text-xs text-rose-700">{t('validationFieldRequired')}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>{t('profileFieldPhone')}</span>
          <input
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
            onChange={(event) => {
              setPhone(event.target.value);
              if (successMessage) {
                setSuccessMessage('');
              }
            }}
            value={phone}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>{t('profileFieldCity')}</span>
          <input
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
            onChange={(event) => {
              setCity(event.target.value);
              if (successMessage) {
                setSuccessMessage('');
              }
            }}
            value={city}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>{t('profileFieldBio')}</span>
          <textarea
            className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2"
            onChange={(event) => {
              setBio(event.target.value);
              if (successMessage) {
                setSuccessMessage('');
              }
            }}
            value={bio}
          />
        </label>

        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? t('saving') : t('profileSave')}
        </button>

        {successMessage && <p className="text-sm text-emerald-700">{successMessage}</p>}
      </form>

      {isAdmin && (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-900">{t('adminUserManagementTitle')}</h3>
          <p className="mt-1 text-xs text-slate-500">{t('adminUserManagementSubtitle')}</p>

          <label className="mt-3 block text-xs text-slate-600">
            {t('adminUserSearchLabel')}
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              placeholder={t('adminUserSearchPlaceholder')}
              value={userSearchQuery}
              onChange={(event) => setUserSearchQuery(event.target.value)}
            />
          </label>

          <div className="mt-4 space-y-2">
            {filteredManagedUsers.length === 0 && (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                {t('adminNoUsersFound')}
              </p>
            )}

            {filteredManagedUsers.map((entry) => {
              const isCurrentUser = Boolean(userId) && entry.id === userId;

              return (
                <div key={entry.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1.6fr_auto_auto_auto] md:items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{entry.fullName || entry.email || entry.id}</p>
                    {entry.fullName && <p className="text-xs text-slate-600">{entry.email || '-'}</p>}
                    <p className="text-xs text-slate-500">{t('profileFieldUserId')}: {entry.id}</p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500" htmlFor={`manage-role-${entry.id}`}>
                      {t('profileRoleLabel')}
                    </label>
                    <select
                      id={`manage-role-${entry.id}`}
                      className="mt-1 block rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                      value={entry.selectedRole}
                      onChange={(event) => handleManagedRoleChange(entry.id, event.target.value as ManagedUserRole)}
                    >
                      <option value="registered">{t('roleRegistered')}</option>
                      <option value="admin">{t('roleAdmin')}</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">{t('userStatusLabel')}</p>
                    <p className={`mt-1 text-xs font-medium ${entry.isBlocked ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {entry.isBlocked ? t('userStatusBlocked') : t('userStatusActive')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                      onClick={() => openManagedUserCard(entry.id)}
                    >
                      {t('openUserCard')}
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                      onClick={() => handleToggleBlocked(entry.id)}
                      disabled={isCurrentUser}
                    >
                      {entry.isBlocked ? t('unblockUser') : t('blockUser')}
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                      onClick={() => handleDeleteManagedUser(entry.id)}
                      disabled={isCurrentUser}
                    >
                      {t('deleteUser')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {isAdmin && selectedManagedUser && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/70 p-4" onClick={closeManagedUserCard}>
          <div
            className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-900">{t('userCardDetailsTitle')}</h4>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
                onClick={closeManagedUserCard}
              >
                {t('cancel')}
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium text-slate-900">{selectedManagedUser.fullName || selectedManagedUser.email || selectedManagedUser.id}</p>
                {selectedManagedUser.fullName && <p className="text-xs text-slate-600">{selectedManagedUser.email || '-'}</p>}
                <p className="mt-1 text-xs text-slate-500">{t('profileFieldUserId')}: {selectedManagedUser.id}</p>
              </div>

              <label className="block text-xs text-slate-500" htmlFor="selected-user-role">
                {t('profileRoleLabel')}
                <select
                  id="selected-user-role"
                  className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700"
                  value={selectedManagedUser.selectedRole}
                  onChange={(event) => handleManagedRoleChange(selectedManagedUser.id, event.target.value as ManagedUserRole)}
                >
                  <option value="registered">{t('roleRegistered')}</option>
                  <option value="admin">{t('roleAdmin')}</option>
                </select>
              </label>

              <p className="text-xs text-slate-500">
                {t('userStatusLabel')}: <span className={selectedManagedUser.isBlocked ? 'text-rose-700' : 'text-emerald-700'}>{selectedManagedUser.isBlocked ? t('userStatusBlocked') : t('userStatusActive')}</span>
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  onClick={() => handleToggleBlocked(selectedManagedUser.id)}
                  disabled={selectedManagedUser.id === userId}
                >
                  {selectedManagedUser.isBlocked ? t('unblockUser') : t('blockUser')}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  onClick={() => handleDeleteManagedUser(selectedManagedUser.id)}
                  disabled={selectedManagedUser.id === userId}
                >
                  {t('deleteUser')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPhotoEditorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-900">{t('photoEditorTitle')}</h4>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
                onClick={() => setIsPhotoEditorOpen(false)}
              >
                {t('cancel')}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[320px,1fr]">
              <div
                className="relative mx-auto h-72 w-72 overflow-hidden rounded-lg border border-slate-300 bg-slate-100"
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
                {selectionSquare.size > 0 && (
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
                )}
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
      )}
    </section>
  );
}
