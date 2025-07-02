// Interface for price points (Small/Medium/Large, Regular/Premium, etc.)
export interface PricePoint {
  id: string;
  name: string; // "Small", "Medium", "Large", "Regular", "Premium"
  price: number;
  isDefault?: boolean;
}

// Interface for menu items from database
export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number; // Base/default price for backward compatibility
  pricePoints?: PricePoint[]; // Optional array of price points
  available: boolean;
  category?: string;
  customizations?: string[];
  modifications?: string[];
  image?: string;
  imageUrl?: string;
}

export interface MenuSection {
  _id: string;
  name: string;
  description?: string;
  displayOrder?: number;
  order?: number;
  isActive?: boolean;
  items: MenuItem[];
}

export interface Menu {
  _id: string;
  restaurant: string;
  name?: string;
  description?: string;
  sections: MenuSection[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
} 