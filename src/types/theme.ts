export type LogoPlacement = 'main' | 'mobile' | 'footer' | 'backoffice' | 'login' | 'favicon' | 'og_image';

export interface ThemeBranding {
  main?: string | null;
  mobile?: string | null;
  footer?: string | null;
  backoffice?: string | null;
  login?: string | null;
  favicon?: string | null;
  og_image?: string | null;
}

export interface ThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
  textMuted?: string;
  border?: string;
  success?: string;
  warning?: string;
  error?: string;
}

export interface ThemeTypography {
  headingFont?: string;
  bodyFont?: string;
}

export interface ThemeStyle {
  buttonRadius?: string;
  cardRadius?: string;
  inputRadius?: string;
  shadow?: string;
}

export interface ThemeHeaderFooter {
  logoKey?: LogoPlacement;
  bgColor?: string;
  textColor?: string;
}

export interface ThemeSettings {
  logoHeight?: number;
  browserTitle?: string;
  marketplaceName?: string;
  reassignmentDelayMinutes?: number;
  suspensionMessageClient?: string;
  suspensionMessageSeller?: string;
  suspensionMessageDriver?: string;
}

export interface ThemeConfig {
  branding: ThemeBranding;
  colors: ThemeColors;
  typography: ThemeTypography;
  style: ThemeStyle;
  header: ThemeHeaderFooter;
  footer: ThemeHeaderFooter;
  settings: ThemeSettings;
}

export interface SiteTheme {
  id: string;
  status: 'draft' | 'published';
  branding: ThemeBranding;
  colors: ThemeColors;
  typography: ThemeTypography;
  style: ThemeStyle;
  header: ThemeHeaderFooter;
  footer: ThemeHeaderFooter;
  settings: ThemeSettings;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_THEME: ThemeConfig = {
  branding: { main: "https://ihmncbkgixafdjkdfsen.supabase.co/storage/v1/object/public/theme-assets/logos/main-1791046654820.png", footer: "https://ihmncbkgixafdjkdfsen.supabase.co/storage/v1/object/public/theme-assets/logos/main-1791046654820.png" },
  colors: {
    primary: '#15803d',
    secondary: '#166534',
    accent: '#eab308',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
  },
  style: {
    buttonRadius: '0.5rem',
    cardRadius: '0.75rem',
    inputRadius: '0.5rem',
    shadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
  },
  header: {
    logoKey: 'main',
    bgColor: '#ffffff',
    textColor: '#111827',
  },
  footer: {
    logoKey: 'footer',
    bgColor: '#ffffff',
    textColor: '#6b7280',
  },
  settings: {
    logoHeight: 48,
    browserTitle: 'IVO — Marketplace Malagasy',
    marketplaceName: 'IVO',
    reassignmentDelayMinutes: 30,
    suspensionMessageClient: 'Votre compte client a été suspendu par un administrateur. Contactez le support pour plus d\'informations.',
    suspensionMessageSeller: 'Votre compte vendeur a été suspendu par un administrateur. Contactez le support pour plus d\'informations.',
    suspensionMessageDriver: 'Votre compte livreur a été suspendu par un administrateur. Contactez le support pour plus d\'informations.',
  },
};

const CSS_VAR_MAP: Record<keyof ThemeColors, string> = {
  primary: '--theme-primary',
  secondary: '--theme-secondary',
  accent: '--theme-accent',
  background: '--theme-background',
  surface: '--theme-surface',
  text: '--theme-text',
  textMuted: '--theme-text-muted',
  border: '--theme-border',
  success: '--theme-success',
  warning: '--theme-warning',
  error: '--theme-error',
};

export function applyThemeToDOM(theme: ThemeConfig) {
  const root = document.documentElement;

  (Object.keys(theme.colors) as (keyof ThemeColors)[]).forEach((key) => {
    const val = theme.colors[key];
    if (val) root.style.setProperty(CSS_VAR_MAP[key], val);
  });

  if (theme.typography.bodyFont) {
    root.style.setProperty('--theme-font-body', `"${theme.typography.bodyFont}", system-ui, sans-serif`);
  }
  if (theme.typography.headingFont) {
    root.style.setProperty('--theme-font-heading', `"${theme.typography.headingFont}", system-ui, sans-serif`);
  }

  if (theme.style.buttonRadius) root.style.setProperty('--theme-radius-btn', theme.style.buttonRadius);
  if (theme.style.cardRadius) root.style.setProperty('--theme-radius-card', theme.style.cardRadius);
  if (theme.style.inputRadius) root.style.setProperty('--theme-radius-input', theme.style.inputRadius);
  if (theme.style.shadow) root.style.setProperty('--theme-shadow', theme.style.shadow);

  if (theme.settings.logoHeight) {
    root.style.setProperty('--theme-logo-height', `${theme.settings.logoHeight}px`);
  }

  // Browser tab title
  if (theme.settings.browserTitle) {
    document.title = theme.settings.browserTitle;
  }
}

export function getLogoUrl(theme: ThemeConfig | null, placement: LogoPlacement): string | null {
  if (!theme) return null;
  return theme.branding[placement] ?? null;
}

export function mergeTheme(published: ThemeConfig, draft: ThemeConfig): ThemeConfig {
  return {
    branding: { ...published.branding, ...draft.branding },
    colors: { ...published.colors, ...draft.colors },
    typography: { ...published.typography, ...draft.typography },
    style: { ...published.style, ...draft.style },
    header: { ...published.header, ...draft.header },
    footer: { ...published.footer, ...draft.footer },
    settings: { ...published.settings, ...draft.settings },
  };
}

export function dbRowToConfig(row: SiteTheme | null): ThemeConfig {
  if (!row) return DEFAULT_THEME;
  return {
    branding: row.branding || {},
    colors: { ...DEFAULT_THEME.colors, ...row.colors },
    typography: { ...DEFAULT_THEME.typography, ...row.typography },
    style: { ...DEFAULT_THEME.style, ...row.style },
    header: { ...DEFAULT_THEME.header, ...row.header },
    footer: { ...DEFAULT_THEME.footer, ...row.footer },
    settings: { ...DEFAULT_THEME.settings, ...row.settings },
  };
}
