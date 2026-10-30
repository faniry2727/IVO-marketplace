import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { OrderStatusBadge } from '@/components/StatusBadge';
import { supabase } from '@/lib/supabase';
import { formatAriary, formatDate } from '@/lib/constants';
import type { Order, Profile } from '@/types';
import { ShoppingCart } from 'lucide-react';

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
    ]).then(([ordRes, userRes]) => {
      setOrders(ordRes.data || []);
      const map: Record<string, Profile> = {};
      (userRes.data || []).forEach((u) => { map[u.id] = u; });
      setUsersMap(map);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout title="Commandes">
      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : orders.length === 0 ? (
        <div className="card p-8 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">Aucune commande.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">N°</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Client</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Vendeur</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Montant</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Mode</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{order.order_number}</td>
                    <td className="px-4 py-3 text-gray-600">{usersMap[order.client_id]?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{usersMap[order.seller_id]?.full_name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatAriary(order.total_amount)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.reception_mode === 'pickup' ? 'Retrait' : 'Livraison'}
                    </td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{formatDate(order.created_at)}</td>
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
