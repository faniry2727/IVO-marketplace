import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/PublicHeader';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { formatAriary, DELIVERY_FEE } from '@/lib/constants';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Store, MapPin } from 'lucide-react';

export function CartPage() {
  const { profile } = useAuth();
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/products" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-ketrika-600 hover:text-ketrika-700">
          <ArrowLeft className="h-4 w-4" />
          Continuer mes achats
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-gray-900">Mon panier</h1>

        {items.length === 0 ? (
          <div className="card p-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">Votre panier est vide.</p>
            <Link to="/products" className="btn-primary mt-4">
              Découvrir le catalogue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Shop info */}
            <div className="card mb-4 flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Boutique</p>
                <p className="font-semibold text-gray-900">{items[0].shop.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {items[0].shop.city}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="card p-4">
                  <div className="flex gap-4">
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ketrika-50 to-gray-100">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="h-full w-full rounded-lg object-cover" />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-ketrika-200" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link to={`/products/${item.product.id}`} className="font-semibold text-gray-900 hover:text-ketrika-600">
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-gray-500">{formatAriary(item.product.price_ariary)} / unité</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-10 text-center font-semibold text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="font-bold text-gray-900">{formatAriary(item.product.price_ariary * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="card mt-4 p-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total produits</span>
                  <span className="font-medium text-gray-900">{formatAriary(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais de livraison</span>
                  <span className="text-gray-500">Selon le mode de retrait</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span className="font-bold text-gray-900">Total estimé</span>
                  <span className="font-bold text-ketrika-700">à partir de {formatAriary(subtotal)}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                {profile ? (
                  <Link to="/checkout" className="btn-primary flex-1">
                    Passer la commande
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link to="/login" className="btn-primary flex-1">
                    Connectez-vous pour commander
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <button onClick={clearCart} className="btn-secondary">
                  Vider
                </button>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              Pour cette version, une commande = une boutique. Frais de livraison: {formatAriary(DELIVERY_FEE)} si livraison.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
