import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import {
  type ThemeConfig, type SiteTheme,
  DEFAULT_THEME, applyThemeToDOM, dbRowToConfig,
} from '@/types/theme';

interface ThemeContextValue {
  publishedTheme: ThemeConfig;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [publishedTheme, setPublishedTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  async function fetchPublished() {
    const { data } = await supabase
      .from('site_themes')
      .select('*')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const config = dbRowToConfig(data as SiteTheme | null);
    setPublishedTheme(config);
    setLoading(false);
  }

  useEffect(() => {
    fetchPublished();
  }, []);

  useEffect(() => {
    applyThemeToDOM(publishedTheme);

    // Favicon
    const favUrl = publishedTheme.branding.favicon;
    let favLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favUrl) {
      if (!favLink) {
        favLink = document.createElement('link');
        favLink.rel = 'icon';
        document.head.appendChild(favLink);
      }
      favLink.href = favUrl;
    }

    // Open Graph image
    const ogUrl = publishedTheme.branding.og_image;
    let ogTag = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
    if (ogUrl) {
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', 'og:image');
        document.head.appendChild(ogTag);
      }
      ogTag.content = ogUrl;
    }
  }, [publishedTheme]);

  return (
    <ThemeContext.Provider value={{ publishedTheme, loading, refresh: fetchPublished }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
