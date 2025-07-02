export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  pricePointName?: string;
}

export interface GuestInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface Order {
  _id: string;
  restaurant_id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  guest_info?: GuestInfo;
  special_instructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPayload {
  restaurant_id: string;
  items: OrderItem[];
  guest_info?: GuestInfo;
  special_instructions?: string;
} 