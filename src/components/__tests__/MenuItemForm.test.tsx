import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuItemForm from '../MenuItemForm';
import { MenuItem } from '../../services/menuService';

// Mock the ImageUploader component
jest.mock('../ImageUploader', () => {
  return function MockImageUploader({ onFileAccepted, existingImageUrl, onRemoveImage }: any) {
    return (
      <div data-testid="image-uploader">
        <input
          type="file"
          data-testid="file-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onFileAccepted) {
              onFileAccepted(file);
            }
          }}
        />
        {existingImageUrl && (
          <div>
            <img src={existingImageUrl} alt="Preview" data-testid="preview-image" />
            <button onClick={onRemoveImage} data-testid="delete-image">
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };
});

const mockMenuItem: MenuItem = {
  _id: 'test-item-1',
  name: 'Test Item',
  description: 'Test description',
  price: 12.99,
  available: true,
  imageUrl: '',
  customizations: []
};

describe('MenuItemForm', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders form with item data', () => {
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12.99')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeChecked();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders image uploader component', () => {
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
      expect(screen.getByTestId('file-input')).toBeInTheDocument();
    });

    it('shows existing image when item has imageUrl', () => {
      const itemWithImage = {
        ...mockMenuItem,
        imageUrl: 'https://example.com/image.jpg'
      };

      render(
        <MenuItemForm
          item={itemWithImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      expect(screen.getByTestId('preview-image')).toBeInTheDocument();
      expect(screen.getByTestId('delete-image')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('allows editing form fields', async () => {
      const user = userEvent.setup();
      
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Item');
      const descriptionInput = screen.getByDisplayValue('Test description');
      const priceInput = screen.getByDisplayValue('12.99');

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Item');
      
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description');
      
      await user.clear(priceInput);
      await user.type(priceInput, '15.99');

      expect(nameInput).toHaveValue('Updated Item');
      expect(descriptionInput).toHaveValue('Updated description');
      expect(priceInput).toHaveValue(15.99);
    });

    it('toggles availability checkbox', async () => {
      const user = userEvent.setup();
      
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      const availableCheckbox = screen.getByRole('checkbox');
      expect(availableCheckbox).toBeChecked();

      await user.click(availableCheckbox);
      expect(availableCheckbox).not.toBeChecked();

      await user.click(availableCheckbox);
      expect(availableCheckbox).toBeChecked();
    });

    it('calls onSave with updated data when form is submitted', async () => {
      const user = userEvent.setup();
      
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      // Update form fields
      const nameInput = screen.getByDisplayValue('Test Item');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Item');

      const priceInput = screen.getByDisplayValue('12.99');
      await user.clear(priceInput);
      await user.type(priceInput, '15.99');

      // Submit form
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(mockOnSave).toHaveBeenCalledWith({
        name: 'Updated Item',
        description: 'Test description',
        price: 15.99,
        available: true
      });
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Image Upload', () => {
    it('handles file selection', async () => {
      const user = userEvent.setup();
      
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      // Submit form to check if imageFile is included
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          imageFile: file
        })
      );
    });

    it('handles image removal', async () => {
      const user = userEvent.setup();
      const itemWithImage = {
        ...mockMenuItem,
        imageUrl: 'https://example.com/image.jpg'
      };

      render(
        <MenuItemForm
          item={itemWithImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      // Should show preview image
      expect(screen.getByTestId('preview-image')).toBeInTheDocument();

      // Delete image
      await user.click(screen.getByTestId('delete-image'));

      // Should remove preview
      expect(screen.queryByTestId('preview-image')).not.toBeInTheDocument();
    });
  });

  describe('Upload States', () => {
    it('shows upload progress when uploading', () => {
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={true}
          uploadProgress={50}
        />
      );

      expect(screen.getByText('Uploading: 50%')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /uploading/i })).toBeDisabled();
    });

    it('disables submit button when uploading', () => {
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /uploading/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows normal state when not uploading', () => {
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save/i });
      expect(submitButton).not.toBeDisabled();
      expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('prevents submission with empty name', async () => {
      const user = userEvent.setup();
      
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      // Clear name field
      const nameInput = screen.getByDisplayValue('Test Item');
      await user.clear(nameInput);

      // Try to submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Form should not be submitted due to HTML5 validation
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('prevents submission with empty price', async () => {
      const user = userEvent.setup();
      
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      // Clear price field
      const priceInput = screen.getByDisplayValue('12.99');
      await user.clear(priceInput);

      // Try to submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Form should not be submitted due to HTML5 validation
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('handles price parsing correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      // Set price to decimal value
      const priceInput = screen.getByDisplayValue('12.99');
      await user.clear(priceInput);
      await user.type(priceInput, '25.50');

      // Submit form
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 25.50
        })
      );
    });
  });

  describe('Component Updates', () => {
    it('updates form when item prop changes', () => {
      const { rerender } = render(
        <MenuItemForm
          item={mockMenuItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      // Initial values
      expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12.99')).toBeInTheDocument();

      // Update item prop
      const newItem = {
        ...mockMenuItem,
        name: 'New Item Name',
        price: 20.99
      };

      rerender(
        <MenuItemForm
          item={newItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      // Form should update with new values
      expect(screen.getByDisplayValue('New Item Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('20.99')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles item with no description', () => {
      const itemWithoutDescription = {
        ...mockMenuItem,
        description: ''
      };

      render(
        <MenuItemForm
          item={itemWithoutDescription}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i);
      expect(descriptionInput).toHaveValue('');
    });

    it('handles unavailable item', () => {
      const unavailableItem = {
        ...mockMenuItem,
        available: false
      };

      render(
        <MenuItemForm
          item={unavailableItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      const availableCheckbox = screen.getByRole('checkbox');
      expect(availableCheckbox).not.toBeChecked();
    });

    it('handles zero price', () => {
      const freeItem = {
        ...mockMenuItem,
        price: 0
      };

      render(
        <MenuItemForm
          item={freeItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isUploading={false}
        />
      );

      expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    });
  });
}); 