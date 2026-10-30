import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { OrderStatusBadge } from '@/components/StatusBadge';
import { formatAriary, formatDate } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types';
import { ShoppingCart, ChevronRight } from 'lucide-react';

export function ClientOrders() {
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
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [profile]);

  return (
    <DashboardLayout title="Mes commandes">
      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : orders.length === 0 ? (
        <div className="card p-8 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">Vous n'avez pas encore de commande.</p>
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
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
