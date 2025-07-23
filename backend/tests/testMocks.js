// Mock JWT module with simple token handling
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => {
    return `mock.jwt.token.${payload.sub}`;
  }),
  verify: jest.fn((token, secret) => {
    if (token.startsWith('mock.jwt.token.')) {
      const userId = token.replace('mock.jwt.token.', '');
      return { sub: userId, email: 'test@example.com', role: 'customer' };
    }
    throw new Error('Invalid token');
  })
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  const mockClient = {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn()
    }
  };

  return {
    createClient: jest.fn(() => mockClient),
    mockClient // Export for test access
  };
});

// Mock Supabase module
jest.mock('../db/supabase', () => {
  return {
    supabase: {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn()
      }
    },
    supabaseAdmin: {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn()
      }
    },
    verifyToken: jest.fn((token) => {
      if (token && token.startsWith('mock.jwt.token.')) {
        const supabaseId = token.replace('mock.jwt.token.', '');
        return Promise.resolve({ 
          id: supabaseId,  // This should match the supabase_id in the database
          email: 'test@example.com',
          user_metadata: {
            name: 'Test User'
          }
        });
      }
      return Promise.reject(new Error('Invalid token'));
    }),
    getUserProfile: jest.fn(),
    createUser: jest.fn(),
    signInWithPassword: jest.fn((email, password) => {
      // Return a mock user and properly formatted JWT token
      if (email === 'test@example.com') {
        const userId = 'test-user-123';
        return Promise.resolve({
          user: {
            id: userId,
            email: email
          },
          token: `mock.jwt.token.${userId}`
        });
      }
      if (email === 'nonexistent@example.com') {
        const userId = 'non-existent-user-123';
        return Promise.resolve({
          user: {
            id: userId,
            email: email
          },
          token: `mock.jwt.token.${userId}`
        });
      }
      return Promise.reject(new Error('Invalid credentials'));
    })
  };
}); 