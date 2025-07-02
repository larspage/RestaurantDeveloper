import React from 'react';
import { Menu, MenuItem, PricePoint } from '@/types/MenuItem';
import MenuSection from './MenuSection';

interface MenuGridProps {
  menu: Menu;
  onAddToCart: (item: MenuItem, selectedPricePoint?: PricePoint) => void;
}

const MenuGrid: React.FC<MenuGridProps> = ({ menu, onAddToCart }) => {
  // Filter sections that have available items
  const sectionsWithItems = menu.sections.filter(section => 
    section.items.some(item => item.available)
  );

  if (sectionsWithItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Menu Coming Soon</h2>
          <p className="text-gray-600">We're working on our menu. Please check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Menu Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Menu</h2>
          <p className="text-xl text-gray-600">Choose from our delicious selection</p>
        </div>

        {/* Menu Sections */}
        <div className="space-y-16">
          {sectionsWithItems.map((section) => (
            <MenuSection
              key={section._id}
              section={section}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>

        {/* Menu Footer */}
        <div className="text-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            All prices are in USD. Prices and availability subject to change.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuGrid; 