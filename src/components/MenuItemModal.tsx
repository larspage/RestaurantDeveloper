import React, { useState, useEffect } from 'react';
import { MenuItem, MenuItemInput } from '../services/menuService';
import { PricePoint } from '../types/MenuItem';
import Image from 'next/image';
import ImageUploader from './ImageUploader';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

// Type-ahead component for size selection
interface SizeTypeAheadProps {
  onSizeSelect: (size: string) => void;
  suggestions: string[];
}

const SizeTypeAhead: React.FC<SizeTypeAheadProps> = ({ onSizeSelect, suggestions }) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (inputValue.length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, suggestions]);

  const handleSelectSuggestion = (suggestion: string) => {
    onSizeSelect(suggestion);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleAddCustomSize = () => {
    if (inputValue.trim()) {
      onSizeSelect(inputValue.trim());
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        handleSelectSuggestion(filteredSuggestions[0]);
      } else {
        handleAddCustomSize();
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type size name (e.g., Small, Medium, Large)"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={handleAddCustomSize}
          disabled={!inputValue.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

type MenuItemModalProps = {
  isOpen: boolean;
  item?: MenuItem | null;
  onSave: (updatedItem: Partial<MenuItemInput>) => void;
  onCancel: () => void;
  isUploading: boolean;
  uploadProgress?: number;
  title?: string;
};

// Common size options for type-ahead
const COMMON_SIZE_OPTIONS = [
  'Small', 'Medium', 'Large', 'Extra Large',
  'Regular', 'Premium', 'Deluxe',
  'Single', 'Double', 'Triple',
  'Personal', 'Individual', 'Family',
  '6"', '9"', '12"', '16"', '18"',
  'Half Portion', 'Full Portion',
  'Cup', 'Bowl', 'Plate',
  'Appetizer', 'Entree', 'Dessert',
  'Light', 'Standard', 'Heavy',
  'Basic', 'Standard', 'Premium', 'Deluxe'
];

const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  item,
  onSave,
  onCancel,
  isUploading,
  uploadProgress = 0,
  title
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [available, setAvailable] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);
  const [usePricePoints, setUsePricePoints] = useState(false);
  const [order, setOrder] = useState('0');

  // Reset form when item changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name || '');
        setDescription(item.description || '');
        setPrice(item.price?.toString() || '0');
        setAvailable(item.available ?? true);
        setImageUrl(item.imageUrl || null);
        setPricePoints(item.pricePoints || []);
        setUsePricePoints(Boolean(item.pricePoints && item.pricePoints.length > 0));
        setOrder((item.order || 0).toString());
      } else {
        // New item
        setName('');
        setDescription('');
        setPrice('0');
        setAvailable(true);
        setImageUrl(null);
        setPricePoints([]);
        setUsePricePoints(false);
        setOrder('0');
      }
      setImageFile(null);
    }
  }, [item, isOpen]);

  const generatePricePointId = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  };

  const addPricePoint = () => {
    const newPricePoint: PricePoint = {
      id: generatePricePointId(`point_${pricePoints.length + 1}`),
      name: '',
      price: 0,
      isDefault: pricePoints.length === 0
    };
    setPricePoints([...pricePoints, newPricePoint]);
  };

  const updatePricePoint = (index: number, field: keyof PricePoint, value: any) => {
    const updated = [...pricePoints];
    if (field === 'name') {
      updated[index] = { ...updated[index], [field]: value, id: generatePricePointId(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setPricePoints(updated);
  };

  const removePricePoint = (index: number) => {
    const updated = pricePoints.filter((_, i) => i !== index);
    // If we removed the default, make the first one default
    if (updated.length > 0 && !updated.some(p => p.isDefault)) {
      updated[0].isDefault = true;
    }
    setPricePoints(updated);
  };

  const setDefaultPricePoint = (index: number) => {
    const updated = pricePoints.map((point, i) => ({
      ...point,
      isDefault: i === index
    }));
    setPricePoints(updated);
  };

  const addCommonSize = (sizeName: string) => {
    const newPricePoint: PricePoint = {
      id: generatePricePointId(sizeName),
      name: sizeName,
      price: 0,
      isDefault: pricePoints.length === 0
    };
    setPricePoints([...pricePoints, newPricePoint]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const updatedItem: Partial<MenuItemInput> = {
      name,
      description,
      price: parseFloat(price),
      available,
      order: parseInt(order) || 0,
    };

    // Add price points if enabled
    if (usePricePoints && pricePoints.length > 0) {
      updatedItem.pricePoints = pricePoints;
      // Set the base price to the default price point for backward compatibility
      const defaultPricePoint = pricePoints.find(p => p.isDefault) || pricePoints[0];
      if (defaultPricePoint) {
        updatedItem.price = defaultPricePoint.price;
      }
    } else {
      // If not using price points, clear any existing ones
      updatedItem.pricePoints = [];
    }

    // Include image file if selected
    if (imageFile) {
      updatedItem.imageFile = imageFile;
    }
    onSave(updatedItem);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {title || (item?._id ? 'Edit Menu Item' : 'Add New Menu Item')}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter item name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your menu item"
              />
            </div>

            <div>
              <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
                              <input
                  type="number"
                  id="order"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers appear first in the menu (0, 1, 2, etc.)
              </p>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="usePricePoints"
                checked={usePricePoints}
                onChange={(e) => setUsePricePoints(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="usePricePoints" className="text-sm font-medium text-gray-700">
                Multiple sizes/prices (Small, Medium, Large, etc.)
              </label>
            </div>

            {!usePricePoints ? (
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-700">Price Points</h4>
                  <button
                    type="button"
                    onClick={addPricePoint}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Size</span>
                  </button>
                </div>

                {/* Size Name Input with Type-ahead */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add New Size
                  </label>
                  <SizeTypeAhead
                    onSizeSelect={addCommonSize}
                    suggestions={COMMON_SIZE_OPTIONS}
                  />
                </div>

                {/* Price Points List */}
                <div className="space-y-3">
                  {pricePoints.map((point, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={point.name}
                          onChange={(e) => updatePricePoint(index, 'name', e.target.value)}
                          placeholder="Size name (e.g., Small, Medium)"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="w-24">
                                                 <div className="relative">
                           <span className="absolute left-2 top-1 text-xs text-gray-500">$</span>
                           <input
                             type="number"
                             value={point.price}
                             onChange={(e) => updatePricePoint(index, 'price', parseFloat(e.target.value) || 0)}
                             onFocus={(e) => e.target.select()}
                             step="0.01"
                             min="0"
                             className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                           />
                         </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setDefaultPricePoint(index)}
                          className={`px-2 py-1 text-xs rounded w-20 ${
                            point.isDefault 
                              ? 'bg-green-100 text-green-700 border border-green-300' 
                              : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {point.isDefault ? 'Default' : 'Set Default'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removePricePoint(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {pricePoints.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No price points added yet. Click "Add Size" or use quick add buttons above.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Image
            </label>
            <ImageUploader
              onFileAccepted={setImageFile}
              existingImageUrl={imageUrl}
              onRemoveImage={() => setImageUrl(null)}
            />
          </div>

          {/* Availability */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="available"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="available" className="text-sm font-medium text-gray-700">
              Available for ordering
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : (item?._id ? 'Update Item' : 'Add Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuItemModal; 