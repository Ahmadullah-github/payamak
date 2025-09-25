const request = require('supertest');
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

// Mock the dependency of the middleware
jest.mock('../utils/jwt', () => ({
  verifyToken: jest.fn(),
}));
const { verifyToken } = require('../utils/jwt');

const app = express();
// A dummy protected route
app.get('/protected', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Success' });
});

describe('Authentication Middleware', () => {
  beforeEach(() => {
    verifyToken.mockClear();
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/protected');
    expect(res.statusCode).toEqual(401);
  });

  it('should return 401 if token is invalid', async () => {
    verifyToken.mockReturnValue(null);
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.statusCode).toEqual(401);
  });

  it('should call next() if token is valid', async () => {
    verifyToken.mockReturnValue({ userId: 1 });
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer valid-token');
    expect(res.statusCode).toEqual(200);
  });
});