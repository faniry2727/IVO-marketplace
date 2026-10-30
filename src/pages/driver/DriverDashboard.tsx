import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { DeliveryStatusBadge } from '@/components/StatusBadge';
import { formatAriary } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { Delivery, Profile, Shop } from '@/types';
import { Truck, Clock, CheckCircle, Wallet, Power, AlertCircle, Store } from 'lucide-react';

export function DriverDashboard() {
  const { profile, refreshProfile } = useAuth();
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Delivery[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, Profile>>({});
  const [shopsMap, setShopsMap] = useState<Record<string, Shop>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase.from('deliveries').select('*').eq('status', 'WAITING_FOR_DRIVER').order('created_at', { ascending: false }),
      supabase.from('deliveries').select('*').eq('driver_id', profile.id).order('created_at', { ascending: false }),
    ]).then(async ([availRes, myRes]) => {
      setAvailableDeliveries(availRes.data || []);
      setMyDeliveries(myRes.data || []);

      const userIds = new Set<string>();
      [...(availRes.data || []), ...(myRes.data || [])].forEach((d) => {
        userIds.add(d.client_id);
        userIds.add(d.seller_id);
      });
      if (userIds.size > 0) {
        const [clientsRes, shopsRes] = await Promise.all([
          supabase.from('profiles').select('*').in('id', Array.from(userIds)),
          supabase.from('shops').select('*').in('seller_id', Array.from(userIds)),
        ]);
        const cMap: Record<string, Profile> = {};
        (clientsRes.data || []).forEach((c) => { cMap[c.id] = c; });
        setClientsMap(cMap);
        const shMap: Record<string, Shop> = {};
        (shopsRes.data || []).forEach((s) => { shMap[s.seller_id] = s; });
        setShopsMap(shMap);
      }
      setLoading(false);
    });
  }, [profile]);

  const activeDeliveries = myDeliveries.filter((d) => d.status !== 'DELIVERED' && d.status !== 'CANCELLED');
  const completedDeliveries = myDeliveries.filter((d) => d.status === 'DELIVERED');
  const totalEarnings = completedDeliveries.reduce((sum, d) => sum + d.driver_amount, 0);

  async function toggleAvailability() {
    if (!profile) return;
    const newAvailable = !profile.is_available;
    await supabase.from('profiles').update({ is_available: newAvailable }).eq('id', profile.id);
    refreshProfile();
  }

  return (
    <DashboardLayout title="Tableau de bord livreur">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bonjour, {profile?.full_name}</h2>
          <p className="text-sm text-gray-500">
            {profile?.city}{profile?.zone ? ` — ${profile.zone}` : ''}
          </p>
        </div>
        <button onClick={toggleAvailability} className={profile?.is_available ? 'btn-danger' : 'btn-primary'}>
          <Power className="h-4 w-4" />
          {profile?.is_available ? 'Indisponible' : 'Disponible'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Missions disponibles" value={availableDeliveries.length} icon={<Truck className="h-5 w-5" />} color="ketrika" />
        <StatCard label="Missions actives" value={activeDeliveries.length} icon={<Clock className="h-5 w-5" />} color="amber" />
        <StatCard label="Missions terminées" value={completedDeliveries.length} icon={<CheckCircle className="h-5 w-5" />} color="green" />
        <StatCard label="Revenus estimés" value={formatAriary(totalEarnings)} icon={<Wallet className="h-5 w-5" />} color="accent" />
      </div>

      {/* Available missions */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Missions disponibles</h3>
        {loading ? (
          <div className="card p-8 text-center text-gray-500">Chargement...</div>
        ) : !profile?.is_available ? (
          <div className="card p-6 text-center">
            <p className="text-gray-500">Vous devez être disponible pour voir les missions.</p>
          </div>
        ) : availableDeliveries.length === 0 ? (
          <div className="card p-8 text-center">
            <Truck className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">Aucune mission disponible pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableDeliveries.map((delivery) => (
              <div key={delivery.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ketrika-50 text-ketrika-600">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {delivery.pickup_city} → {delivery.delivery_city}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Store className="h-3.5 w-3.5 text-gray-400" />
                        {shopsMap[delivery.seller_id]?.name || 'Boutique'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Client: {clientsMap[delivery.client_id]?.full_name || '...'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-green-600">{formatAriary(delivery.driver_amount)}</p>
                    <Link to="/driver/deliveries" className="btn-primary text-xs">
                      Accepter
                    </Link>
                  </div>
                </div>
                {delivery.delivery_instructions && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border-2 border-amber-200 bg-amber-50 p-2.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Indications complémentaires</p>
                      <p className="mt-0.5 text-sm text-amber-900">{delivery.delivery_instructions}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My active deliveries */}
      {activeDeliveries.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Mes missions en cours</h3>
          <div className="space-y-3">
            {activeDeliveries.map((delivery) => (
              <Link
                key={delivery.id}
                to="/driver/deliveries"
                className="card block p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {delivery.pickup_city} → {delivery.delivery_city}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Store className="h-3.5 w-3.5 text-gray-400" />
                        {shopsMap[delivery.seller_id]?.name || 'Boutique'}
                      </p>
                      <p className="text-sm text-gray-500">{formatAriary(delivery.driver_amount)}</p>
                    </div>
                  </div>
                  <DeliveryStatusBadge status={delivery.status} />
                </div>
                {delivery.delivery_instructions && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border-2 border-amber-200 bg-amber-50 p-2.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Indications complémentaires</p>
                      <p className="mt-0.5 text-sm text-amber-900">{delivery.delivery_instructions}</p>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
