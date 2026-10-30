import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeLogo as Logo } from '@/components/ThemeLogo';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import {
  formatAriary, DELIVERY_FEE, SALE_COMMISSION_RATE, DELIVERY_COMMISSION_RATE,
  generateOrderNumber,
} from '@/lib/constants';
import type { Profile } from '@/types';
import type { Order } from '@/types';
import {
  ArrowLeft, ArrowRight, Check, Store, MapPin, Truck, Package, Home as HomeIcon,
  CreditCard, AlertCircle,
} from 'lucide-react';

type Step = 1 | 2 | 3;
type ReceptionMode = 'pickup' | 'delivery';
type PaymentMode = 'cash' | 'simulation';

export function CheckoutPage() {
  const { profile } = useAuth();
  const { items, subtotal, sellerId, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [receptionMode, setReceptionMode] = useState<ReceptionMode>('pickup');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deliveryInfo, setDeliveryInfo] = useState({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    quartier: '',
    address: '',
    instructions: '',
  });

  const [sellerProfile, setSellerProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', sellerId)
      .maybeSingle()
      .then(({ data }) => {
        setSellerProfile(data as Profile | null);
      });
  }, [sellerId]);

  const sellerCommissionRate = sellerProfile?.commission_rate ?? SALE_COMMISSION_RATE;

  const deliveryFee = receptionMode === 'delivery' ? DELIVERY_FEE : 0;
  const saleCommission = Math.round(subtotal * sellerCommissionRate);
  const deliveryCommission = Math.round(deliveryFee * DELIVERY_COMMISSION_RATE);
  const sellerAmount = subtotal - saleCommission;
  const driverAmount = deliveryFee - deliveryCommission;
  const totalAmount = subtotal + deliveryFee;

  async function handlePlaceOrder(e: FormEvent) {
    e.preventDefault();
    if (!profile || !sellerId || items.length === 0) return;
    setSubmitting(true);
    setError(null);

    const orderNumber = generateOrderNumber();
    const shopId = items[0].shop.id;

    const orderData = {
      order_number: orderNumber,
      client_id: profile.id,
      seller_id: sellerId,
      shop_id: shopId,
      status: 'PENDING' as const,
      reception_mode: receptionMode,
      product_subtotal: subtotal,
      platform_sale_commission: saleCommission,
      delivery_fee: deliveryFee,
      platform_delivery_commission: deliveryCommission,
      seller_amount: sellerAmount,
      driver_amount: driverAmount,
      total_amount: totalAmount,
      delivery_name: receptionMode === 'delivery' ? deliveryInfo.name : null,
      delivery_phone: receptionMode === 'delivery' ? deliveryInfo.phone : null,
      delivery_city: receptionMode === 'delivery' ? deliveryInfo.city : null,
      delivery_quartier: receptionMode === 'delivery' ? deliveryInfo.quartier : null,
      delivery_address: receptionMode === 'delivery' ? deliveryInfo.address : null,
      delivery_instructions: receptionMode === 'delivery' ? deliveryInfo.instructions : null,
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError || !order) {
      setError('Erreur lors de la création de la commande: ' + (orderError?.message || 'inconnue'));
      setSubmitting(false);
      return;
    }

    const insertedOrder = order as Order;

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: insertedOrder.id,
      product_id: item.product.id,
      product_name: item.product.name,
      unit_price_ariary: item.product.price_ariary,
      quantity: item.quantity,
      subtotal: item.product.price_ariary * item.quantity,
    }));
    await supabase.from('order_items').insert(orderItems);

    // Insert initial status history
    await supabase.from('order_status_history').insert({
      order_id: insertedOrder.id,
      status: 'PENDING',
      changed_by: profile.id,
    });

    clearCart();
    setSubmitting(false);
    navigate(`/client/orders/${insertedOrder.id}`);
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="card max-w-md p-8 text-center">
          <p className="text-gray-500">Votre panier est vide.</p>
          <Link to="/products" className="btn-primary mt-4">Voir le catalogue</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/"><Logo placement="main" size="sm" /></Link>
          <Link to="/cart" className="text-sm font-medium text-gray-700 hover:text-ketrika-600">Retour au panier</Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/cart" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-ketrika-600 hover:text-ketrika-700">
          <ArrowLeft className="h-4 w-4" />
          Retour au panier
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Commander</h1>

        {/* Stepper */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                step >= s ? 'bg-ketrika-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              <span className={`text-xs font-medium ${step >= s ? 'text-ketrika-700' : 'text-gray-400'}`}>
                {s === 1 ? 'Récapitulatif' : s === 2 ? 'Réception' : 'Paiement'}
              </span>
              {s < 3 && <div className={`h-0.5 flex-1 ${step > s ? 'bg-ketrika-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Recap */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{items[0].shop.name}</p>
                  <p className="text-xs text-gray-500">{items[0].shop.city}</p>
                </div>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-500">{item.quantity} x {formatAriary(item.product.price_ariary)}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatAriary(item.product.price_ariary * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total produits</span>
                  <span className="font-medium text-gray-900">{formatAriary(subtotal)}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setStep(2)} className="btn-primary w-full">
              Continuer
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Reception mode */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Mode de réception</h3>

              {/* Pickup */}
              <button
                onClick={() => setReceptionMode('pickup')}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all mb-3 ${
                  receptionMode === 'pickup' ? 'border-ketrika-500 bg-ketrika-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    receptionMode === 'pickup' ? 'bg-ketrika-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <HomeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Retrait</p>
                    <p className="text-sm text-gray-500">Je récupère moi-même la commande</p>
                    <div className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {items[0].shop.address || 'Adresse du vendeur'}, {items[0].shop.city}
                      </p>
                      <p className="mt-1 font-medium text-green-600">Frais de livraison: 0 Ar</p>
                    </div>
                  </div>
                </div>
              </button>

              {/* Delivery */}
              <button
                onClick={() => setReceptionMode('delivery')}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                  receptionMode === 'delivery' ? 'border-ketrika-500 bg-ketrika-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    receptionMode === 'delivery' ? 'bg-ketrika-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Livraison</p>
                    <p className="text-sm text-gray-500">Je souhaite être livré</p>
                    <p className="mt-2 font-medium text-green-600">Frais de livraison: {formatAriary(DELIVERY_FEE)}</p>
                  </div>
                </div>
              </button>

              {/* Delivery form */}
              {receptionMode === 'delivery' && (
                <div className="mt-4 space-y-3 rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-700">Adresse de livraison</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label-text">Nom du destinataire</label>
                      <input className="input-field" required value={deliveryInfo.name} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="label-text">Téléphone</label>
                      <input className="input-field" required value={deliveryInfo.phone} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label-text">Ville</label>
                      <input className="input-field" required value={deliveryInfo.city} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })} />
                    </div>
                    <div>
                      <label className="label-text">Quartier</label>
                      <input className="input-field" required value={deliveryInfo.quartier} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, quartier: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Adresse</label>
                    <input className="input-field" required value={deliveryInfo.address} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-text">Indication complémentaire (optionnel)</label>
                    <input className="input-field" value={deliveryInfo.instructions} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, instructions: e.target.value })} />
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total produits</span>
                  <span className="font-medium text-gray-900">{formatAriary(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de livraison</span>
                  <span className="font-medium text-gray-900">{formatAriary(deliveryFee)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-ketrika-700">{formatAriary(totalAmount)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary">Retour</button>
              <button
                onClick={() => setStep(3)}
                disabled={receptionMode === 'delivery' && (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.city || !deliveryInfo.quartier || !deliveryInfo.address)}
                className="btn-primary flex-1"
              >
                Continuer
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div className="card p-5">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Mode de paiement</h3>

              {/* Cash on delivery */}
              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all mb-3 ${
                  paymentMode === 'cash' ? 'border-ketrika-500 bg-ketrika-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    paymentMode === 'cash' ? 'bg-ketrika-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Paiement à la livraison</p>
                    <p className="text-sm text-gray-500">
                      {receptionMode === 'pickup'
                        ? 'Payez en espèces lors du retrait chez le vendeur'
                        : 'Payez en espèces à la réception par le livreur'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Simulation */}
              <button
                type="button"
                onClick={() => setPaymentMode('simulation')}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                  paymentMode === 'simulation' ? 'border-ketrika-500 bg-ketrika-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    paymentMode === 'simulation' ? 'bg-ketrika-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Simulation de paiement
                      <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        TEST
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Simule un paiement Mobile Money (MVola, Airtel Money, Orange Money)
                    </p>
                  </div>
                </div>
              </button>

              {paymentMode === 'simulation' && (
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="flex items-start gap-2 text-xs text-amber-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    Ceci est une simulation. Aucun paiement réel ne sera effectué. Les API Mobile Money (MVola, Airtel Money, Orange Money) seront intégrées ultérieurement.
                  </p>
                </div>
              )}

              {/* Final summary */}
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total produits</span>
                  <span className="font-medium text-gray-900">{formatAriary(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de livraison</span>
                  <span className="font-medium text-gray-900">{formatAriary(deliveryFee)}</span>
                </div>
                {receptionMode === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Commission KETRIKA (livraison 1%)</span>
                    <span className="text-gray-500">{formatAriary(deliveryCommission)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span className="font-bold text-gray-900">Total à payer</span>
                  <span className="font-bold text-ketrika-700">{formatAriary(totalAmount)}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary">Retour</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Création...' : 'Confirmer la commande'}
                <Check className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
