import React, { useState } from 'react';
import { MenuItem, PricePoint } from '../types/MenuItem';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, selectedPricePoint?: PricePoint) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAddToCart }) => {
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
    onAddToCart(item, selectedPricePoint || undefined);
  };

  // Handle price point selection
  const handlePricePointChange = (pricePoint: PricePoint) => {
    setSelectedPricePoint(pricePoint);
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm flex flex-col bg-white hover:shadow-md transition-shadow">
      {/* Item Image */}
      {item.imageUrl && (
        <div className="mb-3">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
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
            <div className="text-sm font-medium text-gray-700 mb-2">Choose Size:</div>
            <div className="space-y-2">
              {item.pricePoints!.map((pricePoint) => (
                <label
                  key={pricePoint.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
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
                      className="mr-3 text-blue-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {pricePoint.name}
                      </span>
                      {pricePoint.isDefault && (
                        <span className="ml-2 text-xs text-blue-600 font-medium">
                          (Most Popular)
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    ${pricePoint.price.toFixed(2)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-2xl font-bold text-green-600">${item.price.toFixed(2)}</p>
          </div>
        )}

        {/* Category and features */}
        <div className="flex flex-wrap gap-2 mb-3">
          {item.category && (
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
              {item.category}
            </span>
          )}
          {item.modifications && item.modifications.length > 0 && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
              Customizable
            </span>
          )}
        </div>

        {/* Customization options preview */}
        {item.modifications && item.modifications.length > 0 && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600">
              <strong>Customization options:</strong> {item.modifications.slice(0, 3).join(', ')}
              {item.modifications.length > 3 && ` +${item.modifications.length - 3} more`}
            </div>
          </div>
        )}
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!item.available}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-colors ${
          item.available
            ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {item.available ? (
          <>
            Add to Cart
            <span className="ml-2 font-bold">
              ${displayPrice.toFixed(2)}
            </span>
          </>
        ) : (
          'Currently Unavailable'
        )}
      </button>
    </div>
  );
};

export default MenuItemCard; 