import React, { useState, useEffect } from 'react';
import { MenuItem, MenuItemInput } from '../services/menuService';
import Image from 'next/image';
import ImageUploader from './ImageUploader';

type MenuItemFormProps = {
  item: MenuItem;
  onSave: (updatedItem: Partial<MenuItemInput>) => void;
  onCancel: () => void;
  isUploading: boolean;
  uploadProgress?: number;
};

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  item,
  onSave,
  onCancel,
  isUploading,
  uploadProgress = 0
}) => {
  const [name, setName] = useState(item.name || '');
  const [description, setDescription] = useState(item.description || '');
  const [price, setPrice] = useState(item.price?.toString() || '0');
  const [available, setAvailable] = useState(item.available ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // This state will hold the image URL for the uploader
  const [imageUrl, setImageUrl] = useState<string | null>(item.imageUrl || null);
  
  // Reset form when item changes
  useEffect(() => {
    console.log('MenuItemForm: Item changed, resetting form:', item);
    setName(item.name || '');
    setDescription(item.description || '');
    setPrice(item.price?.toString() || '0');
    setAvailable(item.available ?? true);
    setImageFile(null);
    setImageUrl(item.imageUrl || null);
  }, [item]);
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const updatedItem: Partial<MenuItemInput> = {
      name,
      description,
      price: parseFloat(price),
      available,
    };
    
    // If there's a new image file, include it
    if (imageFile) {
      updatedItem.imageFile = imageFile;
    }
    
    onSave(updatedItem);
  };
  
  const handleFileAccepted = (file: File) => {
    setImageFile(file);
    setImageUrl(null); // Clear the existing URL when a new file is selected
  }
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImageUrl(null);
  };
  
  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          data-cy="menu-item-name-input"
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          data-cy="menu-item-description-input"
        />
      </div>
      
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          Price ($)
        </label>
        <input
          type="number"
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          step="0.01"
          min="0"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          data-cy="menu-item-price-input"
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="available"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          data-cy="menu-item-available-checkbox"
        />
        <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
          Available
        </label>
      </div>
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Item Image</label>
        <ImageUploader 
          onFileAccepted={setImageFile}
          existingImageUrl={imageUrl}
          onRemoveImage={() => {
            setImageFile(null);
            setImageUrl(null);
          }}
          data-cy="menu-item-image-uploader"
        />
      </div>
      
      {isUploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Uploading: {uploadProgress}%
          </p>
        </div>
      )}
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          data-cy="cancel-edit-item-button"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUploading}
          className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isUploading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          data-cy="save-item-button"
        >
          {isUploading ? 'Uploading...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default MenuItemForm; 