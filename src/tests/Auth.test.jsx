import { render, screen, act } from '@testing-library/react';
import { AuthProvider } from '../context/AuthProvider';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../supabase';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { name: 'Test User', role: 'member' }, error: null }),
  },
}));

const TestComponent = () => {
  const context = React.useContext(AuthContext);
  const { user, isAuthenticated, signup } = context;

  const handleSignup = async () => {
    try {
      await signup('test@example.com', 'password123', 'Test User');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      {user && <div data-testid="user-role">{user.role}</div>}
      <button data-testid="signup-btn" onClick={handleSignup}>Signup</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides authentication state', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: mockUser } }, error: null });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-role')).toHaveTextContent('member');
  });

  it('handles signup with immediate session', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { user: mockUser };
    supabase.auth.signUp.mockResolvedValueOnce({ data: { user: mockUser, session: mockSession }, error: null });
    supabase.from().insert.mockResolvedValueOnce({ error: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const signupBtn = screen.getByTestId('signup-btn');
    await act(async () => {
      signupBtn.click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
  });

  it('handles signup requiring email confirmation (no session)', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    supabase.auth.signUp.mockResolvedValueOnce({ data: { user: mockUser, session: null }, error: null });
    supabase.from().insert.mockResolvedValueOnce({ error: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const signupBtn = screen.getByTestId('signup-btn');
    await act(async () => {
      signupBtn.click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });
});
