import { Fragment, useEffect, useRef } from 'react';
import type { Message } from '../types';
import { formatDay, formatTime } from '../utils/format';

type Props = {
  messages: Message[];
  isLoading: boolean;
  onRetry: (message: Message) => void;
};

function StatusIcon({ status }: { status: Message['status'] }) {
  if (status === 'sending') {
    return (
      <svg className="message__status" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v3l2 1.5" />
      </svg>
    );
  }
  if (status === 'error') {
    return (
      <svg className="message__status message__status--error" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.5h1.5v4.5h-1.5V4.5Zm0 5.75h1.5v1.5h-1.5v-1.5Z" />
      </svg>
    );
  }
  return (
    <svg className="message__status" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m2.5 8.5 3 3 7-7" />
    </svg>
  );
}

export function MessageList({ messages, isLoading, onRetry }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="messages messages--empty">
        <div className="messages__placeholder">{isLoading ? 'Загрузка...' : 'Нет сообщений'}</div>
      </div>
    );
  }

  return (
    <div className="messages">
      <div className="messages__inner">
        {messages.map((message, index) => {
          const prev = messages[index - 1];
          const day = formatDay(message.timestamp);
          const showDay = !prev || formatDay(prev.timestamp) !== day;

          return (
            <Fragment key={message.id}>
              {showDay && <div className="messages__day">{day}</div>}
              <div className={`message ${message.fromMe ? 'message--out' : 'message--in'}`}>
                <span className={`message__text ${message.media ? 'message__text--media' : ''}`}>{message.text}</span>
                <span className="message__meta">
                  {formatTime(message.timestamp)}
                  {message.fromMe && <StatusIcon status={message.status} />}
                </span>
              </div>
              {message.status === 'error' && (
                <button className="message__retry" onClick={() => onRetry(message)}>
                  Не отправлено, повторить
                </button>
              )}
            </Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
