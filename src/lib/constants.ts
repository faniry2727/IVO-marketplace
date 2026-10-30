import type { OrderStatus, DeliveryStatus } from '@/types';

export const DELIVERY_FEE = 5000;
export const SALE_COMMISSION_RATE = 0.01;
export const DELIVERY_COMMISSION_RATE = 0.01;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  WAITING_FOR_DRIVER: 'En attente livreur',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livrée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PREPARING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  READY: 'bg-teal-100 text-teal-800 border-teal-200',
  WAITING_FOR_DRIVER: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800 border-purple-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  WAITING_FOR_DRIVER: 'En attente livreur',
  ASSIGNED: 'Assignée',
  PICKED_UP: 'Récupérée',
  IN_TRANSIT: 'En transit',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export const DELIVERY_STATUS_COLORS: Record<DeliveryStatus, string> = {
  WAITING_FOR_DRIVER: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  PICKED_UP: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  IN_TRANSIT: 'bg-purple-100 text-purple-800 border-purple-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

export const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  seller: 'Vendeur',
  driver: 'Livreur',
  admin: 'Administrateur',
};

export function formatAriary(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' Ar';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `KTR-${timestamp}${random}`;
}
