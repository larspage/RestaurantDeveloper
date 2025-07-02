import { MenuItem, PricePoint } from './MenuItem';

export interface CartItem extends MenuItem {
  quantity: number;
  selectedPricePoint?: PricePoint; // Track which price point was selected
} 