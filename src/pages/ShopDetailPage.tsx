import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicHeader } from '@/components/PublicHeader';
import { VideoCard } from '@/components/VideoCard';
import { supabase } from '@/lib/supabase';
import { formatAriary } from '@/lib/constants';
import type { Shop, Product, Profile, SellerVideo } from '@/types';
import { ArrowLeft, MapPin, Store, ShoppingBag, ChevronRight, Package, Video } from 'lucide-react';

export function ShopDetailPage() {
  const { id } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [videos, setVideos] = useState<SellerVideo[]>([]);
  const [videoProducts, setVideoProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('shops').select('*').eq('id', id).maybeSingle(),
      supabase.from('products').select('*').eq('shop_id', id).eq('is_active', true).order('created_at', { ascending: false }),
    ]).then(async ([shopRes, prodRes]) => {
      setShop(shopRes.data as Shop | null);
      setProducts(prodRes.data || []);
      if (shopRes.data) {
        const [sellerRes, videosRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', shopRes.data.seller_id).maybeSingle(),
          supabase.from('seller_videos').select('*').eq('seller_id', shopRes.data.seller_id).eq('is_active', true).order('created_at', { ascending: false }),
        ]);
        setSeller(sellerRes.data as Profile | null);
        const vids = (videosRes.data || []) as SellerVideo[];
        setVideos(vids);

        // Fetch products associated with videos
        const productIds = vids.map((v) => v.product_id).filter(Boolean) as string[];
        if (productIds.length > 0) {
          const { data: vProds } = await supabase.from('products').select('*').in('id', productIds);
          const map: Record<string, Product> = {};
          (vProds || []).forEach((p) => { map[p.id] = p; });
          setVideoProducts(map);
        }
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ketrika-200 border-t-ketrika-600" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="card max-w-md p-8 text-center">
          <p className="text-gray-500">Cette boutique n'existe pas.</p>
          <Link to="/products" className="btn-primary mt-4">Retour au catalogue</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/products" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-ketrika-600 hover:text-ketrika-700">
          <ArrowLeft className="h-4 w-4" />
          Retour au catalogue
        </Link>

        {/* Shop header */}
        <div className="card mb-6 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ketrika-600 to-ketrika-800 text-white shadow-md">
              <Store className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
              {seller && <p className="text-sm text-gray-500">Vendeur: {seller.full_name}</p>}
              {shop.description && <p className="mt-2 text-sm text-gray-600">{shop.description}</p>}
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {shop.city}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${shop.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {shop.is_active ? 'Boutique active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Videos */}
        {videos.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Video className="h-5 w-5" />
              Vidéos promotionnelles ({videos.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  seller={seller}
                  shop={shop}
                  product={video.product_id ? videoProducts[video.product_id] || null : null}
                />
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Produits ({products.length})</h2>
        </div>

        {products.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">Cette boutique n'a pas encore de produits.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    <ShoppingBag className="h-12 w-12 text-ketrika-200 group-hover:text-ketrika-300 transition-colors" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                  <p className="mt-1 text-lg font-bold text-ketrika-700">{formatAriary(product.price_ariary)}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {product.city}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {product.stock > 0 ? `Stock: ${product.stock}` : 'Rupture'}
                    </span>
                    <span className="flex items-center text-xs font-medium text-ketrika-600">
                      Voir <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
