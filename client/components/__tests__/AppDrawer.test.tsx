import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AppDrawer from '../AppDrawer';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

// Mock zustand store
jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { fullName: 'Test User' },
    logout: jest.fn(),
  }),
}));

describe('<AppDrawer />', () => {
  it('renders the drawer with user information and menu items', () => {
    const onClose = jest.fn();
    render(<AppDrawer onClose={onClose} />);

    // Check for user name
    expect(screen.getByText('Test User')).toBeTruthy();

    // Check for menu items
    expect(screen.getByText('پروفایل')).toBeTruthy();
    expect(screen.getByText('تنظیمات')).toBeTruthy();
    expect(screen.getByText('درباره برنامه')).toBeTruthy();
    expect(screen.getByText('خروج از حساب')).toBeTruthy();
  });
});
