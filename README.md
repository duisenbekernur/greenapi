# GREEN-API Telegram Chat

Чат для отправки и получения сообщений в Telegram через GREEN-API.

React, TypeScript, Vite.

## Запуск

Нужен Node.js 20.19+ или 22.12+.

```bash
git clone https://github.com/duisenbekernur/greenapi.git
cd greenapi
npm install
npm run dev
```

Открыть http://localhost:5173

Сборка:

```bash
npm run build
npm run preview
```

## Настройка инстанса

1. Создать инстанс Telegram в [console.green-api.com](https://console.green-api.com) и авторизовать его по QR-коду.
2. В настройках инстанса оставить `webhookUrl` пустым и включить входящие уведомления.
3. На странице входа ввести `idInstance` и `apiTokenInstance`. API URL можно не заполнять.

`.env` не обязателен. В `.env.example` есть `VITE_GREEN_API_URL`, если нужно задать API URL по умолчанию.

## Использование

1. Ввести номер получателя, например `+7 701 123 45 67`, и нажать «Открыть».
2. Написать сообщение. Enter отправляет, Shift+Enter переносит строку.
3. Ответ появится в чате.
