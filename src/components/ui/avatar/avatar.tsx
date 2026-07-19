import './avatar.css';

export interface LUIAvatarProps {
  /** Image source; when empty, the initials fallback is shown. */
  imageUrl?: string | null;
  /** Full name used to derive the fallback initials. */
  name?: string;
  /** Any CSS length, applied to both width and height. */
  size?: string;
  /** Background color of the initials chip. */
  color?: string;
  /** Text color of the initials chip. */
  textColor?: string;
}

/**
 * Compact user/entity avatar. Shows `imageUrl` when provided, otherwise falls
 * back to initials derived from `name` on a solid color chip.
 *
 * ```tsx
 * <LUIAvatar name="Ada Lovelace" size="40px" />
 * ```
 */
export function LUIAvatar({
  imageUrl = '',
  name = '',
  size = '32px',
  color = 'var(--accent)',
  textColor = 'var(--text-white)',
}: LUIAvatarProps) {
  if (imageUrl) {
    return (
      <img
        className="avatar avatar-image"
        src={imageUrl}
        alt={name}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="avatar avatar-initials"
      style={{ width: size, height: size, background: color, color: textColor }}
    >
      {deriveInitials(name)}
    </span>
  );
}

function deriveInitials(name: string): string {
  const value = name.trim();
  if (!value) return '';

  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
