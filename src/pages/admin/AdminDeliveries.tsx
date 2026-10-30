import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DeliveryStatusBadge } from '@/components/StatusBadge';
import { supabase } from '@/lib/supabase';
import { formatAriary, formatDate } from '@/lib/constants';
import type { Delivery, Profile } from '@/types';
import { Truck } from 'lucide-react';

export function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('deliveries').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
    ]).then(([delRes, userRes]) => {
      setDeliveries(delRes.data || []);
      const map: Record<string, Profile> = {};
      (userRes.data || []).forEach((u) => { map[u.id] = u; });
      setUsersMap(map);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout title="Livraisons">
      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : deliveries.length === 0 ? (
        <div className="card p-8 text-center">
          <Truck className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">Aucune livraison.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Trajet</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Livreur</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Client</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Montant livreur</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {delivery.pickup_city || '—'} → {delivery.delivery_city || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {delivery.driver_id ? usersMap[delivery.driver_id]?.full_name || '—' : 'Non assigné'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{usersMap[delivery.client_id]?.full_name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatAriary(delivery.driver_amount)}</td>
                    <td className="px-4 py-3"><DeliveryStatusBadge status={delivery.status} /></td>
                    <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{formatDate(delivery.created_at)}</td>
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
