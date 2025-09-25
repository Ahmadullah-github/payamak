const request = require('supertest');
const express = require('express');
const usersRoutes = require('../routes/users');

jest.mock('../middleware/authMiddleware', () => jest.fn((req, res, next) => {
  req.user = { userId: 1 };
  next();
}));

const mockPool = {
    query: jest.fn(),
};

const app = express();
app.use(express.json());
app.use('/api/users', usersRoutes(mockPool));

describe('User Route Handlers', () => {
  beforeEach(() => {
    mockPool.query.mockClear();
  });

  it('should work', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toEqual(200);
  });
});