import { useEffect, useState, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import {
  type ThemeConfig, type SiteTheme, type LogoPlacement,
  DEFAULT_THEME, applyThemeToDOM, dbRowToConfig,
} from '@/types/theme';
import type { SiteImage } from '@/types';
import {
  Image, Plus, Trash2, Eye, EyeOff, MoveUp, MoveDown,
  Palette, Type, Square, Layout, Save, Send, RotateCcw,
  Upload, Check, Store, Settings, MessageSquare,
} from 'lucide-react';

const SECTIONS = [
  { value: 'hero_banner', label: 'Bannière principale' },
  { value: 'promo', label: 'Visuel promotionnel' },
  { value: 'feature', label: 'Image fonctionnalité' },
];

const LOGO_PLACEMENTS: { key: LogoPlacement; label: string }[] = [
  { key: 'main', label: 'Logo principal' },
  { key: 'mobile', label: 'Logo mobile' },
  { key: 'footer', label: 'Logo footer' },
  { key: 'backoffice', label: 'Logo backoffice' },
  { key: 'login', label: 'Logo page de connexion' },
  { key: 'favicon', label: 'Favicon' },
  { key: 'og_image', label: 'Image Open Graph' },
];

const COLOR_KEYS: { key: keyof ThemeConfig['colors']; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'textMuted', label: 'Text muted' },
  { key: 'border', label: 'Border' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'error', label: 'Error' },
];

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (défaut)' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
];

const SHADOW_OPTIONS = [
  { value: '0 1px 2px 0 rgba(0,0,0,0.05)', label: 'Légère (défaut)' },
  { value: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)', label: 'Douce' },
  { value: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', label: 'Moyenne' },
  { value: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', label: 'Prononcée' },
  { value: 'none', label: 'Aucune' },
];

const RADIUS_OPTIONS = [
  { value: '0rem', label: 'Aucun' },
  { value: '0.25rem', label: 'Petit' },
  { value: '0.5rem', label: 'Moyen (défaut)' },
  { value: '0.75rem', label: 'Grand' },
  { value: '1rem', label: 'Très grand' },
  { value: '1.5rem', label: 'Arrondi' },
  { value: '9999px', label: 'Pilule' },
];

const LOGO_KEY_OPTIONS: { value: LogoPlacement; label: string }[] = [
  { value: 'main', label: 'Logo principal' },
  { value: 'mobile', label: 'Logo mobile' },
  { value: 'footer', label: 'Logo footer' },
  { value: 'backoffice', label: 'Logo backoffice' },
  { value: 'login', label: 'Logo page de connexion' },
];

type Tab = 'images' | 'branding' | 'colors' | 'typography' | 'style' | 'headerfooter' | 'settings' | 'messages';

const FONT_LINKS: Record<string, string> = {
  Inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  Poppins: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  Roboto: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  Montserrat: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
  'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap',
  Lato: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
  Nunito: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap',
  Raleway: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap',
  'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
  Merriweather: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap',
};

function ensureFontLink(fontName: string) {
  const href = FONT_LINKS[fontName];
  if (!href) return;
  const existing = document.querySelector(`link[href="${href}"]`);
  if (!existing) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function DefaultLogoPreview({ size = 'sm', name = 'Ketrika' }: { size?: 'sm' | 'md' | 'lg'; name?: string }) {
  const dims = { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-12 w-12' };
  const text = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' };
  return (
    <div className="flex items-center gap-2">
      <div className={`flex ${dims[size]} items-center justify-center rounded-lg bg-gradient-to-br from-ketrika-600 to-ketrika-800 text-white shadow-md`}>
        <Store className="h-1/2 w-1/2" />
      </div>
      <span className={`${text[size]} font-bold tracking-tight text-gray-900`}>{name.toUpperCase()}</span>
    </div>
  );
}

export function AdminDesign() {
  const { publishedTheme, refresh } = useTheme();
  const [tab, setTab] = useState<Tab>('images');

  // Images section (existing)
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [form, setForm] = useState({ section: 'hero_banner', title: '', image_url: '', link_url: '' });

  // Theme section
  const [draftTheme, setDraftTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [publishedConfig, setPublishedConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [hasDraft, setHasDraft] = useState(false);
  const [themeLoading, setThemeLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState<LogoPlacement | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchImages = useCallback(async () => {
    const { data } = await supabase.from('site_images').select('*').order('section, sort_order, created_at');
    setImages(data || []);
    setLoading(false);
  }, []);

  const fetchThemes = useCallback(async () => {
    const [pubRes, draftRes] = await Promise.all([
      supabase.from('site_themes').select('*').eq('status', 'published').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('site_themes').select('*').eq('status', 'draft').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    const pubConfig = dbRowToConfig(pubRes.data as SiteTheme | null);
    setPublishedConfig(pubConfig);

    if (draftRes.data) {
      const draftConfig = dbRowToConfig(draftRes.data as SiteTheme);
      setDraftTheme(draftConfig);
      setHasDraft(true);
    } else {
      setDraftTheme(deepClone(pubConfig));
      setHasDraft(false);
    }
    setThemeLoading(false);
  }, []);

  useEffect(() => {
    fetchImages();
    fetchThemes();
  }, [fetchImages, fetchThemes]);

  // Preview mode: apply draft to DOM; on exit, reapply published
  useEffect(() => {
    if (previewMode) {
      applyThemeToDOM(draftTheme);
    } else {
      applyThemeToDOM(publishedTheme);
    }
  }, [previewMode]); // eslint-disable-line

  function updateDraft(partial: Partial<ThemeConfig>) {
    setDraftTheme((prev) => ({ ...prev, ...partial }));
  }

  function updateBranding(key: LogoPlacement, url: string | null) {
    setDraftTheme((prev) => ({ ...prev, branding: { ...prev.branding, [key]: url } }));
  }

  function updateColor(key: keyof ThemeConfig['colors'], value: string) {
    setDraftTheme((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  }

  function updateSettings(key: keyof ThemeConfig['settings'], value: string | number) {
    setDraftTheme((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));
  }

  async function uploadLogo(key: LogoPlacement, file: File) {
    setUploadingLogo(key);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `logos/${key}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('theme-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      alert('Erreur upload: ' + uploadError.message);
      setUploadingLogo(null);
      return;
    }

    const { data: urlData } = supabase.storage.from('theme-assets').getPublicUrl(fileName);
    updateBranding(key, urlData.publicUrl);
    setUploadingLogo(null);
  }

  async function saveDraft() {
    setSaving(true);
    const payload = {
      status: 'draft',
      branding: draftTheme.branding,
      colors: draftTheme.colors,
      typography: draftTheme.typography,
      style: draftTheme.style,
      header: draftTheme.header,
      footer: draftTheme.footer,
      settings: draftTheme.settings,
    };

    const { data: existing } = await supabase
      .from('site_themes')
      .select('id')
      .eq('status', 'draft')
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from('site_themes').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('site_themes').insert(payload);
    }

    setHasDraft(true);
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  async function publishTheme() {
    setPublishing(true);
    const payload = {
      status: 'published' as const,
      branding: draftTheme.branding,
      colors: draftTheme.colors,
      typography: draftTheme.typography,
      style: draftTheme.style,
      header: draftTheme.header,
      footer: draftTheme.footer,
      settings: draftTheme.settings,
    };

    // Delete old published, insert new
    await supabase.from('site_themes').delete().eq('status', 'published');
    await supabase.from('site_themes').insert(payload);

    // Delete draft
    await supabase.from('site_themes').delete().eq('status', 'draft');

    setHasDraft(false);
    setPreviewMode(false);
    setPublishedConfig(deepClone(draftTheme));
    await refresh();
    setPublishing(false);
  }

  async function cancelDraft() {
    if (!confirm('Annuler toutes les modifications du brouillon ?')) return;
    await supabase.from('site_themes').delete().eq('status', 'draft');
    setDraftTheme(deepClone(publishedConfig));
    setHasDraft(false);
    setPreviewMode(false);
  }

  function triggerFileInput(key: LogoPlacement) {
    fileInputRefs.current[key]?.click();
  }

  function handleFileSelect(key: LogoPlacement, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadLogo(key, file);
    e.target.value = '';
  }

  // Images handlers (existing)
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image_url) return;
    const maxSort = images.filter((i) => i.section === form.section).reduce((max, i) => Math.max(max, i.sort_order), 0);
    await supabase.from('site_images').insert({
      section: form.section, title: form.title || null, image_url: form.image_url,
      link_url: form.link_url || null, sort_order: maxSort + 1, is_active: true,
    });
    setShowForm(false);
    setForm({ section: 'hero_banner', title: '', image_url: '', link_url: '' });
    fetchImages();
  }

  async function toggleActive(img: SiteImage) {
    setActionLoading(img.id);
    await supabase.from('site_images').update({ is_active: !img.is_active }).eq('id', img.id);
    setActionLoading(null);
    fetchImages();
  }

  async function deleteImage(img: SiteImage) {
    setActionLoading(img.id);
    await supabase.from('site_images').delete().eq('id', img.id);
    setActionLoading(null);
    fetchImages();
  }

  async function moveImage(img: SiteImage, direction: 'up' | 'down') {
    const sectionImages = images.filter((i) => i.section === img.section).sort((a, b) => a.sort_order - b.sort_order);
    const idx = sectionImages.findIndex((i) => i.id === img.id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sectionImages.length - 1) return;
    const swap = direction === 'up' ? sectionImages[idx - 1] : sectionImages[idx + 1];
    await Promise.all([
      supabase.from('site_images').update({ sort_order: swap.sort_order }).eq('id', img.id),
      supabase.from('site_images').update({ sort_order: img.sort_order }).eq('id', swap.id),
    ]);
    fetchImages();
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'images', label: 'Images', icon: <Image className="h-4 w-4" /> },
    { key: 'branding', label: 'Branding', icon: <Store className="h-4 w-4" /> },
    { key: 'colors', label: 'Couleurs', icon: <Palette className="h-4 w-4" /> },
    { key: 'typography', label: 'Typographie', icon: <Type className="h-4 w-4" /> },
    { key: 'style', label: 'Style', icon: <Square className="h-4 w-4" /> },
    { key: 'headerfooter', label: 'Header / Footer', icon: <Layout className="h-4 w-4" /> },
    { key: 'settings', label: 'Paramètres', icon: <Settings className="h-4 w-4" /> },
    { key: 'messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout title="Design du site">
      {/* Draft/Published status bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            hasDraft ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
          }`}>
            {hasDraft ? <><Square className="h-3 w-3 fill-current" /> Brouillon en cours</> : <><Check className="h-3 w-3" /> Publié</>}
          </span>
          {previewMode && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
              <Eye className="h-3 w-3" /> Prévisualisation active
            </span>
          )}
        </div>
        {tab !== 'images' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                previewMode ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {previewMode ? <><EyeOff className="h-4 w-4" /> Quitter l'aperçu</> : <><Eye className="h-4 w-4" /> Prévisualiser</>}
            </button>
            <button onClick={saveDraft} disabled={saving} className="btn-secondary">
              <Save className="h-4 w-4" />
              {saving ? '...' : 'Enregistrer'}
            </button>
            {hasDraft && (
              <button onClick={cancelDraft} className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                <RotateCcw className="h-4 w-4" />
                Annuler
              </button>
            )}
            <button onClick={publishTheme} disabled={publishing} className="btn-primary">
              <Send className="h-4 w-4" />
              {publishing ? '...' : 'Publier'}
            </button>
            {savedFlash && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                <Check className="h-4 w-4" /> Enregistré
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPreviewMode(false); }}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-ketrika-600 text-ketrika-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* === IMAGES TAB === */}
      {tab === 'images' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Gérez les images affichées sur la page d'accueil.</p>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              <Plus className="h-4 w-4" />
              {showForm ? 'Annuler' : 'Ajouter une image'}
            </button>
          </div>

          {showForm && (
            <div className="card mb-6 p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Nouvelle image</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label-text">Section</label>
                    <select className="input-field" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
                      {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Titre (optionnel)</label>
                    <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Promotion Noël" />
                  </div>
                </div>
                <div>
                  <label className="label-text">URL de l'image</label>
                  <input className="input-field" required value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label className="label-text">Lien (optionnel)</label>
                  <input className="input-field" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
                </div>
                {form.image_url && (
                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="mb-2 text-xs font-medium text-gray-500">Aperçu</p>
                    <img src={form.image_url} alt="Aperçu" className="max-h-48 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                <button type="submit" className="btn-primary">Publier l'image</button>
              </form>
            </div>
          )}

          {loading ? (
            <div className="card p-8 text-center text-gray-500">Chargement...</div>
          ) : images.length === 0 ? (
            <div className="card p-8 text-center">
              <Image className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-gray-500">Aucune image. Ajoutez votre première image !</p>
            </div>
          ) : (
            <div className="space-y-6">
              {SECTIONS.map((section) => {
                const sectionImages = images.filter((i) => i.section === section.value).sort((a, b) => a.sort_order - b.sort_order);
                if (sectionImages.length === 0) return null;
                return (
                  <div key={section.value}>
                    <h3 className="mb-3 text-sm font-bold text-gray-500 uppercase tracking-wide">{section.label}</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {sectionImages.map((img) => (
                        <div key={img.id} className={`card overflow-hidden ${!img.is_active ? 'opacity-60' : ''}`}>
                          <div className="relative aspect-video bg-gray-100">
                            <img src={img.image_url} alt={img.title || ''} className="h-full w-full object-cover" />
                            <div className="absolute right-2 top-2 flex gap-1">
                              <button onClick={() => moveImage(img, 'up')} className="rounded-lg bg-white/90 p-1.5 text-gray-600 hover:bg-white shadow-sm" title="Monter">
                                <MoveUp className="h-4 w-4" />
                              </button>
                              <button onClick={() => moveImage(img, 'down')} className="rounded-lg bg-white/90 p-1.5 text-gray-600 hover:bg-white shadow-sm" title="Descendre">
                                <MoveDown className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="p-3">
                            {img.title && <p className="text-sm font-semibold text-gray-900">{img.title}</p>}
                            {img.link_url && <p className="text-xs text-ketrika-600 truncate">{img.link_url}</p>}
                            <div className="mt-3 flex gap-2">
                              <button onClick={() => toggleActive(img)} disabled={actionLoading === img.id} className="btn-secondary flex-1 text-xs">
                                {img.is_active ? <><EyeOff className="h-3.5 w-3.5" />Masquer</> : <><Eye className="h-3.5 w-3.5" />Afficher</>}
                              </button>
                              <button onClick={() => deleteImage(img)} disabled={actionLoading === img.id} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
                                <Trash2 className="h-3.5 w-3.5" />
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* === BRANDING TAB === */}
      {tab === 'branding' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Uploadez un logo pour chaque emplacement. Si aucun logo n'est configuré, le logo par défaut (icône + texte « KETRIKA ») est utilisé automatiquement.
          </p>
          {themeLoading ? (
            <div className="card p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {LOGO_PLACEMENTS.map((placement) => {
                const url = draftTheme.branding[placement.key] ?? null;
                const isFavicon = placement.key === 'favicon';
                const isOG = placement.key === 'og_image';
                return (
                  <div key={placement.key} className="card p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{placement.label}</h4>
                      {url && (
                        <button
                          onClick={() => updateBranding(placement.key, null)}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>

                    {/* Preview */}
                    <div className="mb-4 flex min-h-[80px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-4">
                      {url ? (
                        isFavicon ? (
                          <div className="flex flex-col items-center gap-2">
                            <img src={url} alt={placement.label} className="h-8 w-8 object-contain" />
                            <span className="text-xs text-gray-400">Favicon</span>
                          </div>
                        ) : isOG ? (
                          <div className="flex flex-col items-center gap-2">
                            <img src={url} alt={placement.label} className="max-h-16 max-w-full rounded object-cover" />
                            <span className="text-xs text-gray-400">1200×630 recommandé</span>
                          </div>
                        ) : (
                          <img src={url} alt={placement.label} className="max-h-16 max-w-full object-contain" />
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-60">
                          {isFavicon ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-ketrika-600 to-ketrika-800 text-white">
                              <Store className="h-4 w-4" />
                            </div>
                          ) : (
                            <DefaultLogoPreview size="sm" name={draftTheme.settings.marketplaceName || 'Ketrika'} />
                          )}
                          <span className="text-xs text-gray-400">Logo par défaut</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => triggerFileInput(placement.key)}
                        disabled={uploadingLogo === placement.key}
                        className="btn-secondary flex-1 text-sm"
                      >
                        {uploadingLogo === placement.key ? (
                          '...'
                        ) : url ? (
                          <><Upload className="h-4 w-4" /> Remplacer</>
                        ) : (
                          <><Upload className="h-4 w-4" /> Uploader</>
                        )}
                      </button>
                      {url && (
                        <button
                          onClick={() => updateBranding(placement.key, null)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <input
                        ref={(el) => { fileInputRefs.current[placement.key] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(placement.key, e)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === COLORS TAB === */}
      {tab === 'colors' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Modifiez les couleurs principales du site. Les nuances intermédiaires sont générées automatiquement.
          </p>
          {themeLoading ? (
            <div className="card p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {COLOR_KEYS.map((color) => (
                <div key={color.key} className="card p-4">
                  <label className="label-text">{color.label}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={draftTheme.colors[color.key] || '#000000'}
                      onChange={(e) => updateColor(color.key, e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200"
                    />
                    <input
                      type="text"
                      value={draftTheme.colors[color.key] || ''}
                      onChange={(e) => updateColor(color.key, e.target.value)}
                      className="input-field flex-1 font-mono text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Color preview */}
          <div className="card p-6">
            <h4 className="mb-4 text-sm font-bold text-gray-500 uppercase tracking-wide">Aperçu</h4>
            <div className="flex flex-wrap gap-3">
              {COLOR_KEYS.map((color) => (
                <div key={color.key} className="flex flex-col items-center gap-1.5">
                  <div
                    className="h-12 w-12 rounded-lg border border-gray-200"
                    style={{ backgroundColor: draftTheme.colors[color.key] || 'transparent' }}
                  />
                  <span className="text-xs text-gray-500">{color.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === TYPOGRAPHY TAB === */}
      {tab === 'typography' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Choisissez les polices du site. Les tailles et espacements actuels sont conservés.
          </p>
          {themeLoading ? (
            <div className="card p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card p-5">
                <label className="label-text">Police des titres</label>
                <select
                  className="input-field"
                  value={draftTheme.typography.headingFont || 'Inter'}
                  onChange={(e) => {
                    ensureFontLink(e.target.value);
                    updateDraft({ typography: { ...draftTheme.typography, headingFont: e.target.value } });
                  }}
                >
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <div className="mt-3 rounded-lg bg-gray-50 p-4">
                  <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: `"${draftTheme.typography.headingFont}", system-ui, sans-serif` }}>
                    Aa Bb Cc — Titre
                  </p>
                </div>
              </div>
              <div className="card p-5">
                <label className="label-text">Police principale (corps de texte)</label>
                <select
                  className="input-field"
                  value={draftTheme.typography.bodyFont || 'Inter'}
                  onChange={(e) => {
                    ensureFontLink(e.target.value);
                    updateDraft({ typography: { ...draftTheme.typography, bodyFont: e.target.value } });
                  }}
                >
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <div className="mt-3 rounded-lg bg-gray-50 p-4">
                  <p className="text-base text-gray-700" style={{ fontFamily: `"${draftTheme.typography.bodyFont}", system-ui, sans-serif` }}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === STYLE TAB === */}
      {tab === 'style' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Ajustez l'arrondi des éléments et l'ombre globale des cartes.
          </p>
          {themeLoading ? (
            <div className="card p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card p-5">
                <label className="label-text">Radius des boutons</label>
                <select
                  className="input-field"
                  value={draftTheme.style.buttonRadius || '0.5rem'}
                  onChange={(e) => updateDraft({ style: { ...draftTheme.style, buttonRadius: e.target.value } })}
                >
                  {RADIUS_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <div className="mt-3 flex items-center gap-3">
                  <button className="btn-primary" style={{ borderRadius: draftTheme.style.buttonRadius }}>
                    Bouton exemple
                  </button>
                </div>
              </div>
              <div className="card p-5">
                <label className="label-text">Radius des cartes</label>
                <select
                  className="input-field"
                  value={draftTheme.style.cardRadius || '0.75rem'}
                  onChange={(e) => updateDraft({ style: { ...draftTheme.style, cardRadius: e.target.value } })}
                >
                  {RADIUS_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <div className="mt-3">
                  <div className="card p-4" style={{ borderRadius: draftTheme.style.cardRadius }}>
                    <p className="text-sm text-gray-600">Carte exemple</p>
                  </div>
                </div>
              </div>
              <div className="card p-5">
                <label className="label-text">Radius des inputs</label>
                <select
                  className="input-field"
                  value={draftTheme.style.inputRadius || '0.5rem'}
                  onChange={(e) => updateDraft({ style: { ...draftTheme.style, inputRadius: e.target.value } })}
                >
                  {RADIUS_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <div className="mt-3">
                  <input className="input-field" placeholder="Input exemple" style={{ borderRadius: draftTheme.style.inputRadius }} />
                </div>
              </div>
              <div className="card p-5">
                <label className="label-text">Ombre globale</label>
                <select
                  className="input-field"
                  value={draftTheme.style.shadow || SHADOW_OPTIONS[0].value}
                  onChange={(e) => updateDraft({ style: { ...draftTheme.style, shadow: e.target.value } })}
                >
                  {SHADOW_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <div className="mt-3">
                  <div className="card p-4" style={{ boxShadow: draftTheme.style.shadow }}>
                    <p className="text-sm text-gray-600">Carte avec ombre</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === HEADER / FOOTER TAB === */}
      {tab === 'headerfooter' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Configurez le header et le footer du site public.
          </p>
          {themeLoading ? (
            <div className="card p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Header */}
              <div className="card p-5">
                <h4 className="mb-4 text-lg font-bold text-gray-900">Header</h4>
                <div className="space-y-4">
                  <div>
                    <label className="label-text">Logo utilisé</label>
                    <select
                      className="input-field"
                      value={draftTheme.header.logoKey || 'main'}
                      onChange={(e) => updateDraft({ header: { ...draftTheme.header, logoKey: e.target.value as LogoPlacement } })}
                    >
                      {LOGO_KEY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Couleur de fond</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={draftTheme.header.bgColor || '#ffffff'}
                        onChange={(e) => updateDraft({ header: { ...draftTheme.header, bgColor: e.target.value } })}
                        className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200"
                      />
                      <input
                        type="text"
                        value={draftTheme.header.bgColor || ''}
                        onChange={(e) => updateDraft({ header: { ...draftTheme.header, bgColor: e.target.value } })}
                        className="input-field flex-1 font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Couleur du texte</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={draftTheme.header.textColor || '#111827'}
                        onChange={(e) => updateDraft({ header: { ...draftTheme.header, textColor: e.target.value } })}
                        className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200"
                      />
                      <input
                        type="text"
                        value={draftTheme.header.textColor || ''}
                        onChange={(e) => updateDraft({ header: { ...draftTheme.header, textColor: e.target.value } })}
                        className="input-field flex-1 font-mono text-xs"
                      />
                    </div>
                  </div>
                  {/* Header preview */}
                  <div className="rounded-lg border border-gray-200 p-3" style={{ backgroundColor: draftTheme.header.bgColor || '#fff' }}>
                    <div className="flex items-center justify-between">
                      {draftTheme.branding[draftTheme.header.logoKey || 'main'] ? (
                        <img src={draftTheme.branding[draftTheme.header.logoKey || 'main']!} alt="Header logo" className="h-8 w-auto object-contain" />
                      ) : (
                        <DefaultLogoPreview size="sm" name={draftTheme.settings.marketplaceName || 'Ketrika'} />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: draftTheme.header.textColor || '#111827' }}>Connexion</span>
                        <button className="btn-primary text-xs">S'inscrire</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="card p-5">
                <h4 className="mb-4 text-lg font-bold text-gray-900">Footer</h4>
                <div className="space-y-4">
                  <div>
                    <label className="label-text">Logo utilisé</label>
                    <select
                      className="input-field"
                      value={draftTheme.footer.logoKey || 'footer'}
                      onChange={(e) => updateDraft({ footer: { ...draftTheme.footer, logoKey: e.target.value as LogoPlacement } })}
                    >
                      {LOGO_KEY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Couleur de fond</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={draftTheme.footer.bgColor || '#ffffff'}
                        onChange={(e) => updateDraft({ footer: { ...draftTheme.footer, bgColor: e.target.value } })}
                        className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200"
                      />
                      <input
                        type="text"
                        value={draftTheme.footer.bgColor || ''}
                        onChange={(e) => updateDraft({ footer: { ...draftTheme.footer, bgColor: e.target.value } })}
                        className="input-field flex-1 font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Couleur du texte</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={draftTheme.footer.textColor || '#6b7280'}
                        onChange={(e) => updateDraft({ footer: { ...draftTheme.footer, textColor: e.target.value } })}
                        className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200"
                      />
                      <input
                        type="text"
                        value={draftTheme.footer.textColor || ''}
                        onChange={(e) => updateDraft({ footer: { ...draftTheme.footer, textColor: e.target.value } })}
                        className="input-field flex-1 font-mono text-xs"
                      />
                    </div>
                  </div>
                  {/* Footer preview */}
                  <div className="rounded-lg border border-gray-200 p-3" style={{ backgroundColor: draftTheme.footer.bgColor || '#fff' }}>
                    <div className="flex items-center justify-between">
                      {draftTheme.branding[draftTheme.footer.logoKey || 'footer'] ? (
                        <img src={draftTheme.branding[draftTheme.footer.logoKey || 'footer']!} alt="Footer logo" className="h-8 w-auto object-contain" />
                      ) : (
                        <DefaultLogoPreview size="sm" name={draftTheme.settings.marketplaceName || 'Ketrika'} />
                      )}
                      <p className="text-sm" style={{ color: draftTheme.footer.textColor || '#6b7280' }}>
                        {(draftTheme.settings.marketplaceName || 'Ketrika').toUpperCase()} — Marketplace Malagasy
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === SETTINGS TAB === */}
      {tab === 'settings' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Paramètres généraux du marketplace.
          </p>
          {themeLoading ? (
            <div className="card p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Logo height */}
              <div className="card p-5">
                <label className="label-text">Taille du logo (px)</label>
                <input
                  type="number"
                  min="20"
                  max="120"
                  className="input-field"
                  value={draftTheme.settings.logoHeight ?? 40}
                  onChange={(e) => updateSettings('logoHeight', parseInt(e.target.value) || 40)}
                />
                <p className="mt-2 text-xs text-gray-400">Hauteur en pixels. Les proportions sont conservées.</p>
                <div className="mt-3 flex items-center justify-center rounded-lg bg-gray-50 p-4">
                  {draftTheme.branding.main ? (
                    <img src={draftTheme.branding.main} alt="Logo" className="w-auto object-contain" style={{ height: `${draftTheme.settings.logoHeight ?? 40}px` }} />
                  ) : (
                    <DefaultLogoPreview size="sm" name={draftTheme.settings.marketplaceName || 'Ketrika'} />
                  )}
                </div>
              </div>

              {/* Browser title */}
              <div className="card p-5">
                <label className="label-text">Texte de l'onglet du navigateur</label>
                <input
                  type="text"
                  className="input-field"
                  value={draftTheme.settings.browserTitle ?? ''}
                  onChange={(e) => updateSettings('browserTitle', e.target.value)}
                  placeholder="KETRIKA — Marketplace Malagasy"
                />
                <p className="mt-2 text-xs text-gray-400">Titre affiché dans l'onglet du navigateur.</p>
              </div>

              {/* Marketplace name */}
              <div className="card p-5">
                <label className="label-text">Nom du marketplace</label>
                <input
                  type="text"
                  className="input-field"
                  value={draftTheme.settings.marketplaceName ?? ''}
                  onChange={(e) => updateSettings('marketplaceName', e.target.value)}
                  placeholder="Ketrika"
                />
                <p className="mt-2 text-xs text-gray-400">Affiché à côté du logo et dans les textes du site.</p>
              </div>

              {/* Reassignment delay */}
              <div className="card p-5">
                <label className="label-text">Délai avant réattribution (minutes)</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={draftTheme.settings.reassignmentDelayMinutes ?? 30}
                  onChange={(e) => updateSettings('reassignmentDelayMinutes', parseInt(e.target.value) || 30)}
                />
                <p className="mt-2 text-xs text-gray-400">Délai maximum pour qu'un livreur prenne en charge une commande avant réattribution automatique.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === MESSAGES TAB === */}
      {tab === 'messages' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Personnalisez les messages affichés par la plateforme. Ces messages sont utilisés dans les pages concernées.
          </p>
          {themeLoading ? (
            <div className="card p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="card p-5">
                <h4 className="mb-3 text-sm font-bold text-gray-900">Message de suspension — Client</h4>
                <textarea
                  className="input-field"
                  rows={4}
                  value={draftTheme.settings.suspensionMessageClient ?? ''}
                  onChange={(e) => updateSettings('suspensionMessageClient', e.target.value)}
                  placeholder="Votre compte client a été suspendu..."
                />
                <button
                  onClick={() => updateSettings('suspensionMessageClient', DEFAULT_THEME.settings.suspensionMessageClient!)}
                  className="mt-2 text-xs font-medium text-ketrika-600 hover:text-ketrika-700"
                >
                  Restaurer le message par défaut
                </button>
              </div>
              <div className="card p-5">
                <h4 className="mb-3 text-sm font-bold text-gray-900">Message de suspension — Vendeur</h4>
                <textarea
                  className="input-field"
                  rows={4}
                  value={draftTheme.settings.suspensionMessageSeller ?? ''}
                  onChange={(e) => updateSettings('suspensionMessageSeller', e.target.value)}
                  placeholder="Votre compte vendeur a été suspendu..."
                />
                <button
                  onClick={() => updateSettings('suspensionMessageSeller', DEFAULT_THEME.settings.suspensionMessageSeller!)}
                  className="mt-2 text-xs font-medium text-ketrika-600 hover:text-ketrika-700"
                >
                  Restaurer le message par défaut
                </button>
              </div>
              <div className="card p-5">
                <h4 className="mb-3 text-sm font-bold text-gray-900">Message de suspension — Livreur</h4>
                <textarea
                  className="input-field"
                  rows={4}
                  value={draftTheme.settings.suspensionMessageDriver ?? ''}
                  onChange={(e) => updateSettings('suspensionMessageDriver', e.target.value)}
                  placeholder="Votre compte livreur a été suspendu..."
                />
                <button
                  onClick={() => updateSettings('suspensionMessageDriver', DEFAULT_THEME.settings.suspensionMessageDriver!)}
                  className="mt-2 text-xs font-medium text-ketrika-600 hover:text-ketrika-700"
                >
                  Restaurer le message par défaut
                </button>
              </div>
            </div>
          )}
          <div className="card p-4">
            <p className="text-xs text-gray-400">
              Les messages sont sauvegardés avec le brouillon et publiés en cliquant sur « Publier ». La structure permet d'ajouter d'autres catégories de messages ultérieurement.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
