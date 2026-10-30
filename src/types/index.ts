export type UserRole = 'client' | 'seller' | 'driver' | 'admin';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'WAITING_FOR_DRIVER'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type DeliveryStatus =
  | 'WAITING_FOR_DRIVER'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export type ReceptionMode = 'pickup' | 'delivery';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  city: string | null;
  zone: string | null;
  is_available: boolean;
  is_suspended: boolean;
  is_validated: boolean;
  contract_url: string | null;
  commission_rate: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  sort_order: number;
}

export interface Shop {
  id: string;
  seller_id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  shop_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_ariary: number;
  stock: number;
  image_url: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  seller_id: string;
  shop_id: string;
  status: OrderStatus;
  reception_mode: ReceptionMode;
  product_subtotal: number;
  platform_sale_commission: number;
  delivery_fee: number;
  platform_delivery_commission: number;
  seller_amount: number;
  driver_amount: number;
  total_amount: number;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_city: string | null;
  delivery_quartier: string | null;
  delivery_address: string | null;
  delivery_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_ariary: number;
  quantity: number;
  subtotal: number;
}

export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  seller_id: string;
  client_id: string;
  driver_id: string | null;
  delivery_fee: number;
  platform_delivery_commission: number;
  driver_amount: number;
  status: DeliveryStatus;
  pickup_address: string | null;
  pickup_city: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_quartier: string | null;
  delivery_phone: string | null;
  delivery_instructions: string | null;
  driver_assigned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface SiteImage {
  id: string;
  section: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DeliveryStatusHistoryEntry {
  id: string;
  delivery_id: string;
  status: DeliveryStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

export interface AdminAuditLogEntry {
  id: string;
  target_user_id: string;
  admin_id: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface SellerVideo {
  id: string;
  seller_id: string;
  product_id: string | null;
  title: string;
  description: string | null;
  video_url: string;
  is_active: boolean;
  views_count: number;
  likes_count: number;
  shares_count: number;
  messages_count: number;
  created_at: string;
  updated_at: string;
}

export interface VideoLike {
  id: string;
  video_id: string;
  user_id: string;
  created_at: string;
}

export interface VideoView {
  id: string;
  video_id: string;
  user_id: string | null;
  session_key: string;
  created_at: string;
}

export interface VideoShare {
  id: string;
  video_id: string;
  user_id: string | null;
  platform: string;
  created_at: string;
}
