jest.mock('../db', () => ({
  query: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
}));
