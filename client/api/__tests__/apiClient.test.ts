// File: client/api/__tests__/apiClient.test.ts
import apiClient, { handleApiError } from '../apiClient';

// Mock axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn()
    }))
  };
});

describe('apiClient', () => {
  it('should create an axios instance', () => {
    expect(apiClient).toBeDefined();
  });

  describe('handleApiError', () => {
    it('should handle response errors', () => {
      const error = {
        response: {
          data: {
            error: 'Test error'
          }
        }
      };
      
      const result = handleApiError(error);
      expect(result).toEqual({ success: false, error: 'Test error' });
    });

    it('should handle network errors', () => {
      const error = {
        request: {}
      };
      
      const result = handleApiError(error);
      expect(result).toEqual({ 
        success: false, 
        error: 'Network error - please check your connection' 
      });
    });

    it('should handle unknown errors', () => {
      const error = {
        message: 'Unknown error'
      };
      
      const result = handleApiError(error);
      expect(result).toEqual({ success: false, error: 'Unknown error' });
    });
  });
});