'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });
  const router = useRouter();

  useEffect(() => {
    // Check for existing auth on mount
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('Loading auth state - token exists:', !!token); // Debug log
    console.log('Loading auth state - user exists:', !!userStr); // Debug log
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('Loaded user from localStorage:', user.email); // Debug log
        setAuthState({
          user,
          token,
          loading: false,
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState({ user: null, token: null, loading: false });
      }
    } else {
      setAuthState({ user: null, token: null, loading: false });
    }
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({ user, token, loading: false });
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({ user: null, token: null, loading: false });
    router.push('/login');
  };

  const getAuthHeaders = (): HeadersInit => {
    console.log('getAuthHeaders called - token exists:', !!authState.token); // Debug log
    if (!authState.token) {
      console.log('No token available for headers');
      return {};
    }
    console.log('Adding Authorization header with token:', authState.token.substring(0, 20) + '...'); // Debug log
    return {
      'Authorization': `Bearer ${authState.token}`,
    };
  };

  return {
    ...authState,
    login,
    logout,
    getAuthHeaders,
    isAuthenticated: !!authState.user && !!authState.token,
  };
}