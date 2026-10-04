import type { Chat as ChatType, Message } from '../types';
import { formatPhone } from '../utils/format';
import { Avatar } from './Avatar';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';

type Props = {
  chat: ChatType;
  error: string | null;
  isLoading: boolean;
  onBack: () => void;
  onSend: (text: string) => void;
  onRetry: (message: Message) => void;
};

export function Chat({ chat, error, isLoading, onBack, onSend, onRetry }: Props) {
  const phone = chat.phone ? formatPhone(chat.phone) : null;
  const subtitle = [phone !== chat.title && phone, chat.username].filter(Boolean).join(' · ') || 'Telegram';

  return (
    <section className="chat">
      <header className="chat__header">
        <button className="icon-button chat__back" onClick={onBack} aria-label="Назад">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <Avatar id={chat.id} title={chat.title} size={40} />
        <div className="chat__info">
          <div className="chat__title">{chat.title}</div>
          <div className="chat__subtitle">{subtitle}</div>
        </div>
      </header>

      {error && <div className="chat__error">{error}</div>}

      <MessageList messages={chat.messages} isLoading={isLoading} onRetry={onRetry} />
      <MessageInput onSend={onSend} />
    </section>
  );
}
