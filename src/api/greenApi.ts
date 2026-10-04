import type { Credentials, HistoryMessage, Notification } from '../types';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getDefaultApiUrl(idInstance: string) {
  const envUrl = import.meta.env.VITE_GREEN_API_URL;
  if (envUrl) return envUrl;

  const prefix = idInstance.trim().slice(0, 4);
  return prefix.length === 4 ? `https://${prefix}.api.green-api.com` : 'https://api.green-api.com';
}

function errorMessage(status: number) {
  switch (status) {
    case 400:
      return 'Неверный запрос';
    case 401:
    case 403:
      return 'Неверный idInstance или apiTokenInstance';
    case 404:
      return 'Неверный API URL';
    case 429:
      return 'Слишком много запросов, подождите немного';
    case 466:
      return 'Превышен лимит тарифа';
    case 469:
      return 'Telegram ограничил поиск по номеру, попробуйте позже';
    default:
      return status >= 500
        ? 'GREEN-API недоступен'
        : `Ошибка ${status}`;
  }
}

async function request<T>(
  credentials: Credentials,
  method: string,
  options: RequestInit & { path?: string; query?: string } = {},
): Promise<T> {
  const { idInstance, apiTokenInstance, apiUrl } = credentials;
  const { path = '', query = '', ...init } = options;
  const url = `${apiUrl.replace(/\/+$/, '')}/waInstance${idInstance}/${method}/${apiTokenInstance}${path}${query}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'Нет соединения с сервером');
  }

  if (!response.ok) {
    throw new ApiError(response.status, errorMessage(response.status));
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function getStateInstance(credentials: Credentials) {
  return request<{ stateInstance: string }>(credentials, 'getStateInstance');
}

export function getSettings(credentials: Credentials) {
  return request<{ webhookUrl: string; incomingWebhook: string }>(credentials, 'getSettings');
}

export function checkAccount(credentials: Credentials, phoneNumber: string) {
  return request<{ exist: boolean; chatId: string; username?: string }>(credentials, 'checkAccount', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
  });
}

export function getContactInfo(credentials: Credentials, chatId: string) {
  return request<{ name?: string; contactName?: string; username?: string; phoneNumber?: number }>(
    credentials,
    'getContactInfo',
    { method: 'POST', body: JSON.stringify({ chatId }) },
  );
}

export function getChatHistory(credentials: Credentials, chatId: string, count = 50) {
  return request<HistoryMessage[]>(credentials, 'getChatHistory', {
    method: 'POST',
    body: JSON.stringify({ chatId, count }),
  });
}

export function sendMessage(credentials: Credentials, chatId: string, message: string) {
  return request<{ idMessage: string }>(credentials, 'sendMessage', {
    method: 'POST',
    body: JSON.stringify({ chatId, message }),
  });
}

export function receiveNotification(credentials: Credentials, signal?: AbortSignal) {
  return request<{ receiptId: number; body: Notification } | null>(credentials, 'receiveNotification', {
    query: '?receiveTimeout=20',
    signal,
  });
}

export function deleteNotification(credentials: Credentials, receiptId: number) {
  return request<{ result: boolean }>(credentials, 'deleteNotification', {
    method: 'DELETE',
    path: `/${receiptId}`,
  });
}
