import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { formatAriary } from '@/lib/constants';
import type { Product, Shop } from '@/types';
import { Package } from 'lucide-react';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shopsMap, setShopsMap] = useState<Record<string, Shop>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('shops').select('*'),
    ]).then(([prodRes, shopRes]) => {
      setProducts(prodRes.data || []);
      const map: Record<string, Shop> = {};
      (shopRes.data || []).forEach((s) => { map[s.id] = s; });
      setShopsMap(map);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout title="Produits">
      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : products.length === 0 ? (
        <div className="card p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">Aucun produit.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Produit</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Boutique</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Prix</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Stock</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Ville</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">{shopsMap[product.shop_id]?.name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatAriary(product.price_ariary)}</td>
                    <td className="px-4 py-3 text-gray-600">{product.stock}</td>
                    <td className="px-4 py-3 text-gray-600">{product.city}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
