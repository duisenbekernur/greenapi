import { useState, type FormEvent } from 'react';
import { ApiError, getDefaultApiUrl, getSettings, getStateInstance } from '../api/greenApi';
import type { Credentials } from '../types';

type Props = {
  onLogin: (credentials: Credentials) => void;
};

const stateErrors: Record<string, string> = {
  notAuthorized: 'Инстанс не авторизован',
  pendingPassword: 'Инстанс ждёт пароль от Telegram',
  blocked: 'Аккаунт заблокирован',
  suspended: 'Аккаунт временно ограничен',
  starting: 'Инстанс запускается, попробуйте через пару минут',
};

export function LoginForm({ onLogin }: Props) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultApiUrl = getDefaultApiUrl(idInstance);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const id = idInstance.trim();
    const token = apiTokenInstance.trim();

    if (!/^\d+$/.test(id)) {
      setError('idInstance должен быть числом');
      return;
    }
    if (!token) {
      setError('Введите apiTokenInstance');
      return;
    }

    const credentials = { idInstance: id, apiTokenInstance: token, apiUrl: apiUrl.trim() || defaultApiUrl };

    setIsLoading(true);
    setError(null);

    try {
      const { stateInstance } = await getStateInstance(credentials);
      if (stateInstance !== 'authorized') {
        setError(stateErrors[stateInstance] ?? `Инстанс недоступен: ${stateInstance}`);
        return;
      }

      const settings = await getSettings(credentials);
      if (settings.webhookUrl) {
        setError('Очистите webhookUrl в настройках инстанса');
        return;
      }
      if (settings.incomingWebhook !== 'yes') {
        setError('Включите входящие уведомления в настройках инстанса');
        return;
      }

      onLogin(credentials);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось подключиться');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <h1 className="login__title">Вход</h1>
        <p className="login__subtitle">
          Данные инстанса из{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            GREEN-API
          </a>
        </p>

        <label className="field">
          <span className="field__label">idInstance</span>
          <input
            className="field__input"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field__label">apiTokenInstance</span>
          <input
            className="field__input"
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span className="field__label">API URL (необязательно)</span>
          <input
            className="field__input"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder={defaultApiUrl}
            autoComplete="off"
          />
        </label>

        {error && <div className="alert">{error}</div>}

        <button className="button" type="submit" disabled={isLoading}>
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
