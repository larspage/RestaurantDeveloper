const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Theme = require('../models/Theme');
const { clearTestDB } = require('./testUtils');

// We don't need to call setupTestDB() here since it's already in jest.setup.js
// setupTestDB();

describe('Theme API Endpoints', () => {
  let testTheme;

  beforeEach(async () => {
    // Clear only themes before each test to avoid conflicts
    await Theme.deleteMany({});
    
    // Create a test theme for each test
    testTheme = await Theme.create({
      name: 'test-theme',
      displayName: 'Test Theme',
      description: 'A test theme',
      colors: {
        primary: '#ff0000',
        secondary: '#00ff00',
        accent: '#0000ff',
        background: '#ffffff',
        text: '#000000'
      },
      fonts: {
        heading: 'Arial, sans-serif',
        body: 'Helvetica, sans-serif'
      },
      spacing: {
        unit: 8,
        scale: 1.5
      },
      borderRadius: 4,
      shadows: ['0 1px 2px rgba(0,0,0,0.1)'],
      tags: ['test', 'sample'],
      customizable: true,
      version: '1.0.0'
    });
  });

  afterEach(async () => {
    // Clean up themes after each test
    await Theme.deleteMany({});
  });

  describe('GET /themes', () => {
    it('should return all themes', async () => {
      const res = await request(app)
        .get('/themes')
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].name).toBe('test-theme');
    });

    it('should filter themes by tags', async () => {
      // Create another theme with different tags
      await Theme.create({
        name: 'another-theme',
        displayName: 'Another Theme',
        description: 'Another test theme',
        colors: {
          primary: '#000000',
          secondary: '#ffffff',
          accent: '#888888',
          background: '#eeeeee',
          text: '#333333'
        },
        fonts: {
          heading: 'Times, serif',
          body: 'Georgia, serif'
        },
        spacing: {
          unit: 10,
          scale: 1.2
        },
        borderRadius: 2,
        shadows: ['0 1px 3px rgba(0,0,0,0.2)'],
        tags: ['another', 'different'],
        customizable: true,
        version: '1.0.0'
      });

      // Filter by the 'test' tag
      const res = await request(app)
        .get('/themes?tags=test')
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('test-theme');
    });
  });

  describe('GET /themes/:id', () => {
    it('should return a single theme', async () => {
      const res = await request(app)
        .get(`/themes/${testTheme._id}`)
        .expect(200);

      expect(res.body.name).toBe('test-theme');
      expect(res.body.displayName).toBe('Test Theme');
      expect(res.body.colors.primary).toBe('#ff0000');
    });

    it('should return 404 for non-existent theme', async () => {
      await request(app)
        .get(`/themes/${new mongoose.Types.ObjectId()}`)
        .expect(404);
    });
  });
}); 