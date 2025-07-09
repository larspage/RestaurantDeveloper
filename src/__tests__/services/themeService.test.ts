import themeService, { Theme } from '../../services/themeService';
import api from '../../services/api';

// Mock the API service
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('themeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllThemes', () => {
    it('should fetch all themes successfully', async () => {
      const mockThemes: Theme[] = [
        {
          _id: '1',
          name: 'classic',
          displayName: 'Classic',
          description: 'A timeless classic theme',
          colors: {
            primary: '#000000',
            secondary: '#ffffff',
            accent: '#cccccc',
            background: '#f5f5f5',
            text: '#333333'
          },
          fonts: {
            heading: 'Arial',
            body: 'Helvetica'
          },
          spacing: {
            unit: 8,
            scale: 1.5
          },
          borderRadius: 4,
          shadows: ['0 2px 4px rgba(0,0,0,0.1)'],
          tags: ['classic', 'minimal'],
          customizable: true,
          version: '1.0.0',
          usage_count: 10
        },
        {
          _id: '2',
          name: 'modern',
          displayName: 'Modern',
          description: 'A sleek modern theme',
          colors: {
            primary: '#2563eb',
            secondary: '#f1f5f9',
            accent: '#3b82f6',
            background: '#ffffff',
            text: '#1e293b'
          },
          fonts: {
            heading: 'Inter',
            body: 'Inter'
          },
          spacing: {
            unit: 12,
            scale: 1.25
          },
          borderRadius: 8,
          shadows: ['0 4px 6px rgba(0,0,0,0.1)'],
          tags: ['modern', 'clean'],
          customizable: true,
          version: '1.0.0',
          usage_count: 25
        }
      ];

      mockedApi.get.mockResolvedValue({ data: mockThemes });

      const result = await themeService.getAllThemes();

      expect(mockedApi.get).toHaveBeenCalledWith('/themes');
      expect(result).toEqual(mockThemes);
    });

    it('should handle API errors when fetching themes', async () => {
      const mockError = new Error('Network error');
      mockedApi.get.mockRejectedValue(mockError);

      await expect(themeService.getAllThemes()).rejects.toThrow('Network error');
      expect(mockedApi.get).toHaveBeenCalledWith('/themes');
    });

    it('should handle empty response', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await themeService.getAllThemes();

      expect(result).toEqual([]);
      expect(mockedApi.get).toHaveBeenCalledWith('/themes');
    });

    it('should return properly typed Theme objects', async () => {
      const mockThemes: Theme[] = [
        {
          _id: '1',
          name: 'test',
          displayName: 'Test Theme',
          description: 'Test description',
          colors: {
            primary: '#000000',
            secondary: '#ffffff',
            accent: '#cccccc',
            background: '#f5f5f5',
            text: '#333333'
          },
          fonts: {
            heading: 'Arial',
            body: 'Helvetica'
          },
          spacing: {
            unit: 8,
            scale: 1.5
          },
          borderRadius: 4,
          shadows: ['0 2px 4px rgba(0,0,0,0.1)'],
          tags: ['test'],
          customizable: true,
          version: '1.0.0',
          usage_count: 0
        }
      ];

      mockedApi.get.mockResolvedValue({ data: mockThemes });

      const result = await themeService.getAllThemes();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('_id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('displayName');
      expect(result[0]).toHaveProperty('colors');
      expect(result[0]).toHaveProperty('fonts');
      expect(result[0]).toHaveProperty('spacing');
      expect(result[0].colors).toHaveProperty('primary');
      expect(result[0].colors).toHaveProperty('secondary');
    });
  });

  describe('getThemesByTags', () => {
    it('should fetch themes by single tag successfully', async () => {
      const mockThemes: Theme[] = [
        {
          _id: '1',
          name: 'modern',
          displayName: 'Modern',
          description: 'A modern theme',
          colors: {
            primary: '#2563eb',
            secondary: '#f1f5f9',
            accent: '#3b82f6',
            background: '#ffffff',
            text: '#1e293b'
          },
          fonts: {
            heading: 'Inter',
            body: 'Inter'
          },
          spacing: {
            unit: 12,
            scale: 1.25
          },
          borderRadius: 8,
          shadows: ['0 4px 6px rgba(0,0,0,0.1)'],
          tags: ['modern'],
          customizable: true,
          version: '1.0.0',
          usage_count: 5
        }
      ];

      mockedApi.get.mockResolvedValue({ data: mockThemes });

      const result = await themeService.getThemesByTags(['modern']);

      expect(mockedApi.get).toHaveBeenCalledWith('/themes?tags=modern');
      expect(result).toEqual(mockThemes);
    });

    it('should fetch themes by multiple tags successfully', async () => {
      const mockThemes: Theme[] = [];
      mockedApi.get.mockResolvedValue({ data: mockThemes });

      const result = await themeService.getThemesByTags(['modern', 'clean', 'minimal']);

      expect(mockedApi.get).toHaveBeenCalledWith('/themes?tags=modern,clean,minimal');
      expect(result).toEqual(mockThemes);
    });

    it('should handle empty tags array', async () => {
      const mockThemes: Theme[] = [];
      mockedApi.get.mockResolvedValue({ data: mockThemes });

      const result = await themeService.getThemesByTags([]);

      expect(mockedApi.get).toHaveBeenCalledWith('/themes?tags=');
      expect(result).toEqual(mockThemes);
    });

    it('should handle tags with special characters', async () => {
      const mockThemes: Theme[] = [];
      mockedApi.get.mockResolvedValue({ data: mockThemes });

      const result = await themeService.getThemesByTags(['tag-with-dash', 'tag_with_underscore']);

      expect(mockedApi.get).toHaveBeenCalledWith('/themes?tags=tag-with-dash,tag_with_underscore');
      expect(result).toEqual(mockThemes);
    });

    it('should handle API errors when fetching themes by tags', async () => {
      const mockError = new Error('Server error');
      mockedApi.get.mockRejectedValue(mockError);

      await expect(themeService.getThemesByTags(['modern'])).rejects.toThrow('Server error');
      expect(mockedApi.get).toHaveBeenCalledWith('/themes?tags=modern');
    });
  });

  describe('getTheme', () => {
    it('should fetch a theme by ID successfully', async () => {
      const mockTheme: Theme = {
        _id: '1',
        name: 'classic',
        displayName: 'Classic',
        description: 'A timeless classic theme',
        colors: {
          primary: '#000000',
          secondary: '#ffffff',
          accent: '#cccccc',
          background: '#f5f5f5',
          text: '#333333'
        },
        fonts: {
          heading: 'Arial',
          body: 'Helvetica'
        },
        spacing: {
          unit: 8,
          scale: 1.5
        },
        borderRadius: 4,
        shadows: ['0 2px 4px rgba(0,0,0,0.1)'],
        tags: ['classic', 'minimal'],
        customizable: true,
        version: '1.0.0',
        usage_count: 10
      };

      mockedApi.get.mockResolvedValue({ data: mockTheme });

      const result = await themeService.getTheme('1');

      expect(mockedApi.get).toHaveBeenCalledWith('/themes/1');
      expect(result).toEqual(mockTheme);
    });

    it('should handle API errors when fetching theme by ID', async () => {
      const mockError = new Error('Theme not found');
      mockedApi.get.mockRejectedValue(mockError);

      await expect(themeService.getTheme('nonexistent')).rejects.toThrow('Theme not found');
      expect(mockedApi.get).toHaveBeenCalledWith('/themes/nonexistent');
    });

    it('should handle empty string ID', async () => {
      const mockError = new Error('Invalid ID');
      mockedApi.get.mockRejectedValue(mockError);

      await expect(themeService.getTheme('')).rejects.toThrow('Invalid ID');
      expect(mockedApi.get).toHaveBeenCalledWith('/themes/');
    });

    it('should handle special characters in ID', async () => {
      const specialId = 'theme-with-special-chars!@#';
      const mockTheme: Theme = {
        _id: specialId,
        name: 'special',
        displayName: 'Special Theme',
        description: 'A theme with special ID',
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          accent: '#0000ff',
          background: '#ffffff',
          text: '#000000'
        },
        fonts: {
          heading: 'Arial',
          body: 'Helvetica'
        },
        spacing: {
          unit: 8,
          scale: 1.5
        },
        borderRadius: 4,
        shadows: ['0 2px 4px rgba(0,0,0,0.1)'],
        tags: ['special'],
        customizable: true,
        version: '1.0.0',
        usage_count: 0
      };

      mockedApi.get.mockResolvedValue({ data: mockTheme });

      const result = await themeService.getTheme(specialId);

      expect(mockedApi.get).toHaveBeenCalledWith(`/themes/${specialId}`);
      expect(result).toEqual(mockTheme);
    });

    it('should return properly typed Theme object', async () => {
      const mockTheme: Theme = {
        _id: '1',
        name: 'test',
        displayName: 'Test Theme',
        description: 'Test description',
        colors: {
          primary: '#000000',
          secondary: '#ffffff',
          accent: '#cccccc',
          background: '#f5f5f5',
          text: '#333333'
        },
        fonts: {
          heading: 'Arial',
          body: 'Helvetica'
        },
        spacing: {
          unit: 8,
          scale: 1.5
        },
        borderRadius: 4,
        shadows: ['0 2px 4px rgba(0,0,0,0.1)'],
        tags: ['test'],
        customizable: true,
        version: '1.0.0',
        usage_count: 0
      };

      mockedApi.get.mockResolvedValue({ data: mockTheme });

      const result = await themeService.getTheme('1');

      expect(result).toHaveProperty('_id', '1');
      expect(result).toHaveProperty('name', 'test');
      expect(result).toHaveProperty('displayName', 'Test Theme');
      expect(result.colors).toHaveProperty('primary', '#000000');
      expect(result.fonts).toHaveProperty('heading', 'Arial');
      expect(result.spacing).toHaveProperty('unit', 8);
      expect(Array.isArray(result.tags)).toBe(true);
      expect(Array.isArray(result.shadows)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockedApi.get.mockRejectedValue(timeoutError);

      await expect(themeService.getAllThemes()).rejects.toThrow('Request timeout');
    });

    it('should handle server errors (500)', async () => {
      const serverError = new Error('Internal server error');
      mockedApi.get.mockRejectedValue(serverError);

      await expect(themeService.getAllThemes()).rejects.toThrow('Internal server error');
    });

    it('should handle unauthorized errors (401)', async () => {
      const authError = new Error('Unauthorized');
      mockedApi.get.mockRejectedValue(authError);

      await expect(themeService.getAllThemes()).rejects.toThrow('Unauthorized');
    });

    it('should handle malformed response data', async () => {
      mockedApi.get.mockResolvedValue({ data: null });

      const result = await themeService.getAllThemes();

      expect(result).toBeNull();
    });
  });

  describe('API Integration', () => {
    it('should use correct API endpoints for all operations', async () => {
      // Test all endpoints are called correctly
      mockedApi.get.mockResolvedValue({ data: [] });

      await themeService.getAllThemes();
      await themeService.getThemesByTags(['test']);
      await themeService.getTheme('test-id');

      expect(mockedApi.get).toHaveBeenCalledWith('/themes');
      expect(mockedApi.get).toHaveBeenCalledWith('/themes?tags=test');
      expect(mockedApi.get).toHaveBeenCalledWith('/themes/test-id');
      expect(mockedApi.get).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent requests', async () => {
      const mockTheme: Theme = {
        _id: '1',
        name: 'test',
        displayName: 'Test',
        description: 'Test',
        colors: {
          primary: '#000000',
          secondary: '#ffffff',
          accent: '#cccccc',
          background: '#f5f5f5',
          text: '#333333'
        },
        fonts: {
          heading: 'Arial',
          body: 'Helvetica'
        },
        spacing: {
          unit: 8,
          scale: 1.5
        },
        borderRadius: 4,
        shadows: ['0 2px 4px rgba(0,0,0,0.1)'],
        tags: ['test'],
        customizable: true,
        version: '1.0.0',
        usage_count: 0
      };

      mockedApi.get.mockResolvedValue({ data: [mockTheme] });

      const promises = [
        themeService.getAllThemes(),
        themeService.getThemesByTags(['modern']),
        themeService.getTheme('1')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockedApi.get).toHaveBeenCalledTimes(3);
    });
  });
}); 