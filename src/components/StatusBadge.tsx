import type { OrderStatus, DeliveryStatus } from '@/types';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
} from '@/lib/constants';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${ORDER_STATUS_COLORS[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${DELIVERY_STATUS_COLORS[status]}`}>
      {DELIVERY_STATUS_LABELS[status]}
    </span>
  );
}
