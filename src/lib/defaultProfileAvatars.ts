type DefaultProfileAvatar = {
  emoji: string;
  background: string;
};

const DEFAULT_PROFILE_AVATARS: DefaultProfileAvatar[] = [
  { emoji: '🦊', background: 'linear-gradient(135deg, #ffd166 0%, #f4a261 100%)' },
  { emoji: '🐼', background: 'linear-gradient(135deg, #bde0fe 0%, #a2d2ff 100%)' },
  { emoji: '🦋', background: 'linear-gradient(135deg, #cdb4db 0%, #a3c4f3 100%)' },
  { emoji: '🐸', background: 'linear-gradient(135deg, #b7e4c7 0%, #95d5b2 100%)' },
  { emoji: '🐯', background: 'linear-gradient(135deg, #ffc6a5 0%, #ffb4a2 100%)' },
];

const hashSeed = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getDefaultProfileAvatar = (seed?: string | null): DefaultProfileAvatar => {
  const safeSeed = seed?.trim() || 'guest-user';
  const index = hashSeed(safeSeed) % DEFAULT_PROFILE_AVATARS.length;
  return DEFAULT_PROFILE_AVATARS[index];
};

