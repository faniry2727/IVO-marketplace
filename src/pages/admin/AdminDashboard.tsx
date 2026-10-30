import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { formatAriary } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { Profile, Order } from '@/types';
import { Users, Store, ShoppingCart, Truck, CheckCircle, Clock, TrendingUp, ClipboardCheck } from 'lucide-react';

interface SellerCommission {
  seller: Profile;
  revenue: number;
  saleCommission: number;
  deliveryCommission: number;
  orderCount: number;
}

interface DriverCommission {
  driver: Profile;
  earnings: number;
  platformCommission: number;
  deliveryCount: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    sellers: 0,
    drivers: 0,
    products: 0,
    shops: 0,
    orders: 0,
    activeOrders: 0,
    activeDeliveries: 0,
    completedOrders: 0,
    totalSaleCommission: 0,
    totalDeliveryCommission: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    pendingRegistrations: 0,
  });
  const [sellerCommissions, setSellerCommissions] = useState<SellerCommission[]>([]);
  const [driverCommissions, setDriverCommissions] = useState<DriverCommission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'seller'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'driver'),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('shops').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('*'),
      supabase.from('profiles').select('*').eq('role', 'seller'),
      supabase.from('profiles').select('*').eq('role', 'driver'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['seller', 'driver']).eq('is_validated', false),
    ]).then(([c, s, d, p, sh, o, sellersData, driversData, pendingReg]) => {
      const allOrders = (o.data || []) as Order[];
      const orders = allOrders.filter((ord) => ord.status !== 'CANCELLED');
      const sellers = (sellersData.data || []) as Profile[];
      const drivers = (driversData.data || []) as Profile[];
      const activeStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'WAITING_FOR_DRIVER', 'OUT_FOR_DELIVERY'];
      const active = allOrders.filter((ord) => activeStatuses.includes(ord.status));
      const completed = orders.filter((ord) => ord.status === 'COMPLETED');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter((o) => new Date(o.created_at) >= today);
      const totalRev = orders.reduce((sum, o) => sum + o.product_subtotal, 0);
      const totalSaleComm = orders.reduce((sum, ord) => sum + (ord.platform_sale_commission || 0), 0);
      const totalDelComm = orders.reduce((sum, ord) => sum + (ord.platform_delivery_commission || 0), 0);

      setStats({
        clients: c.count || 0,
        sellers: s.count || 0,
        drivers: d.count || 0,
        products: p.count || 0,
        shops: sh.count || 0,
        orders: allOrders.length,
        activeOrders: active.length,
        activeDeliveries: active.filter((ord) => ord.status === 'OUT_FOR_DELIVERY' || ord.status === 'WAITING_FOR_DRIVER').length,
        completedOrders: completed.length,
        totalSaleCommission: totalSaleComm,
        totalDeliveryCommission: totalDelComm,
        todayRevenue: todayOrders.reduce((sum, o) => sum + o.product_subtotal, 0),
        totalRevenue: totalRev,
        pendingRegistrations: pendingReg.count || 0,
      });

      // Per-seller commissions
      const sellerMap: Record<string, SellerCommission> = {};
      sellers.forEach((seller) => {
        sellerMap[seller.id] = { seller, revenue: 0, saleCommission: 0, deliveryCommission: 0, orderCount: 0 };
      });
      orders.forEach((order) => {
        const entry = sellerMap[order.seller_id];
        if (entry) {
          entry.revenue += order.product_subtotal;
          entry.saleCommission += order.platform_sale_commission || 0;
          entry.deliveryCommission += order.platform_delivery_commission || 0;
          entry.orderCount += 1;
        }
      });
      setSellerCommissions(Object.values(sellerMap).sort((a, b) => b.revenue - a.revenue));

      // Per-driver commissions (from deliveries)
      supabase.from('deliveries').select('*').not('driver_id', 'is', null).then(({ data: delData }) => {
        const driverMap: Record<string, DriverCommission> = {};
        drivers.forEach((driver) => {
          driverMap[driver.id] = { driver, earnings: 0, platformCommission: 0, deliveryCount: 0 };
        });
        (delData || []).forEach((del) => {
          const entry = driverMap[del.driver_id];
          if (entry) {
            entry.earnings += del.driver_amount || 0;
            entry.platformCommission += del.platform_delivery_commission || 0;
            if (del.status === 'DELIVERED') entry.deliveryCount += 1;
          }
        });
        setDriverCommissions(Object.values(driverMap).sort((a, b) => b.earnings - a.earnings));
      });

      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Tableau de bord admin">
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Tableau de bord administrateur">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Vue d'ensemble de la plateforme</h2>
        <p className="text-sm text-gray-500">Statistiques, supervision et commissions KETRIKA.</p>
      </div>

      {/* Revenue section */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-bold text-gray-500 uppercase tracking-wide">Chiffre d'affaires</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">CA total</p>
                <p className="mt-1 text-2xl font-bold text-ketrika-700">{formatAriary(stats.totalRevenue)}</p>
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
                <p className="mt-1 text-2xl font-bold text-green-700">{formatAriary(stats.todayRevenue)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Commission totale Ketrika</p>
                <p className="mt-1 text-2xl font-bold text-accent-700">{formatAriary(stats.totalSaleCommission + stats.totalDeliveryCommission)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users section */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-bold text-gray-500 uppercase tracking-wide">Utilisateurs</h3>
        <div className="grid grid-cols-3 gap-4">
          <Link to="/admin/users" className="card p-5 transition-shadow hover:shadow-md">
            <StatCard label="Clients" value={stats.clients} icon={<Users className="h-5 w-5" />} color="ketrika" />
          </Link>
          <Link to="/admin/users" className="card p-5 transition-shadow hover:shadow-md">
            <StatCard label="Vendeurs" value={stats.sellers} icon={<Store className="h-5 w-5" />} color="accent" />
          </Link>
          <Link to="/admin/users" className="card p-5 transition-shadow hover:shadow-md">
            <StatCard label="Livreurs" value={stats.drivers} icon={<Truck className="h-5 w-5" />} color="green" />
          </Link>
        </div>
      </div>

      {/* Pending registrations */}
      {stats.pendingRegistrations > 0 && (
        <div className="mb-6">
          <Link to="/admin/registrations" className="card flex items-center justify-between p-5 border-2 border-amber-200 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Nouvelles inscriptions à gérer</p>
                <p className="mt-0.5 text-2xl font-bold text-amber-700">{stats.pendingRegistrations}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-amber-600 hover:text-amber-700">Voir →</span>
          </Link>
        </div>
      )}

      {/* Operations section */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-bold text-gray-500 uppercase tracking-wide">Opérations</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Commandes en cours" value={stats.activeOrders} icon={<Clock className="h-5 w-5" />} color="amber" />
          <StatCard label="Livraisons en cours" value={stats.activeDeliveries} icon={<Truck className="h-5 w-5" />} />
          <StatCard label="Commandes terminées" value={stats.completedOrders} icon={<CheckCircle className="h-5 w-5" />} color="green" />
          <Link to="/admin/orders" className="card p-5 transition-shadow hover:shadow-md">
            <StatCard label="Total commandes" value={stats.orders} icon={<ShoppingCart className="h-5 w-5" />} color="accent" />
          </Link>
        </div>
      </div>

      {/* Commission breakdown by seller */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-bold text-gray-500 uppercase tracking-wide">Commissions par vendeur</h3>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Vendeur</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Commandes</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">CA</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Comm. vente</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Comm. livraison</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Total comm.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sellerCommissions.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Aucun vendeur.</td></tr>
                ) : sellerCommissions.map((sc) => (
                  <tr key={sc.seller.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{sc.seller.full_name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{sc.orderCount}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatAriary(sc.revenue)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatAriary(sc.saleCommission)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatAriary(sc.deliveryCommission)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-700">{formatAriary(sc.saleCommission + sc.deliveryCommission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Commission breakdown by driver */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-bold text-gray-500 uppercase tracking-wide">Commissions par livreur</h3>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Livreur</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Livraisons</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Revenus livreur</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Comm. Ketrika</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {driverCommissions.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Aucun livreur.</td></tr>
                ) : driverCommissions.map((dc) => (
                  <tr key={dc.driver.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{dc.driver.full_name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{dc.deliveryCount}</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatAriary(dc.earnings)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-700">{formatAriary(dc.platformCommission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Platform commission summary */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-500 uppercase tracking-wide">Commissions KETRIKA (1%)</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Commission sur ventes</p>
                <p className="mt-1 text-2xl font-bold text-ketrika-700">{formatAriary(stats.totalSaleCommission)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ketrika-50 text-ketrika-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Commission sur livraisons</p>
                <p className="mt-1 text-2xl font-bold text-accent-700">{formatAriary(stats.totalDeliveryCommission)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <Truck className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Commission totale</p>
                <p className="mt-1 text-2xl font-bold text-green-700">{formatAriary(stats.totalSaleCommission + stats.totalDeliveryCommission)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
