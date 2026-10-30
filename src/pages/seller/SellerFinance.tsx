import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { formatAriary, formatDate, SALE_COMMISSION_RATE, DELIVERY_COMMISSION_RATE } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Order } from '@/types';
import { TrendingUp, Wallet, Calendar, Percent, ArrowDown, ArrowUp } from 'lucide-react';

type Period = 'today' | 'week' | 'month' | 'all';

export function SellerFinance() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('all');

  const sellerCommissionRate = profile?.commission_rate ?? SALE_COMMISSION_RATE;

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('orders')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [profile]);

  function getPeriodStart(p: Period): Date | null {
    const now = new Date();
    if (p === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    if (p === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return start;
    }
    if (p === 'month') {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return start;
    }
    return null;
  }

  const periodStart = getPeriodStart(period);
  const filteredOrders = orders.filter((o) => {
    if (o.status === 'CANCELLED') return false;
    if (!periodStart) return true;
    return new Date(o.created_at) >= periodStart;
  });

  const completedOrders = filteredOrders.filter((o) => o.status === 'COMPLETED' || o.status === 'DELIVERED');
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.product_subtotal, 0);
  const todayRevenue = orders
    .filter((o) => {
      if (o.status === 'CANCELLED') return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(o.created_at) >= today;
    })
    .reduce((sum, o) => sum + o.product_subtotal, 0);
  const totalSaleCommission = filteredOrders.reduce((sum, o) => sum + o.platform_sale_commission, 0);
  const totalDeliveryCommission = filteredOrders.reduce((sum, o) => sum + o.platform_delivery_commission, 0);
  const sellerNetRevenue = filteredOrders.reduce((sum, o) => sum + o.seller_amount, 0);

  const periodLabels: Record<Period, string> = {
    today: "Aujourd'hui",
    week: '7 jours',
    month: '30 jours',
    all: 'Tout',
  };

  return (
    <DashboardLayout title="Finance">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestion financière</h2>
          <p className="text-sm text-gray-500">Suivez votre chiffre d'affaires et les commissions Ketrika.</p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-ketrika-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : (
        <>
          {/* Key metrics */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Chiffre d'affaires total</p>
                  <p className="mt-1 text-2xl font-bold text-ketrika-700">{formatAriary(totalRevenue)}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ketrika-50 text-ketrika-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">CA du jour</p>
                  <p className="mt-1 text-2xl font-bold text-green-700">{formatAriary(todayRevenue)}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Commissions Ketrika</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">{formatAriary(totalSaleCommission + totalDeliveryCommission)}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{Math.round(sellerCommissionRate * 100)}% ventes + {DELIVERY_COMMISSION_RATE * 100}% livraisons</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Percent className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Revenu net</p>
                  <p className="mt-1 text-2xl font-bold text-accent-700">{formatAriary(sellerNetRevenue)}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-4 text-sm font-bold text-gray-900 uppercase tracking-wide">Détail des commissions</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-600">Commission sur livraisons ({DELIVERY_COMMISSION_RATE * 100}%)</span>
                  </div>
                  <span className="font-semibold text-red-600">{formatAriary(totalDeliveryCommission)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-900">Total commissions</span>
                  </div>
                  <span className="font-bold text-red-700">{formatAriary(totalSaleCommission + totalDeliveryCommission)}</span>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="mb-4 text-sm font-bold text-gray-900 uppercase tracking-wide">Synthèse des revenus</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">Chiffre d'affaires brut</span>
                  </div>
                  <span className="font-semibold text-green-600">{formatAriary(totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-600">Commissions prélevées</span>
                  </div>
                  <span className="font-semibold text-red-600">{formatAriary(totalSaleCommission + totalDeliveryCommission)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-accent-500" />
                    <span className="text-sm font-medium text-gray-900">Revenu net vendeur</span>
                  </div>
                  <span className="font-bold text-accent-700">{formatAriary(sellerNetRevenue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent orders */}
          <div className="card overflow-hidden">
            <h3 className="border-b border-gray-100 px-5 py-3 text-sm font-bold text-gray-900 uppercase tracking-wide">
              Commandes récentes ({filteredOrders.length})
            </h3>
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Aucune commande sur cette période.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">N° commande</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">CA</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Commission</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredOrders.slice(0, 15).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{order.order_number}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{formatAriary(order.product_subtotal)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatAriary(order.platform_sale_commission + order.platform_delivery_commission)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-accent-700">{formatAriary(order.seller_amount)}</td>
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
