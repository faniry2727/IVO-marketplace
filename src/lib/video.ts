import type { ThemeConfig } from '@/types/theme';

export const DEFAULT_SUSPENSION_MESSAGES = {
  client: 'Votre compte client a été suspendu par un administrateur. Contactez le support pour plus d\'informations.',
  seller: 'Votre compte vendeur a été suspendu par un administrateur. Contactez le support pour plus d\'informations.',
  driver: 'Votre compte livreur a été suspendu par un administrateur. Contactez le support pour plus d\'informations.',
};

export function getSuspensionMessage(
  theme: ThemeConfig | null,
  role: 'client' | 'seller' | 'driver'
): string {
  if (!theme) return DEFAULT_SUSPENSION_MESSAGES[role];
  const settings = theme.settings;
  if (role === 'client' && settings.suspensionMessageClient) return settings.suspensionMessageClient;
  if (role === 'seller' && settings.suspensionMessageSeller) return settings.suspensionMessageSeller;
  if (role === 'driver' && settings.suspensionMessageDriver) return settings.suspensionMessageDriver;
  return DEFAULT_SUSPENSION_MESSAGES[role];
}

const VALID_VIDEO_PROTOCOLS = ['https:', 'http:'];

export function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return VALID_VIDEO_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

const SHARE_PLATFORMS = ['facebook'] as const;
export type SharePlatform = (typeof SHARE_PLATFORMS)[number];
export const AVAILABLE_SHARE_PLATFORMS = SHARE_PLATFORMS;

export function buildFacebookShareUrl(videoUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`;
}
