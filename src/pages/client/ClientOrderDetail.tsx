import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { OrderStatusBadge } from '@/components/StatusBadge';
import { formatAriary, formatDate, ORDER_STATUS_LABELS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Order, OrderItem, OrderStatusHistoryEntry, Profile } from '@/types';
import { ArrowLeft, MapPin, Phone, User, XCircle } from 'lucide-react';

export function ClientOrderDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<OrderStatusHistoryEntry[]>([]);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('orders').select('*').eq('id', id).maybeSingle(),
      supabase.from('order_items').select('*').eq('order_id', id),
      supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: true }),
    ]).then(async ([orderRes, itemsRes, historyRes]) => {
      setOrder(orderRes.data as Order | null);
      setItems(itemsRes.data || []);
      setHistory(historyRes.data || []);

      if (orderRes.data) {
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', orderRes.data.seller_id)
          .maybeSingle();
        setSeller(sellerData as Profile | null);
      }
      setLoading(false);
    });
  }, [id]);

  const canCancel = order?.status === 'PENDING';
  const [cancelling, setCancelling] = useState(false);

  async function cancelOrder() {
    if (!order || !profile) return;
    setCancelling(true);
    await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', order.id);
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: 'CANCELLED',
      changed_by: profile.id,
    });
    setCancelling(false);
    setOrder({ ...order, status: 'CANCELLED' });
  }

  if (loading) {
    return (
      <DashboardLayout title="Détail de la commande">
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout title="Commande introuvable">
        <div className="card p-8 text-center">
          <p className="text-gray-500">Cette commande n'existe pas ou ne vous appartient pas.</p>
          <Link to="/client/orders" className="btn-primary mt-4">Retour aux commandes</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Commande ${order.order_number}`}>
      <Link to="/client/orders" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-ketrika-600 hover:text-ketrika-700">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Items + Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Statut</h3>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-2 text-sm text-gray-500">Commande passée le {formatDate(order.created_at)}</p>
            {canCancel && (
              <button
                onClick={cancelOrder}
                disabled={cancelling}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <XCircle className="h-4 w-4" />
                {cancelling ? 'Annulation...' : 'Annuler la commande'}
              </button>
            )}
          </div>

          {/* Items */}
          <div className="card p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Produits</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} x {formatAriary(item.unit_price_ariary)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatAriary(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total produits</span>
                <span className="font-medium text-gray-900">{formatAriary(order.product_subtotal)}</span>
              </div>
              {order.reception_mode === 'delivery' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de livraison</span>
                  <span className="font-medium text-gray-900">{formatAriary(order.delivery_fee)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-ketrika-700">{formatAriary(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          {order.reception_mode === 'delivery' && order.delivery_address && (
            <div className="card p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Adresse de livraison</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{order.delivery_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{order.delivery_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>
                    {order.delivery_address}, {order.delivery_quartier}, {order.delivery_city}
                  </span>
                </div>
                {order.delivery_instructions && (
                  <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-gray-500">
                    {order.delivery_instructions}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline + Seller */}
        <div className="space-y-6">
          {seller && (
            <div className="card p-6">
              <h3 className="mb-3 text-sm font-bold text-gray-900 uppercase tracking-wide">Vendeur</h3>
              <p className="font-semibold text-gray-900">{seller.full_name}</p>
              <p className="text-sm text-gray-500">{seller.city}</p>
              <p className="text-sm text-gray-500">{seller.phone}</p>
            </div>
          )}

          <div className="card p-6">
            <h3 className="mb-4 text-sm font-bold text-gray-900 uppercase tracking-wide">Suivi</h3>
            <div className="space-y-3">
              {history.map((entry, idx) => {
                const isLast = idx === history.length - 1;
                return (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${isLast ? 'bg-ketrika-600' : 'bg-gray-300'}`} />
                      {idx < history.length - 1 && <div className="h-6 w-0.5 bg-gray-200" />}
                    </div>
                    <div className="pb-1">
                      <p className={`text-sm font-medium ${isLast ? 'text-ketrika-700' : 'text-gray-600'}`}>
                        {ORDER_STATUS_LABELS[entry.status]}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(entry.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
