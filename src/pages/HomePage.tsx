import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeLogo } from '@/components/ThemeLogo';
import { PublicHeader } from '@/components/PublicHeader';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { formatAriary } from '@/lib/constants';
import type { Product, Category, Shop, SiteImage } from '@/types';
import { ShoppingCart, Store, ArrowRight, Package, Truck, MapPin, ChevronRight, ShoppingBag } from 'lucide-react';

export function HomePage() {
  const { publishedTheme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [heroBanners, setHeroBanners] = useState<SiteImage[]>([]);
  const [promoImages, setPromoImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').order('sort_order').limit(5),
      supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('shops').select('*').eq('is_active', true).limit(3),
      supabase.from('site_images').select('*').eq('is_active', true).order('sort_order'),
    ]).then(async ([catRes, prodRes, shopRes, imgRes]) => {
      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
      setShops(shopRes.data || []);
      const allImages = (imgRes.data || []) as SiteImage[];
      setHeroBanners(allImages.filter((i) => i.section === 'hero_banner'));
      setPromoImages(allImages.filter((i) => i.section === 'promo'));

      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ketrika-900 via-ketrika-800 to-ketrika-950 text-white">
        {heroBanners.length > 0 && (
          <img
            src={heroBanners[0].image_url}
            alt={heroBanners[0].title || `Bannière ${publishedTheme.settings.marketplaceName || 'Ketrika'}`}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold text-accent-400 tracking-wide uppercase">
              « Entana nafarana, entana tonga »
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Achetez et vendez facilement à Madagascar.
            </h1>
            <p className="mt-4 text-lg text-ketrika-100">
              Découvrez des produits et faites-vous livrer simplement.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/products" className="btn-accent">
                <ShoppingCart className="h-4 w-4" />
                Commencer mes achats
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10">
                <Store className="h-4 w-4" />
                Devenir vendeur
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Catégories populaires</h2>
          <Link to="/products" className="text-sm font-medium text-ketrika-600 hover:text-ketrika-700">Voir tout</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="card group flex flex-col items-center gap-3 p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ketrika-50 text-ketrika-600 group-hover:bg-ketrika-100 transition-colors">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-gray-700">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Promo visuals (admin-managed) */}
      {promoImages.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promoImages.map((promo) => (
              <div key={promo.id} className="card group overflow-hidden transition-shadow hover:shadow-md">
                {promo.link_url ? (
                  <a href={promo.link_url} target="_blank" rel="noopener noreferrer">
                    <div className="relative aspect-video bg-gray-100">
                      <img src={promo.image_url} alt={promo.title || 'Promotion'} className="h-full w-full object-cover" />
                      {promo.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <p className="text-sm font-bold text-white">{promo.title}</p>
                        </div>
                      )}
                    </div>
                  </a>
                ) : (
                  <div className="relative aspect-video bg-gray-100">
                    <img src={promo.image_url} alt={promo.title || 'Promotion'} className="h-full w-full object-cover" />
                    {promo.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <p className="text-sm font-bold text-white">{promo.title}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular products */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Produits populaires</h2>
          <Link to="/products" className="text-sm font-medium text-ketrika-600 hover:text-ketrika-700">Voir tout</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-ketrika-200 border-t-ketrika-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="card group overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-ketrika-50 to-gray-100">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-10 w-10 text-ketrika-200 group-hover:text-ketrika-300 transition-colors" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                  <p className="mt-1 text-base font-bold text-ketrika-700">{formatAriary(product.price_ariary)}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {product.city}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Popular shops */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Boutiques populaires</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              to={`/shop/${shop.id}`}
              className="card group flex items-center gap-4 p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ketrika-600 to-ketrika-800 text-white">
                <Store className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-1">{shop.description}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {shop.city}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-ketrika-600 transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ketrika-50 text-ketrika-600">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Achetez</h3>
              <p className="mt-2 text-sm text-gray-600">
                Parcourez le catalogue, choisissez vos produits et commandez en quelques clics.
              </p>
            </div>
            <div className="card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Faites livrer</h3>
              <p className="mt-2 text-sm text-gray-600">
                Choisissez entre retrait chez le vendeur ou livraison à domicile par un livreur local.
              </p>
            </div>
            <div className="card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Store className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Vendez</h3>
              <p className="mt-2 text-sm text-gray-600">
                Créez votre boutique, publiez vos produits et gérez vos commandes facilement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Prêt à rejoindre {publishedTheme.settings.marketplaceName?.toUpperCase() || 'KETRIKA'} ?
          </h2>
          <p className="mt-3 text-gray-600">
            Créez votre compte et commencez à acheter ou vendre dès aujourd'hui.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/register" className="btn-primary">
              Créer un compte
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/products" className="btn-secondary">
              Voir le catalogue
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t"
        style={{
          backgroundColor: publishedTheme.footer.bgColor || '#ffffff',
          borderColor: 'var(--theme-border, #f3f4f6)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <ThemeLogo placement={publishedTheme.footer.logoKey || 'footer'} size="sm" />
            <p className="text-sm" style={{ color: publishedTheme.footer.textColor || '#6b7280' }}>
              {(publishedTheme.settings.marketplaceName || 'Ketrika').toUpperCase()} — Marketplace Malagasy. « Entana nafarana, entana tonga »
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
