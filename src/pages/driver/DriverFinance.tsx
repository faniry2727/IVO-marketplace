import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { formatAriary, formatDate, DELIVERY_COMMISSION_RATE } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Delivery } from '@/types';
import { TrendingUp, Calendar, Percent, Truck } from 'lucide-react';

type Period = 'today' | 'week' | 'month' | 'all';

export function DriverFinance() {
  const { profile } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('all');

  const driverCommissionRate = profile?.commission_rate ?? DELIVERY_COMMISSION_RATE;

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('deliveries')
      .select('*')
      .eq('driver_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDeliveries(data || []);
        setLoading(false);
      });
  }, [profile]);

  function getPeriodStart(p: Period): Date | null {
    const now = new Date();
    if (p === 'today') { const s = new Date(now); s.setHours(0,0,0,0); return s; }
    if (p === 'week') { const s = new Date(now); s.setDate(s.getDate()-7); return s; }
    if (p === 'month') { const s = new Date(now); s.setMonth(s.getMonth()-1); return s; }
    return null;
  }

  const periodStart = getPeriodStart(period);
  const filtered = deliveries.filter((d) => !periodStart || new Date(d.created_at) >= periodStart);
  const completed = filtered.filter((d) => d.status === 'DELIVERED');
  const totalEarnings = completed.reduce((sum, d) => sum + d.driver_amount, 0);
  const todayEarnings = deliveries.filter((d) => {
    const today = new Date(); today.setHours(0,0,0,0);
    return d.status === 'DELIVERED' && new Date(d.created_at) >= today;
  }).reduce((sum, d) => sum + d.driver_amount, 0);
  const totalPlatformCommission = completed.reduce((sum, d) => sum + d.platform_delivery_commission, 0);

  const periodLabels: Record<Period, string> = {
    today: "Aujourd'hui", week: '7 jours', month: '30 jours', all: 'Tout',
  };

  return (
    <DashboardLayout title="Finance">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestion financière</h2>
          <p className="text-sm text-gray-500">Suivez vos revenus de livraison et les commissions Ketrika.</p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p ? 'bg-ketrika-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Revenus totaux</p>
                  <p className="mt-1 text-2xl font-bold text-green-700">{formatAriary(totalEarnings)}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Revenus du jour</p>
                  <p className="mt-1 text-2xl font-bold text-ketrika-700">{formatAriary(todayEarnings)}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ketrika-50 text-ketrika-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Commission Ketrika</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">{formatAriary(totalPlatformCommission)}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{Math.round(driverCommissionRate * 100)}% par livraison</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Percent className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Livraisons terminées</p>
                  <p className="mt-1 text-2xl font-bold text-accent-700">{completed.length}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <h3 className="border-b border-gray-100 px-5 py-3 text-sm font-bold text-gray-900 uppercase tracking-wide">
              Livraisons récentes ({filtered.length})
            </h3>
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Aucune livraison sur cette période.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Itinéraire</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Frais livraison</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Commission</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Net livreur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.slice(0, 15).map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{formatDate(d.created_at)}</td>
                        <td className="px-4 py-3 text-gray-900">{d.pickup_city} → {d.delivery_city}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{formatAriary(d.delivery_fee)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatAriary(d.platform_delivery_commission)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">{formatAriary(d.driver_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
