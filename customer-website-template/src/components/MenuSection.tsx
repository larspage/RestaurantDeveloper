import React from 'react';
import { MenuSection as MenuSectionType, MenuItem, PricePoint } from '@/types/MenuItem';
import MenuItemCard from './MenuItemCard';

interface MenuSectionProps {
  section: MenuSectionType;
  onAddToCart: (item: MenuItem, selectedPricePoint?: PricePoint) => void;
}

const MenuSection: React.FC<MenuSectionProps> = ({ section, onAddToCart }) => {
  // Filter only available items for customer view
  const availableItems = section.items.filter(item => item.available);

  if (availableItems.length === 0) {
    return null; // Don't show empty sections
  }

  return (
    <div className="mb-12">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{section.name}</h2>
        {section.description && (
          <p className="text-lg text-gray-600 leading-relaxed">{section.description}</p>
        )}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableItems.map((item) => (
          <MenuItemCard
            key={item._id}
            item={item}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuSection; 