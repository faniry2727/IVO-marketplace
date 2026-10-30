import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { OrderStatusBadge } from '@/components/StatusBadge';
import { formatAriary, formatDate } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types';
import { ShoppingCart, Package, Clock, CheckCircle } from 'lucide-react';

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'WAITING_FOR_DRIVER', 'OUT_FOR_DELIVERY'];

export function ClientDashboard() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('orders')
      .select('*')
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [profile]);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

  return (
    <DashboardLayout title="Tableau de bord">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Bienvenue, {profile?.full_name}
        </h2>
        <p className="text-sm text-gray-500">Voici un aperçu de vos commandes.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Commandes en cours" value={activeOrders.length} icon={<Clock className="h-5 w-5" />} color="amber" />
        <StatCard label="Commandes terminées" value={completedOrders.length} icon={<CheckCircle className="h-5 w-5" />} color="green" />
        <StatCard label="Total commandes" value={orders.length} icon={<ShoppingCart className="h-5 w-5" />} />
        <StatCard label="Produits disponibles" value={<Link to="/products" className="text-ketrika-600 hover:underline">Voir</Link>} icon={<Package className="h-5 w-5" />} color="accent" />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Dernières commandes</h3>
          <Link to="/client/orders" className="text-sm font-medium text-ketrika-600 hover:text-ketrika-700">
            Voir tout
          </Link>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-gray-500">Chargement...</div>
        ) : orders.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-500">Vous n'avez pas encore de commande.</p>
            <Link to="/products" className="btn-primary mt-4">
              Découvrir le catalogue
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/client/orders/${order.id}`}
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
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatAriary(order.total_amount)}</p>
                    <p className="text-xs text-gray-500">
                      {order.reception_mode === 'pickup' ? 'Retrait' : 'Livraison'}
                    </p>
                  </div>
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
