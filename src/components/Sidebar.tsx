import { useState, type FormEvent } from 'react';
import type { Chat } from '../types';
import { formatChatDate } from '../utils/format';
import { Avatar } from './Avatar';

type Props = {
  chats: Chat[];
  activeChatId: string | null;
  idInstance: string;
  onSelect: (chatId: string) => void;
  onCreate: (phone: string) => Promise<void>;
  onLogout: () => void;
};

export function Sidebar({ chats, activeChatId, idInstance, onSelect, onCreate, onLogout }: Props) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onCreate(phone);
      setPhone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось открыть чат');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div>
          <div className="sidebar__title">Чаты</div>
          <div className="sidebar__instance">Инстанс {idInstance}</div>
        </div>
        <button className="icon-button" onClick={onLogout} title="Выйти" aria-label="Выйти">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </header>

      <form className="new-chat" onSubmit={handleSubmit}>
        <input
          className="new-chat__input"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setError(null);
          }}
          placeholder="Номер телефона"
          inputMode="tel"
          disabled={isLoading}
        />
        <button className="new-chat__button" type="submit" disabled={isLoading || !phone.trim()}>
          {isLoading ? '…' : 'Открыть'}
        </button>
      </form>
      {error && <div className="alert alert--sidebar">{error}</div>}

      <ul className="chat-list">
        {chats.length === 0 && (
          <li className="chat-list__empty">
            Чатов пока нет
          </li>
        )}

        {chats.map((chat) => {
          const lastMessage = chat.messages[chat.messages.length - 1];

          return (
            <li key={chat.id}>
              <button
                className={`chat-item ${chat.id === activeChatId ? 'chat-item--active' : ''}`}
                onClick={() => onSelect(chat.id)}
              >
                <Avatar id={chat.id} title={chat.title} />
                <div className="chat-item__body">
                  <div className="chat-item__row">
                    <span className="chat-item__title">{chat.title}</span>
                    {lastMessage && (
                      <span className="chat-item__time">{formatChatDate(lastMessage.timestamp)}</span>
                    )}
                  </div>
                  <div className="chat-item__row">
                    <span className="chat-item__preview">
                      {lastMessage
                        ? `${lastMessage.fromMe ? 'Вы: ' : ''}${lastMessage.text}`
                        : 'Нет сообщений'}
                    </span>
                    {chat.unread > 0 && <span className="chat-item__badge">{chat.unread}</span>}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
