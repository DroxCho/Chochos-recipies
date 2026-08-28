import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { canParticipate } from '../../auth/roles';
import { useUserRole } from '../../auth/useUserRole';
import { openPublicUserCard } from '../../lib/publicUserCard';
import { getUserDisplayName } from '../../lib/userDisplay';
import { getUnreadUserMessages, markAllUserMessagesRead, markUserMessageRead } from '../../lib/userMessages';

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

  function onMarkOneRead(messageId: string) {
    if (!userId) {
      return;
    }

    markUserMessageRead(userId, messageId);
    setVersion((current) => current + 1);
  }

  function extractLegacyReporterId(text: string): string | null {
    const match = text.match(/Подател:\s*([a-f0-9-]{36})/i);
    return match?.[1] ?? null;
  }

  function sanitizeMessageText(text: string): string {
    return text.replace(/\n?Подател:\s*[^\n]+/gi, '').trim();
  }

  function formatMessageTextForDisplay(text: string): string {
    return text
      .replace(/Коментар:\s*\n+\s*/gi, 'Коментар: ')
      .replace(/Описание:\s*\n+\s*/gi, 'Описание: ')
      .trim();
  }

  return (
    <section className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-amber-900">Имате {messages.length} нови съобщения за рецепти.</p>
        {messages.length > 1 && (
          <button
            className="rounded border border-amber-300 bg-white px-2 py-1 text-xs text-amber-900"
            onClick={onMarkAllRead}
            type="button"
          >
            Маркирай всички като прочетени
          </button>
        )}
      </div>
      <ul className="mt-3 space-y-2 text-sm text-amber-900">
        {messages.map((message) => (
          <li key={message.id} className="rounded bg-white px-3 py-2">
            {(() => {
              const reporterId = message.fromUserId ?? extractLegacyReporterId(message.text);
              const reporterAlias = message.fromUserAlias ?? (reporterId ? getUserDisplayName(reporterId, 'registered') : '');
              const reportedAuthorId = message.reportedAuthorUserId ?? null;
              const reportedAuthorAlias = message.reportedAuthorAlias ?? (reportedAuthorId ? getUserDisplayName(reportedAuthorId, 'registered') : '');
              const messageText = formatMessageTextForDisplay(sanitizeMessageText(message.text));

              return (
                <>
                  {reporterId && reporterAlias && (
                    <p className="mb-1 text-xs text-amber-900">
                      Подател:{' '}
                      <button
                        className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800"
                        onClick={() => openPublicUserCard(reporterId, 'registered')}
                        type="button"
                      >
                        {reporterAlias}
                      </button>
                    </p>
                  )}
                  {reportedAuthorId && reportedAuthorAlias && (
                    <p className="mb-1 text-xs text-amber-900">
                      Оплакване от:{' '}
                      <button
                        className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800"
                        onClick={() => openPublicUserCard(reportedAuthorId, 'registered')}
                        type="button"
                      >
                        {reportedAuthorAlias}
                      </button>
                    </p>
                  )}
                  <p className="whitespace-pre-line">{messageText}</p>
                </>
              );
            })()}
            {message.imageDataUrl && (
              <img
                alt="Докладван коментар"
                className="mt-2 w-full max-w-md rounded border border-amber-200"
                src={message.imageDataUrl}
              />
            )}
            <Link
              className="mt-1 inline-flex text-xs underline"
              to={role === 'admin' ? `/recipes/${message.recipeId}` : `/recipes/${message.recipeId}/edit`}
            >
              {role === 'admin' ? 'Отвори рецепта' : 'Отвори за редакция'}
            </Link>
            <button
              className="ml-3 mt-1 inline-flex rounded border border-amber-300 bg-white px-2 py-1 text-xs text-amber-900"
              onClick={() => onMarkOneRead(message.id)}
              type="button"
            >
              Маркирай като прочетен
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
