import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DeliveryStatusBadge } from '@/components/StatusBadge';
import { formatAriary, DELIVERY_COMMISSION_RATE } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { Delivery, Profile, Shop } from '@/types';
import { Truck, MapPin, Phone, User, CheckCircle, Package, AlertCircle, Printer, Store } from 'lucide-react';

export function DriverDeliveries() {
  const { profile } = useAuth();
  const [available, setAvailable] = useState<Delivery[]>([]);
  const [mine, setMine] = useState<Delivery[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, Profile>>({});
  const [sellersMap, setSellersMap] = useState<Record<string, Profile>>({});
  const [shopsMap, setShopsMap] = useState<Record<string, Shop>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    if (!profile) return;
    const [availRes, myRes] = await Promise.all([
      supabase.from('deliveries').select('*').eq('status', 'WAITING_FOR_DRIVER').order('created_at', { ascending: false }),
      supabase.from('deliveries').select('*').eq('driver_id', profile.id).order('created_at', { ascending: false }),
    ]);
    setAvailable(availRes.data || []);
    setMine(myRes.data || []);

    const userIds = new Set<string>();
    [...(availRes.data || []), ...(myRes.data || [])].forEach((d) => {
      userIds.add(d.client_id);
      userIds.add(d.seller_id);
    });
    if (userIds.size > 0) {
      const [usersRes, shopsRes] = await Promise.all([
        supabase.from('profiles').select('*').in('id', Array.from(userIds)),
        supabase.from('shops').select('*').in('seller_id', Array.from(userIds)),
      ]);
      const cMap: Record<string, Profile> = {};
      const sMap: Record<string, Profile> = {};
      (usersRes.data || []).forEach((u) => {
        cMap[u.id] = u;
        sMap[u.id] = u;
      });
      setClientsMap(cMap);
      setSellersMap(sMap);
      const shMap: Record<string, Shop> = {};
      (shopsRes.data || []).forEach((s) => {
        shMap[s.seller_id] = s;
      });
      setShopsMap(shMap);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  async function acceptDelivery(delivery: Delivery) {
    if (!profile) return;
    setActionLoading(delivery.id);

    const driverCommissionRate = profile?.commission_rate ?? DELIVERY_COMMISSION_RATE;
    const deliveryCommission = Math.round(delivery.delivery_fee * driverCommissionRate);
    const driverAmount = delivery.delivery_fee - deliveryCommission;

    await supabase.from('deliveries').update({
      driver_id: profile.id,
      status: 'ASSIGNED',
      platform_delivery_commission: deliveryCommission,
      driver_amount: driverAmount,
      driver_assigned_at: new Date().toISOString(),
    }).eq('id', delivery.id);
    await supabase.from('delivery_status_history').insert({
      delivery_id: delivery.id,
      status: 'ASSIGNED',
      changed_by: profile.id,
    });
    setActionLoading(null);
    fetchDeliveries();
  }

  async function pickupDelivery(delivery: Delivery) {
    if (!profile) return;
    setActionLoading(delivery.id);
    await supabase.from('deliveries').update({ status: 'PICKED_UP' }).eq('id', delivery.id);
    await supabase.from('delivery_status_history').insert({
      delivery_id: delivery.id,
      status: 'PICKED_UP',
      changed_by: profile.id,
    });
    // Update order status to OUT_FOR_DELIVERY when driver picks up
    await supabase.from('orders').update({ status: 'OUT_FOR_DELIVERY' }).eq('id', delivery.order_id);
    await supabase.from('order_status_history').insert({
      order_id: delivery.order_id,
      status: 'OUT_FOR_DELIVERY',
      changed_by: profile.id,
    });
    setActionLoading(null);
    fetchDeliveries();
  }

  async function deliverDelivery(delivery: Delivery) {
    if (!profile) return;
    setActionLoading(delivery.id);
    await supabase.from('deliveries').update({ status: 'DELIVERED' }).eq('id', delivery.id);
    await supabase.from('delivery_status_history').insert({
      delivery_id: delivery.id,
      status: 'DELIVERED',
      changed_by: profile.id,
    });
    // Update order status to DELIVERED
    await supabase.from('orders').update({ status: 'DELIVERED' }).eq('id', delivery.order_id);
    await supabase.from('order_status_history').insert({
      order_id: delivery.order_id,
      status: 'DELIVERED',
      changed_by: profile.id,
    });
    setActionLoading(null);
    fetchDeliveries();
  }

  const activeMine = mine.filter((d) => d.status !== 'DELIVERED' && d.status !== 'CANCELLED');
  const completedMine = mine.filter((d) => d.status === 'DELIVERED');

  const printableDeliveries = mine.filter((d) => d.status === 'ASSIGNED' || d.status === 'PICKED_UP' || d.status === 'IN_TRANSIT');

  function handlePrint() {
    window.print();
  }

  function renderDeliveryCard(delivery: Delivery, isAvailable: boolean) {
    const client = clientsMap[delivery.client_id];
    const seller = sellersMap[delivery.seller_id];
    const shop = shopsMap[delivery.seller_id];
    const isLoading = actionLoading === delivery.id;

    return (
      <div key={delivery.id} className="card p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ketrika-50 text-ketrika-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {delivery.pickup_city || seller?.city} → {delivery.delivery_city}
              </p>
              <p className="text-sm text-green-600 font-medium">{formatAriary(delivery.driver_amount)}</p>
            </div>
          </div>
          {!isAvailable && <DeliveryStatusBadge status={delivery.status} />}
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-600">
          {shop && (
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-gray-400" />
              <span>Boutique: <strong className="text-gray-900">{shop.name}</strong></span>
            </div>
          )}
          {seller && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span>Vendeur: {seller.full_name} — {seller.phone}</span>
            </div>
          )}
          {client && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span>Client: {client.full_name} — {client.phone}</span>
            </div>
          )}
          {delivery.delivery_address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{delivery.delivery_address}, {delivery.delivery_quartier}, {delivery.delivery_city}</span>
            </div>
          )}
          {delivery.delivery_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{delivery.delivery_phone}</span>
            </div>
          )}
        </div>

        {delivery.delivery_instructions && (
          <div className="mt-3 rounded-lg border-2 border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Indications complémentaires</p>
                <p className="mt-1 text-sm text-amber-900 leading-relaxed">{delivery.delivery_instructions}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-gray-100 pt-4 print:hidden">
          {isAvailable ? (
            <button
              onClick={() => acceptDelivery(delivery)}
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? '...' : 'Accepter la mission'}
            </button>
          ) : delivery.status === 'ASSIGNED' ? (
            <div className="space-y-2">
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                <Package className="inline h-4 w-4 mr-1" />
                Étape 1: Récupérez la commande chez le vendeur
              </div>
              <button onClick={() => pickupDelivery(delivery)} disabled={isLoading} className="btn-primary w-full">
                {isLoading ? '...' : 'Commande récupérée'}
              </button>
            </div>
          ) : delivery.status === 'PICKED_UP' || delivery.status === 'IN_TRANSIT' ? (
            <div className="space-y-2">
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                <Truck className="inline h-4 w-4 mr-1" />
                Étape 2: Livrez la commande au client
              </div>
              <button onClick={() => deliverDelivery(delivery)} disabled={isLoading} className="btn-primary w-full">
                {isLoading ? '...' : 'Commande livrée'}
              </button>
            </div>
          ) : delivery.status === 'DELIVERED' ? (
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle className="h-5 w-5" />
              Mission terminée
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Missions de livraison">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <p className="text-sm text-gray-500">Gérez vos missions de livraison.</p>
        {printableDeliveries.length > 0 && (
          <button onClick={handlePrint} className="btn-secondary">
            <Printer className="h-4 w-4" />
            Imprimer mes missions ({printableDeliveries.length})
          </button>
        )}
      </div>
      <div className="hidden print:block print-header">
        <h1>Missions de livraison</h1>
        <p>Date: {new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : (
        <div className="space-y-8">
          {/* Available */}
          <div className="print:hidden">
            <h3 className="mb-4 text-lg font-bold text-gray-900">
              Missions disponibles ({available.length})
            </h3>
            {available.length === 0 ? (
              <div className="card p-6 text-center">
                <Truck className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-gray-500">Aucune mission disponible.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {available.map((d) => renderDeliveryCard(d, true))}
              </div>
            )}
          </div>

          {/* Active */}
          {activeMine.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-bold text-gray-900">Mes missions en cours</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {activeMine.map((d) => renderDeliveryCard(d, false))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedMine.length > 0 && (
            <div className="print:hidden">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Missions terminées</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {completedMine.map((d) => renderDeliveryCard(d, false))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
