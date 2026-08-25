export interface UserMessage {
  id: string;
  toUserId: string;
  recipeId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

const USER_MESSAGES_KEY = 'recipes_user_messages_v1';

function readMessages(): UserMessage[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = localStorage.getItem(USER_MESSAGES_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as UserMessage[];
  } catch {
    return [];
  }
}

function writeMessages(messages: UserMessage[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(USER_MESSAGES_KEY, JSON.stringify(messages));
}

export function addUserMessage(toUserId: string, recipeId: string, text: string): void {
  const next: UserMessage = {
    id: `msg-${Date.now()}`,
    toUserId,
    recipeId,
    text,
    createdAt: new Date().toISOString(),
    read: false,
  };

  writeMessages([next, ...readMessages()]);
}

export function getUnreadUserMessages(toUserId: string): UserMessage[] {
  return readMessages().filter((message) => message.toUserId === toUserId && !message.read);
}

export function markAllUserMessagesRead(toUserId: string): void {
  const updated = readMessages().map((message) => {
    if (message.toUserId !== toUserId) {
      return message;
    }

    return { ...message, read: true };
  });

  writeMessages(updated);
}
