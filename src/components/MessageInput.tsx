import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

type Props = {
  onSend: (text: string) => void;
};

const MAX_LENGTH = 4096;

export function MessageInput({ onSend }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [text]);

  function send() {
    const message = text.trim();
    if (!message) return;
    onSend(message);
    setText('');
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  }

  return (
    <div className="composer">
      <div className="composer__field">
        <textarea
          ref={textareaRef}
          className="composer__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение"
          rows={1}
          maxLength={MAX_LENGTH}
          autoFocus
        />
      </div>
      <button
        className="composer__send"
        onClick={send}
        disabled={!text.trim()}
        title="Отправить"
        aria-label="Отправить"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
        </svg>
      </button>
    </div>
  );
}
