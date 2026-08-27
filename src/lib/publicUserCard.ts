import { getUserProfileLinkId } from './userDisplay';

export const OPEN_PUBLIC_USER_CARD_EVENT = 'open-public-user-card';
export const CLOSE_PUBLIC_USER_CARD_EVENT = 'close-public-user-card';

interface OpenPublicUserCardEventDetail {
  userId: string;
}

export function openPublicUserCard(userId: string, ownerRole?: 'registered' | 'admin'): void {
  if (typeof window === 'undefined' || !userId) {
    return;
  }

  const resolvedUserId = getUserProfileLinkId(userId, ownerRole);
  if (!resolvedUserId) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<OpenPublicUserCardEventDetail>(OPEN_PUBLIC_USER_CARD_EVENT, {
      detail: { userId: resolvedUserId },
    }),
  );
}

export function closePublicUserCard(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(CLOSE_PUBLIC_USER_CARD_EVENT));
}
