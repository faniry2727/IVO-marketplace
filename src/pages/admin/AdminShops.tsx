import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/constants';
import type { Shop, Profile } from '@/types';
import { Store, Power, CheckCircle, MapPin, Search } from 'lucide-react';

export function AdminShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [sellersMap, setSellersMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchShops = useCallback(async () => {
    const { data } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
    const shopList = data as Shop[] || [];
    setShops(shopList);

    const sellerIds = new Set(shopList.map((s) => s.seller_id));
    if (sellerIds.size > 0) {
      const { data: sellers } = await supabase.from('profiles').select('*').in('id', Array.from(sellerIds));
      const map: Record<string, Profile> = {};
      (sellers || []).forEach((s) => { map[s.id] = s; });
      setSellersMap(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  async function toggleShopActive(shop: Shop) {
    setActionLoading(shop.id);
    const newActive = !shop.is_active;
    await supabase.from('shops').update({ is_active: newActive }).eq('id', shop.id);
    await supabase.rpc('log_admin_action', {
      p_target_user_id: shop.seller_id,
      p_action: newActive ? 'shop_activation' : 'shop_deactivation',
      p_old_value: shop.is_active ? 'active' : 'inactive',
      p_new_value: newActive ? 'active' : 'inactive',
    });
    setActionLoading(null);
    fetchShops();
  }

  const filtered = shops.filter((s) => {
    if (!search) return true;
    const seller = sellersMap[s.seller_id];
    return s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city?.toLowerCase().includes(search.toLowerCase()) ||
      seller?.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <DashboardLayout title="Boutiques">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-10" placeholder="Rechercher une boutique..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <Store className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">Aucune boutique trouvée.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((shop) => {
            const seller = sellersMap[shop.seller_id];
            return (
              <div key={shop.id} className={`card p-5 ${!shop.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ketrika-50 text-ketrika-600">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{shop.name}</h4>
                      <p className="text-xs text-gray-500">{seller?.full_name || '—'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${shop.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {shop.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {shop.description && <p className="mt-3 text-sm text-gray-500 line-clamp-2">{shop.description}</p>}
                <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {shop.city} — {shop.address}
                </p>
                <p className="mt-1 text-xs text-gray-400">Créée le {formatDate(shop.created_at)}</p>

                <div className="mt-4">
                  <button
                    onClick={() => toggleShopActive(shop)}
                    disabled={actionLoading === shop.id}
                    className={shop.is_active
                      ? 'inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 w-full justify-center'
                      : 'inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 w-full justify-center'
                    }
                  >
                    {shop.is_active ? <><Power className="h-3.5 w-3.5" />Désactiver</> : <><CheckCircle className="h-3.5 w-3.5" />Activer</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
