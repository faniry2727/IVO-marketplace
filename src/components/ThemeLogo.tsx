import React from 'react';

interface ThemeLogoProps {
  placement?: string;
  size?: 'sm' | 'md' | 'lg';
  light?: boolean;
}

export function ThemeLogo({ size = 'md' }: ThemeLogoProps) {
  const heightClass = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-14' : 'h-11';

  return (
    <div className="flex items-center">
      <img
        src="/logo.svg"
        alt="IVO — Marketplace Malagasy"
        className={`${heightClass} w-auto object-contain cursor-pointer`}
      />
    </div>
  );
}

export { ThemeLogo as Logo };
