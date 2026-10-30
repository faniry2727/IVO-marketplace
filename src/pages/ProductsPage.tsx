import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/PublicHeader';
import { supabase } from '@/lib/supabase';
import { formatAriary } from '@/lib/constants';
import type { Product, Category, Shop, Profile } from '@/types';
import { Search, MapPin, ShoppingBag, Store, ChevronRight, SlidersHorizontal } from 'lucide-react';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shopsMap, setShopsMap] = useState<Record<string, Shop>>({});
  const [sellersMap, setSellersMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('shops').select('*'),
    ]).then(async ([prodRes, catRes, shopRes]) => {
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      const sMap: Record<string, Shop> = {};
      (shopRes.data || []).forEach((s) => { sMap[s.id] = s; });
      setShopsMap(sMap);

      const sellerIds = new Set<string>();
      (prodRes.data || []).forEach((p) => sellerIds.add(p.seller_id));
      if (sellerIds.size > 0) {
        const { data: sellers } = await supabase.from('profiles').select('*').in('id', Array.from(sellerIds));
        const pMap: Record<string, Profile> = {};
        (sellers || []).forEach((p) => { pMap[p.id] = p; });
        setSellersMap(pMap);
      }
      setLoading(false);
    });
  }, []);

  const cities = useMemo(() => {
    const set = new Set(products.map((p) => p.city).filter((c): c is string => Boolean(c)));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (search) {
      result = result.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category_id === categoryFilter);
    }
    if (cityFilter !== 'all') {
      result = result.filter((p) => p.city === cityFilter);
    }
    if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => a.price_ariary - b.price_ariary);
    } else if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => b.price_ariary - a.price_ariary);
    }
    return result;
  }, [products, search, categoryFilter, cityFilter, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Title + search */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Catalogue</h1>
          <p className="text-sm text-gray-500">Découvrez les produits de nos vendeurs malgaches.</p>
        </div>

        {/* Search bar */}
        <div className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-10"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Filters */}
        <div className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-center ${showFilters ? 'block' : 'hidden lg:flex'}`}>
          <select className="input-field sm:w-48" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Toutes catégories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input-field sm:w-40" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
            <option value="all">Toutes villes</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input-field sm:w-44" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Plus récents</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>

        {/* Results count */}
        <p className="mb-4 text-sm text-gray-500">{filtered.length} produit(s) trouvé(s)</p>

        {/* Products grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-ketrika-200 border-t-ketrika-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">Aucun produit ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => {
              const shop = shopsMap[product.shop_id];
              const seller = sellersMap[product.seller_id];
              return (
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
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      {shop && (
                        <span className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          {shop.name}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {product.city}
                      {seller && <span className="ml-1">— {seller.full_name}</span>}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-xs font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {product.stock > 0 ? `En stock (${product.stock})` : 'Rupture'}
                      </span>
                      <span className="flex items-center text-xs font-medium text-ketrika-600 group-hover:text-ketrika-700">
                        Voir
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
