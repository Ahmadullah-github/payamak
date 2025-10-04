// File: client/api/__tests__/userApi.test.ts
import { userApi, UserHelper } from '../userApi';

// Mock the api client
jest.mock('../apiClient', () => {
  return {
    default: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn()
    }
  };
});

describe('userApi', () => {
  it('should have user API methods', () => {
    expect(userApi.getUsers).toBeDefined();
    expect(userApi.getUser).toBeDefined();
    expect(userApi.updateProfile).toBeDefined();
    expect(userApi.changePassword).toBeDefined();
    expect(userApi.getCurrentProfile).toBeDefined();
    expect(userApi.uploadProfilePicture).toBeDefined();
    expect(userApi.deleteProfilePicture).toBeDefined();
    expect(userApi.updateOnlineStatus).toBeDefined();
  });
});

describe('UserHelper', () => {
  it('should format display name correctly', () => {
    const user = {
      id: '1',
      username: 'testuser',
      fullName: 'Test User',
      avatarUrl: '',
      isOnline: true
    };
    
    expect(UserHelper.getDisplayName(user)).toBe('Test User');
  });

  it('should validate username correctly', () => {
    expect(UserHelper.validateUsername('test')).toEqual({ valid: true });
    expect(UserHelper.validateUsername('a')).toEqual({ 
      valid: false, 
      error: 'Username must be at least 3 characters long' 
    });
    expect(UserHelper.validateUsername('')).toEqual({ 
      valid: false, 
      error: 'Username must be at least 3 characters long' 
    });
  });

  it('should validate full name correctly', () => {
    expect(UserHelper.validateFullName('Test User')).toEqual({ valid: true });
    expect(UserHelper.validateFullName('')).toEqual({ 
      valid: false, 
      error: 'Full name is required' 
    });
  });

  it('should validate password correctly', () => {
    expect(UserHelper.validatePassword('password123')).toEqual({ valid: true });
    expect(UserHelper.validatePassword('123')).toEqual({ 
      valid: false, 
      error: 'Password must be at least 6 characters long' 
    });
  });
});