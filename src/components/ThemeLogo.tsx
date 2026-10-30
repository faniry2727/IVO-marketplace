import { Store } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { LogoPlacement } from '@/types/theme';

const sizeMultipliers: Record<string, number> = { sm: 0.7, md: 1, lg: 1.4 };

interface ThemeLogoProps {
  placement?: LogoPlacement;
  size?: 'sm' | 'md' | 'lg';
  light?: boolean;
}

export function ThemeLogo({ placement = 'main', size = 'md', light = false }: ThemeLogoProps) {
  const { publishedTheme } = useTheme();
  const baseHeight = publishedTheme.settings.logoHeight ?? 40;
  const pxHeight = Math.round(baseHeight * (sizeMultipliers[size] ?? 1));
  const logoUrl = publishedTheme.branding[placement] ?? publishedTheme.branding['main'] ?? null;
  const marketplaceName = publishedTheme.settings.marketplaceName ?? 'Ketrika';

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={marketplaceName}
        className="w-auto object-contain"
        style={{ height: '44px', width: 'auto' }}
      />
    );
  }

  const iconSize = Math.round(pxHeight * 0.75);
  const fontSize = Math.round(pxHeight * 0.45);

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded-lg bg-gradient-to-br from-ketrika-600 to-ketrika-800 text-white shadow-md"
        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
      >
        <Store style={{ width: `${iconSize / 2}px`, height: `${iconSize / 2}px` }} />
      </div>
      <span
        className="font-bold tracking-tight"
        style={{ fontSize: `${fontSize}px`, color: light ? '#ffffff' : '#111827' }}
      >
        {marketplaceName.toUpperCase()}
      </span>
    </div>
  );
}

export { ThemeLogo as Logo };
