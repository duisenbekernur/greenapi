import { getAvatarColor, getInitials } from '../utils/format';

type Props = {
  id: string;
  title: string;
  size?: number;
};

export function Avatar({ id, title, size = 48 }: Props) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, background: getAvatarColor(id) }}
    >
      {getInitials(title)}
    </div>
  );
}
