'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  tokenBalance: number;
  role: string;
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  signout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  refreshToken: () => Promise<void>;
  checkBalance: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/auth/signin', '/auth/signup', '/auth/forgot-password'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = !!user && !!accessToken;

  useEffect(() => {
    // Load token from localStorage on mount
    const token = localStorage.getItem('accessToken');
    if (token) {
      setAccessToken(token);
      fetchProfile(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Redirect to signin if not authenticated and on protected route
    if (!isLoading && !isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
      router.push(`/auth/signin?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Profile fetch error:', error);
      localStorage.removeItem('accessToken');
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signin = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signin failed');
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('accessToken', data.accessToken);
  };

  const signup = async (signupData: any) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('accessToken', data.accessToken);
  };

  const signout = async () => {
    try {
      if (accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      router.push('/auth/signin');
    }
  };

  const updateProfile = async (profileData: any) => {
    if (!accessToken) throw new Error('Not authenticated');

    const response = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Profile update failed');
    }

    setUser(data);
  };

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
    } catch (error) {
      console.error('Token refresh error:', error);
      await signout();
    }
  };

  const checkBalance = async (): Promise<number> => {
    if (!accessToken) return 0;

    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      setUser(data);
      return data.tokenBalance || 0;
    } catch (error) {
      console.error('Balance check error:', error);
      return user?.tokenBalance || 0;
    }
  };

  // Set up token refresh interval
  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 14 * 60 * 1000); // Refresh every 14 minutes

    return () => clearInterval(interval);
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated,
        signin,
        signup,
        signout,
        updateProfile,
        refreshToken,
        checkBalance,
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