import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicHeader } from '@/components/PublicHeader';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { formatAriary } from '@/lib/constants';
import type { Product, Shop, Profile, Category, ProductImage } from '@/types';
import { ArrowLeft, MapPin, Store, Package, Minus, Plus, ShoppingCart, ArrowRight } from 'lucide-react';

export function ProductDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  function handleAddToCart() {
    if (!product) return;
    if (!shop || !seller) {
      setCartError('Impossible de charger les informations du vendeur. Veuillez réessayer.');
      return;
    }
    setCartError(null);
    const result = addItem(product, shop, seller, quantity);
    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      setCartError(result.error || 'Erreur lors de l\'ajout au panier.');
    }
  }

  useEffect(() => {
    if (!id) return;
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }
        setProduct(data as Product);
        const [shopRes, sellerRes, catRes, imgRes] = await Promise.all([
          supabase.from('shops').select('*').eq('id', data.shop_id).maybeSingle(),
          supabase.from('profiles').select('*').eq('id', data.seller_id).maybeSingle(),
          data.category_id ? supabase.from('categories').select('*').eq('id', data.category_id).maybeSingle() : Promise.resolve({ data: null }),
          supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
        ]);
        setShop(shopRes.data as Shop | null);
        setSeller(sellerRes.data as Profile | null);
        setCategory(catRes.data as Category | null);
        setImages(imgRes.data || []);
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

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="card max-w-md p-8 text-center">
          <p className="text-gray-500">Ce produit n'existe pas ou n'est plus disponible.</p>
          <Link to="/products" className="btn-primary mt-4">Retour au catalogue</Link>
        </div>
      </div>
    );
  }

  const allImages = [
    ...(product.image_url ? [{ id: 'main', image_url: product.image_url, sort_order: -1 }] : []),
    ...images.map((img) => ({ id: img.id, image_url: img.image_url, sort_order: img.sort_order })),
  ];
  const maxQty = Math.min(product.stock, 99);
  const currentImage = allImages[activeImage]?.image_url;

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/products" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-ketrika-600 hover:text-ketrika-700">
          <ArrowLeft className="h-4 w-4" />
          Retour au catalogue
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="card flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-ketrika-50 to-gray-100">
              {currentImage ? (
                <img src={currentImage} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-24 w-24 text-ketrika-200" />
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      activeImage === idx ? 'border-ketrika-600 ring-2 ring-ketrika-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img.image_url} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              {category && (
                <span className="inline-flex items-center rounded-full bg-ketrika-50 px-2.5 py-1 text-xs font-medium text-ketrika-700">
                  {category.name}
                </span>
              )}
              <h1 className="mt-2 text-2xl font-bold text-gray-900">{product.name}</h1>
              <p className="mt-2 text-3xl font-bold text-ketrika-700">{formatAriary(product.price_ariary)}</p>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${product.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {product.stock > 0 ? `En stock (${product.stock})` : 'Rupture de stock'}
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <MapPin className="h-4 w-4" />
                {product.city}
              </span>
            </div>

            {product.description && (
              <div className="card p-4">
                <h3 className="mb-2 text-sm font-bold text-gray-900 uppercase tracking-wide">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Quantity + add to cart */}
            {product.stock > 0 && (
              <div className="card p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="label-text">Quantité</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    {profile ? (
                      <button
                        onClick={handleAddToCart}
                        className="btn-primary w-full"
                        disabled={added}
                      >
                        {added ? 'Ajouté au panier !' : 'Ajouter au panier'}
                        {!added && <ShoppingCart className="h-4 w-4" />}
                      </button>
                    ) : (
                      <Link to="/login" className="btn-primary w-full">
                        Connectez-vous pour commander
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
                {added && (
                  <p className="mt-3 text-sm text-green-600">
                    Produit ajouté au panier.{'  '}
                    <Link to="/cart" className="font-semibold underline">Voir le panier</Link>
                  </p>
                )}
                {cartError && (
                  <p className="mt-3 text-sm text-red-600">{cartError}</p>
                )}
              </div>
            )}

            {/* Seller + shop */}
            {shop && (
              <Link to={`/shop/${shop.id}`} className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                  <Store className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500">Vendeur</p>
                  <p className="font-semibold text-gray-900">{seller?.full_name}</p>
                  <p className="text-sm text-gray-500">{shop.name} — {shop.city}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
