export interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  hours?: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  theme?: string;
  owner: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
} 