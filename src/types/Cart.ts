import { MenuItem } from '../../backend/models/Menu';

export interface CartItem extends MenuItem {
  quantity: number;
} 