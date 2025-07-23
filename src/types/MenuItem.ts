// Interface for price points (Small/Medium/Large, Regular/Premium, etc.)
export interface PricePoint {
  id: string;
  name: string; // "Small", "Medium", "Large", "Regular", "Premium"
  price: number;
  isDefault?: boolean;
}

// Interface for existing menu items from database (always have _id)
export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number; // Keep for backward compatibility - represents base/default price
  pricePoints?: PricePoint[]; // Optional array of price points
  available: boolean;
  category?: string;
  customizations?: string[];
  modifications?: string[];
  image?: string;
  imageUrl?: string;
  order?: number; // For sorting items within a section
}

// Interface for creating/updating menu items (optional _id)
export interface MenuItemInput {
  _id?: string;
  name: string;
  description?: string;
  price: number; // Keep for backward compatibility - represents base/default price
  pricePoints?: PricePoint[]; // Optional array of price points
  available?: boolean;
  category?: string;
  customizations?: string[];
  modifications?: string[];
  image?: string;
  imageUrl?: string;
  imageFile?: File;
  imageUploadProgress?: number;
  order?: number; // For sorting items within a section
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

// Interface for creating/updating menu sections (optional _id)
export interface MenuSectionInput {
  _id?: string;
  name: string;
  description?: string;
  displayOrder?: number;
  order?: number;
  isActive?: boolean;
  items: MenuItemInput[];
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