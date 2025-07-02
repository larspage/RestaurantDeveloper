import React, { useState } from 'react';
import { MenuItem, PricePoint } from '../types/MenuItem';
import { useCart } from '../context/CartContext';

interface MenuItemCardProps {
  item: MenuItem;
  restaurantId: string;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, restaurantId }) => {
  const { addItem } = useCart();
  const [selectedPricePoint, setSelectedPricePoint] = useState<PricePoint | null>(null);

  // Determine if item has price points
  const hasPricePoints = item.pricePoints && item.pricePoints.length > 0;
  
  // Get default price point or first price point
  const defaultPricePoint = hasPricePoints 
    ? item.pricePoints!.find(pp => pp.isDefault) || item.pricePoints![0]
    : null;

  // Set initial selected price point
  React.useEffect(() => {
    if (hasPricePoints && !selectedPricePoint) {
      setSelectedPricePoint(defaultPricePoint);
    }
  }, [hasPricePoints, selectedPricePoint, defaultPricePoint]);

  // Get display price
  const displayPrice = selectedPricePoint ? selectedPricePoint.price : item.price;

  // Handle add to cart
  const handleAddToCart = () => {
    addItem(item, restaurantId, selectedPricePoint || undefined);
  };

  // Handle price point selection
  const handlePricePointChange = (pricePoint: PricePoint) => {
    setSelectedPricePoint(pricePoint);
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm flex flex-col bg-white hover:shadow-md transition-shadow">
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
          {!item.available && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
              Unavailable
            </span>
          )}
        </div>
        
        <p className="text-gray-600 mb-3 text-sm leading-relaxed">{item.description}</p>
        
        {/* Price Points Selection */}
        {hasPricePoints ? (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Size Options:</div>
            <div className="space-y-2">
              {item.pricePoints!.map((pricePoint) => (
                <label
                  key={pricePoint.id}
                  className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${
                    selectedPricePoint?.id === pricePoint.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name={`pricePoint-${item._id}`}
                      value={pricePoint.id}
                      checked={selectedPricePoint?.id === pricePoint.id}
                      onChange={() => handlePricePointChange(pricePoint)}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {pricePoint.name}
                    </span>
                    {pricePoint.isDefault && (
                      <span className="ml-2 text-xs text-blue-600 font-medium">
                        (Popular)
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${pricePoint.price.toFixed(2)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-xl font-bold text-gray-900">${item.price.toFixed(2)}</p>
          </div>
        )}

        {/* Category and additional info */}
        <div className="flex flex-wrap gap-2 mb-3">
          {item.category && (
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
              {item.category}
            </span>
          )}
          {item.modifications && item.modifications.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
              Customizable
            </span>
          )}
        </div>

        {/* Modifications preview */}
        {item.modifications && item.modifications.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-500">
              <strong>Available modifications:</strong> {item.modifications.slice(0, 3).join(', ')}
              {item.modifications.length > 3 && '...'}
            </div>
          </div>
        )}
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!item.available}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          item.available
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {item.available ? (
          hasPricePoints ? (
            `Add to Cart - $${displayPrice.toFixed(2)}`
          ) : (
            `Add to Cart - $${item.price.toFixed(2)}`
          )
        ) : (
          'Currently Unavailable'
        )}
      </button>
    </div>
  );
};

export default MenuItemCard; 