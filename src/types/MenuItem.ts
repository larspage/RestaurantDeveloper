// Interface for existing menu items from database (always have _id)
export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  category?: string;
  customizations?: string[];
  modifications?: string[];
  image?: string;
  imageUrl?: string;
}

// Interface for creating/updating menu items (optional _id)
export interface MenuItemInput {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  available?: boolean;
  category?: string;
  customizations?: string[];
  modifications?: string[];
  image?: string;
  imageUrl?: string;
  imageFile?: File;
  imageUploadProgress?: number;
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