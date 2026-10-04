import type { HistoryMessage, Message } from '../types';

const mediaLabels: Record<string, string> = {
  imageMessage: 'Фото',
  videoMessage: 'Видео',
  audioMessage: 'Аудио',
  stickerMessage: 'Стикер',
  documentMessage: 'Файл',
  locationMessage: 'Геопозиция',
  contactMessage: 'Контакт',
  pollMessage: 'Опрос',
};

export function getMediaLabel(typeMessage: string, fileName?: string) {
  if (typeMessage === 'documentMessage' && fileName) return `Файл: ${fileName}`;
  return mediaLabels[typeMessage] ?? 'Сообщение не поддерживается';
}

export function isTextType(typeMessage: string) {
  return typeMessage === 'textMessage' || typeMessage === 'extendedTextMessage';
}

export function historyToMessage(item: HistoryMessage): Message {
  const fromMe = item.type === 'outgoing';
  const isText = isTextType(item.typeMessage);

  return {
    id: item.idMessage,
    text: isText ? (item.textMessage ?? '') : getMediaLabel(item.typeMessage, item.fileName),
    timestamp: item.timestamp,
    fromMe,
    status: fromMe ? 'sent' : undefined,
    media: !isText,
  };
}

export function mergeMessages(current: Message[], loaded: Message[]) {
  const ids = new Set(current.map((m) => m.id));
  return [...current, ...loaded.filter((m) => !ids.has(m.id))].sort((a, b) => a.timestamp - b.timestamp);
}
