import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { canParticipate } from '../../auth/roles';
import { useUserRole } from '../../auth/useUserRole';
import { getUnreadUserMessages, markAllUserMessagesRead } from '../../lib/userMessages';

export function UserMessagesBanner() {
  const { userId, role } = useUserRole();
  const [version, setVersion] = useState(0);

  const messages = useMemo(() => {
    void version;

    if (!userId || !canParticipate(role)) {
      return [];
    }

    return getUnreadUserMessages(userId);
  }, [role, userId, version]);

  useEffect(() => {
    function refreshMessages() {
      setVersion((current) => current + 1);
    }

    window.addEventListener('user-messages-updated', refreshMessages);
    window.addEventListener('storage', refreshMessages);

    return () => {
      window.removeEventListener('user-messages-updated', refreshMessages);
      window.removeEventListener('storage', refreshMessages);
    };
  }, []);

  if (messages.length === 0) {
    return null;
  }

  function onMarkAllRead() {
    if (!userId) {
      return;
    }

    markAllUserMessagesRead(userId);
    setVersion((current) => current + 1);
  }

  return (
    <section className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-amber-900">Имате {messages.length} нови съобщения за рецепти.</p>
        <button
          className="rounded border border-amber-300 bg-white px-2 py-1 text-xs text-amber-900"
          onClick={onMarkAllRead}
          type="button"
        >
          Маркирай като прочетени
        </button>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-amber-900">
        {messages.map((message) => (
          <li key={message.id} className="rounded bg-white px-3 py-2">
            <p>{message.text}</p>
            {message.imageDataUrl && (
              <img
                alt="Докладван коментар"
                className="mt-2 w-full max-w-md rounded border border-amber-200"
                src={message.imageDataUrl}
              />
            )}
            <Link className="mt-1 inline-flex text-xs underline" to={`/recipes/${message.recipeId}/edit`}>
              Отвори за редакция
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
