import { useEffect, useRef, useState } from 'react';
import { ApiError, deleteNotification, receiveNotification } from '../api/greenApi';
import type { Credentials, Message, Notification } from '../types';
import { getMediaLabel, isTextType } from '../utils/messages';

export type IncomingMessage = {
  chatId: string;
  chatName: string;
  message: Message;
};

const RETRY_DELAY = 5000;

function parseNotification(notification: Notification): IncomingMessage | null {
  const { typeWebhook, senderData, messageData, idMessage, timestamp } = notification;
  const isIncoming = typeWebhook === 'incomingMessageReceived';
  const isOutgoing = typeWebhook === 'outgoingMessageReceived' || typeWebhook === 'outgoingAPIMessageReceived';

  if (!isIncoming && !isOutgoing) return null;
  if (!senderData || !messageData || !idMessage) return null;

  if (senderData.chatId.startsWith('-')) return null;

  const { typeMessage } = messageData;
  const isText = isTextType(typeMessage);
  const text = isText
    ? (messageData.textMessageData?.textMessage ?? messageData.extendedTextMessageData?.text ?? '')
    : getMediaLabel(typeMessage, messageData.fileMessageData?.fileName);

  return {
    chatId: senderData.chatId,
    chatName: senderData.chatName || senderData.senderName || senderData.chatId,
    message: {
      id: idMessage,
      text,
      timestamp,
      fromMe: isOutgoing,
      status: isOutgoing ? 'sent' : undefined,
      media: !isText,
    },
  };
}

export function useNotifications(
  credentials: Credentials | null,
  onMessage: (incoming: IncomingMessage) => void,
) {
  const [error, setError] = useState<string | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!credentials) return;

    const controller = new AbortController();
    let stopped = false;

    async function poll(credentials: Credentials) {
      while (!stopped) {
        try {
          const notification = await receiveNotification(credentials, controller.signal);
          setError(null);
          if (!notification) continue;

          const incoming = parseNotification(notification.body);
          if (incoming) onMessageRef.current(incoming);

          await deleteNotification(credentials, notification.receiptId);
        } catch (err) {
          if (stopped) return;
          setError(err instanceof ApiError ? err.message : 'Не удалось получить сообщения');
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    poll(credentials);

    return () => {
      stopped = true;
      controller.abort();
    };
  }, [credentials]);

  return error;
}
