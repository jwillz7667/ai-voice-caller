'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  credits: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load token from localStorage on mount
  useEffect(() => {
    // Bypass auth: allow immediate dashboard access with a mock user
    if (process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') {
      const mockUser: User = {
        id: 'bypass-user',
        email: 'demo@example.com',
        name: 'Demo User',
        phone: '+10000000000',
        company: 'Demo Co',
        jobTitle: 'Developer',
        avatarUrl: null,
        credits: 1000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(mockUser);
      setToken('bypass');
      setLoading(false);
      return;
    }
    const storedToken = localStorage.getItem('auth-token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('auth-token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') {
      // Emulate a successful login
      const mockUser: User = {
        id: 'bypass-user',
        email: email || 'demo@example.com',
        name: 'Demo User',
        phone: '+10000000000',
        company: 'Demo Co',
        jobTitle: 'Developer',
        avatarUrl: null,
        credits: 1000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(mockUser);
      setToken('bypass');
      toast.success('Logged in (bypass)');
      router.push('/dashboard');
      return;
    }
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const { user: userData, token: authToken } = await response.json();
      
      // Store token
      localStorage.setItem('auth-token', authToken);
      setToken(authToken);
      setUser(userData);
      
      toast.success('Logged in successfully');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    if (process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') {
      // Emulate a successful registration
      const mockUser: User = {
        id: 'bypass-user',
        email: email || 'demo@example.com',
        name: name || 'Demo User',
        phone: '+10000000000',
        company: 'Demo Co',
        jobTitle: 'Developer',
        avatarUrl: null,
        credits: 1000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(mockUser);
      setToken('bypass');
      toast.success('Account created (bypass)');
      router.push('/dashboard');
      return;
    }
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const { user: userData, token: authToken } = await response.json();
      
      // Store token
      localStorage.setItem('auth-token', authToken);
      setToken(authToken);
      setUser(userData);
      
      toast.success('Account created successfully');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to register');
      throw error;
    }
  };

  const logout = async () => {
    if (process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') {
      // Keep bypass session but navigate to dashboard
      router.push('/dashboard');
      return;
    }
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth-token');
      setToken(null);
      setUser(null);
      router.push('/login');
      toast.success('Logged out successfully');
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
