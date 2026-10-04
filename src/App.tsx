import { useEffect, useMemo, useState } from 'react';
import { checkAccount, getChatHistory, getContactInfo, sendMessage } from './api/greenApi';
import { Chat } from './components/Chat';
import { LoginForm } from './components/LoginForm';
import { Sidebar } from './components/Sidebar';
import { useNotifications, type IncomingMessage } from './hooks/useNotifications';
import type { Chat as ChatType, Credentials, Message } from './types';
import { formatPhone, normalizePhone } from './utils/format';
import { historyToMessage, mergeMessages } from './utils/messages';

const CREDENTIALS_KEY = 'greenapi:credentials';
const chatsKey = (idInstance: string) => `greenapi:chats:${idInstance}`;

function loadCredentials(): Credentials | null {
  try {
    return JSON.parse(sessionStorage.getItem(CREDENTIALS_KEY) ?? 'null');
  } catch {
    return null;
  }
}

function loadChats(idInstance: string): ChatType[] {
  try {
    const chats: ChatType[] = JSON.parse(localStorage.getItem(chatsKey(idInstance)) ?? '[]');
    return chats.map((chat) => ({
      ...chat,
      messages: chat.messages.map((m) => (m.status === 'sending' ? { ...m, status: 'error' } : m)),
    }));
  } catch {
    return [];
  }
}

function lastActivity(chat: ChatType) {
  const last = chat.messages[chat.messages.length - 1];
  return last ? last.timestamp : Infinity;
}

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(loadCredentials);
  const [chats, setChats] = useState<ChatType[]>(() =>
    credentials ? loadChats(credentials.idInstance) : [],
  );
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);

  useEffect(() => {
    if (credentials) {
      localStorage.setItem(chatsKey(credentials.idInstance), JSON.stringify(chats));
    }
  }, [credentials, chats]);

  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => lastActivity(b) - lastActivity(a)),
    [chats],
  );
  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;

  function handleIncoming({ chatId, chatName, message }: IncomingMessage) {
    const isUnread = !message.fromMe && chatId !== activeChatId;

    setChats((prev) => {
      const chat = prev.find((c) => c.id === chatId);

      if (!chat) {
        return [...prev, { id: chatId, title: chatName, messages: [message], unread: isUnread ? 1 : 0 }];
      }
      if (chat.messages.some((m) => m.id === message.id)) return prev;

      return prev.map((c) =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, message], unread: c.unread + (isUnread ? 1 : 0) }
          : c,
      );
    });
  }

  const receiveError = useNotifications(credentials, handleIncoming);

  function updateMessages(chatId: string, update: (messages: Message[]) => Message[]) {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, messages: update(c.messages) } : c)));
  }

  function handleLogin(next: Credentials) {
    sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify(next));
    setCredentials(next);
    setChats(loadChats(next.idInstance));
  }

  function handleLogout() {
    sessionStorage.removeItem(CREDENTIALS_KEY);
    setCredentials(null);
    setChats([]);
    setActiveChatId(null);
    setChatError(null);
  }

  async function loadChat(chatId: string) {
    if (!credentials) return;

    setLoadingChatId(chatId);
    try {
      const [history, contact] = await Promise.all([
        getChatHistory(credentials, chatId),
        getContactInfo(credentials, chatId).catch(() => null),
      ]);
      const loaded = history.filter((item) => !item.isDeleted).map(historyToMessage);

      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                title: contact?.contactName || contact?.name || c.title,
                username: contact?.username || c.username,
                phone: contact?.phoneNumber ? String(contact.phoneNumber) : c.phone,
                messages: mergeMessages(c.messages, loaded),
              }
            : c,
        ),
      );
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Не удалось загрузить историю');
    } finally {
      setLoadingChatId((current) => (current === chatId ? null : current));
    }
  }

  function openChat(chatId: string) {
    setActiveChatId(chatId);
    setChatError(null);
    setChats((prev) => prev.map((c) => (c.id === chatId && c.unread > 0 ? { ...c, unread: 0 } : c)));
    loadChat(chatId);
  }

  async function handleCreateChat(input: string) {
    if (!credentials) return;

    const phone = normalizePhone(input);
    if (phone.length < 10 || phone.length > 15) {
      throw new Error('Неверный формат номера');
    }

    const existing = chats.find((c) => c.phone === phone);
    if (existing) {
      openChat(existing.id);
      return;
    }

    const account = await checkAccount(credentials, phone);
    if (!account.exist) {
      throw new Error('Номер не найден в Telegram');
    }

    setChats((prev) =>
      prev.some((c) => c.id === account.chatId)
        ? prev.map((c) => (c.id === account.chatId ? { ...c, phone } : c))
        : [{ id: account.chatId, title: formatPhone(phone), phone, messages: [], unread: 0 }, ...prev],
    );
    openChat(account.chatId);
  }

  async function deliver(chatId: string, localId: string, text: string) {
    if (!credentials) return;

    try {
      const { idMessage } = await sendMessage(credentials, chatId, text);
      setChatError(null);
      updateMessages(chatId, (messages) =>
        messages.some((m) => m.id === idMessage)
          ? messages.filter((m) => m.id !== localId)
          : messages.map((m) => (m.id === localId ? { ...m, id: idMessage, status: 'sent' } : m)),
      );
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Не удалось отправить сообщение');
      updateMessages(chatId, (messages) =>
        messages.map((m) => (m.id === localId ? { ...m, status: 'error' } : m)),
      );
    }
  }

  function handleSend(text: string) {
    if (!activeChatId) return;

    const message: Message = {
      id: `local-${Date.now()}`,
      text,
      timestamp: Math.floor(Date.now() / 1000),
      fromMe: true,
      status: 'sending',
    };

    updateMessages(activeChatId, (messages) => [...messages, message]);
    deliver(activeChatId, message.id, text);
  }

  function handleRetry(message: Message) {
    if (!activeChatId) return;

    updateMessages(activeChatId, (messages) =>
      messages.map((m) => (m.id === message.id ? { ...m, status: 'sending' } : m)),
    );
    deliver(activeChatId, message.id, message.text);
  }

  if (!credentials) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className={`app ${activeChat ? 'app--chat-open' : ''}`}>
      <Sidebar
        chats={sortedChats}
        activeChatId={activeChatId}
        idInstance={credentials.idInstance}
        onSelect={openChat}
        onCreate={handleCreateChat}
        onLogout={handleLogout}
      />

      {activeChat ? (
        <Chat
          key={activeChat.id}
          chat={activeChat}
          error={chatError ?? receiveError}
          isLoading={loadingChatId === activeChat.id}
          onBack={() => setActiveChatId(null)}
          onSend={handleSend}
          onRetry={handleRetry}
        />
      ) : (
        <main className="placeholder">
          <div className="placeholder__badge">Выберите чат</div>
          {receiveError && <div className="alert">{receiveError}</div>}
        </main>
      )}
    </div>
  );
}
