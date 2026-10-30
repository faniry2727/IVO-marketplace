import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { OrderStatusBadge } from '@/components/StatusBadge';
import { formatAriary, formatDate } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { Order, Product } from '@/types';
import { ShoppingCart, Package, CheckCircle, Clock } from 'lucide-react';

export function SellerDashboard() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase
        .from('orders')
        .select('*')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', profile.id),
    ]).then(([ordersRes, productsRes]) => {
      setOrders(ordersRes.data || []);
      setProductCount(productsRes.count || 0);
      setLoading(false);
    });
  }, [profile]);

  const toTreat = orders.filter((o) => o.status === 'PENDING');
  const preparing = orders.filter((o) => o.status === 'PREPARING');
  const ready = orders.filter((o) => o.status === 'READY' || o.status === 'WAITING_FOR_DRIVER');
  const completed = orders.filter((o) => o.status === 'COMPLETED');

  return (
    <DashboardLayout title="Tableau de bord vendeur">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Bonjour, {profile?.full_name}</h2>
        <p className="text-sm text-gray-500">Gérez vos commandes et produits.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="À traiter" value={toTreat.length} icon={<Clock className="h-5 w-5" />} color="amber" />
        <StatCard label="En préparation" value={preparing.length} icon={<Package className="h-5 w-5" />} color="purple" />
        <StatCard label="Prêtes" value={ready.length} icon={<CheckCircle className="h-5 w-5" />} color="green" />
        <StatCard label="Produits" value={productCount} icon={<Package className="h-5 w-5" />} />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Commandes récentes</h3>
          <Link to="/seller/orders" className="text-sm font-medium text-ketrika-600 hover:text-ketrika-700">
            Voir tout
          </Link>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-gray-500">Chargement...</div>
        ) : orders.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-500">Aucune commande pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                to={`/seller/orders`}
                className="card flex items-center justify-between p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ketrika-50 text-ketrika-600">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-gray-900">{formatAriary(order.total_amount)}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
