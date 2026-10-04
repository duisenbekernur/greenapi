export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`;
  return digits;
}

export function formatPhone(phone: string) {
  return `+${phone}`;
}

export function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatChatDate(timestamp: number) {
  const date = new Date(timestamp * 1000);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) return formatTime(timestamp);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export function formatDay(timestamp: number) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return 'Сегодня';
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function getInitials(title: string) {
  const letters = title
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]);

  return letters.join('').toUpperCase() || '?';
}

const avatarColors = ['#e17076', '#7bc862', '#65aadd', '#a695e7', '#ee7aae', '#6ec9cb', '#faa774'];

export function getAvatarColor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash + char.charCodeAt(0)) % avatarColors.length;
  return avatarColors[hash];
}
