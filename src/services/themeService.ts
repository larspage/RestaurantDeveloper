import api from './api';

export interface Theme {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: {
    unit: number;
    scale: number;
  };
  borderRadius: number;
  shadows: string[];
  tags: string[];
  customizable: boolean;
  version: string;
  usage_count: number;
  createdAt?: string;
  updatedAt?: string;
}

const themeService = {
  // Get all available themes
  getAllThemes: async () => {
    const response = await api.get('/themes');
    return response.data as Theme[];
  },

  // Get themes filtered by tags
  getThemesByTags: async (tags: string[]) => {
    const tagsParam = tags.join(',');
    const response = await api.get(`/themes?tags=${tagsParam}`);
    return response.data as Theme[];
  },

  // Get a single theme by ID
  getTheme: async (id: string) => {
    const response = await api.get(`/themes/${id}`);
    return response.data as Theme;
  }
};

export default themeService; 