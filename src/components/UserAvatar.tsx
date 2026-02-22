import { getDefaultProfileAvatar } from '@/lib/defaultProfileAvatars';

type UserAvatarProps = {
  seed?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'w-10 h-10 text-lg',
  md: 'w-12 h-12 text-xl',
  lg: 'w-16 h-16 text-2xl',
};

const UserAvatar = ({ seed, size = 'md', className = '' }: UserAvatarProps) => {
  const avatar = getDefaultProfileAvatar(seed);

  return (
    <div
      className={`rounded-2xl flex items-center justify-center shadow-sm border border-white/40 ${sizeClasses[size]} ${className}`}
      style={{ background: avatar.background }}
      aria-label="Profile avatar"
    >
      <span className="leading-none">{avatar.emoji}</span>
    </div>
  );
};

export default UserAvatar;

