import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { OrderStatusBadge } from '@/components/StatusBadge';
import { formatAriary, formatDate } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, Profile, Shop } from '@/types';
import { ShoppingCart, ChevronDown, ChevronUp, MapPin, Phone, User, Package } from 'lucide-react';

export function SellerOrders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [itemsMap, setItemsMap] = useState<Record<string, OrderItem[]>>({});
  const [clientsMap, setClientsMap] = useState<Record<string, Profile>>({});
  const [shopMap, setShopMap] = useState<Record<string, Shop>>({});
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);

    // Fetch shops for pickup address
    const shopIds = new Set((data || []).map((o) => o.shop_id));
    if (shopIds.size > 0) {
      const { data: shops } = await supabase.from('shops').select('*').in('id', Array.from(shopIds));
      const sMap: Record<string, Shop> = {};
      (shops || []).forEach((s) => { sMap[s.id] = s; });
      setShopMap(sMap);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function toggleExpand(orderId: string) {
    if (expanded === orderId) {
      setExpanded(null);
      return;
    }
    setExpanded(orderId);
    if (!itemsMap[orderId]) {
      const [itemsRes, order] = await Promise.all([
        supabase.from('order_items').select('*').eq('order_id', orderId),
        supabase.from('orders').select('client_id').eq('id', orderId).maybeSingle(),
      ]);
      setItemsMap({ ...itemsMap, [orderId]: itemsRes.data || [] });
      if (order.data?.client_id && !clientsMap[order.data.client_id]) {
        const { data: client } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', order.data.client_id)
          .maybeSingle();
        if (client) {
          setClientsMap({ ...clientsMap, [order.data.client_id]: client });
        }
      }
    }
  }

  async function updateStatus(order: Order, newStatus: Order['status']) {
    // Decrement stock when order is confirmed
    if (newStatus === 'CONFIRMED' && order.status === 'PENDING') {
      const itemsRes = await supabase.from('order_items').select('*').eq('order_id', order.id);
      for (const item of (itemsRes.data || [])) {
        if (item.product_id) {
          await supabase.rpc('decrement_stock', { p_product_id: item.product_id, p_quantity: item.quantity });
        }
      }
    }

    await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: newStatus,
      changed_by: profile?.id,
    });

    // If delivery order becomes READY, create delivery mission and set to WAITING_FOR_DRIVER
    if (newStatus === 'READY' && order.reception_mode === 'delivery') {
      const finalStatus = 'WAITING_FOR_DRIVER';
      await supabase.from('orders').update({ status: finalStatus }).eq('id', order.id);
      await supabase.from('order_status_history').insert({
        order_id: order.id,
        status: finalStatus,
        changed_by: profile?.id,
      });

      const shop = shopMap[order.shop_id];
      await supabase.from('deliveries').insert({
        order_id: order.id,
        seller_id: order.seller_id,
        client_id: order.client_id,
        delivery_fee: order.delivery_fee,
        platform_delivery_commission: order.platform_delivery_commission,
        driver_amount: order.driver_amount,
        status: 'WAITING_FOR_DRIVER',
        pickup_address: shop?.address || '',
        pickup_city: shop?.city || '',
        delivery_address: order.delivery_address,
        delivery_city: order.delivery_city,
        delivery_quartier: order.delivery_quartier,
        delivery_phone: order.delivery_phone,
        delivery_instructions: order.delivery_instructions,
      });
    }

    fetchOrders();
  }

  function getAction(order: Order): { label: string; nextStatus: Order['status'] } | null {
    switch (order.status) {
      case 'PENDING':
        return { label: 'Accepter', nextStatus: 'CONFIRMED' };
      case 'CONFIRMED':
        return { label: 'Commencer la préparation', nextStatus: 'PREPARING' };
      case 'PREPARING':
        return {
          label: order.reception_mode === 'delivery' ? 'Commande prête (livraison)' : 'Commande prête (retrait)',
          nextStatus: 'READY',
        };
      case 'READY':
        return { label: 'Marquer comme terminée', nextStatus: 'COMPLETED' };
      default:
        return null;
    }
  }

  return (
    <DashboardLayout title="Commandes">
      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : orders.length === 0 ? (
        <div className="card p-8 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">Aucune commande pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const action = getAction(order);
            const isExpanded = expanded === order.id;
            const client = clientsMap[order.client_id];
            return (
              <div key={order.id} className="card overflow-hidden">
                <button
                  onClick={() => toggleExpand(order.id)}
                  className="flex w-full items-center justify-between p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ketrika-50 text-ketrika-600">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div className="text-left">
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
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4">
                    {/* Client info */}
                    {client && (
                      <div className="mb-4 rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Client</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                          <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-gray-400" />{client.full_name}</span>
                          <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-gray-400" />{client.phone}</span>
                          {order.reception_mode === 'delivery' && order.delivery_address && (
                            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-400" />
                              {order.delivery_address}, {order.delivery_quartier}, {order.delivery_city}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Produits</p>
                      <div className="space-y-2">
                        {(itemsMap[order.id] || []).map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-gray-700">
                              <Package className="h-4 w-4 text-gray-400" />
                              {item.product_name} (x{item.quantity})
                            </span>
                            <span className="font-medium text-gray-900">{formatAriary(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action button */}
                    {action && (
                      <button
                        onClick={() => updateStatus(order, action.nextStatus)}
                        className="btn-primary w-full"
                      >
                        {action.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
