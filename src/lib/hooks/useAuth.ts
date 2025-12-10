'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export function useAuth(requireAuth: boolean = false) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    
    // Listen for custom auth events
    const handleAuthChange = () => {
      checkAuth();
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    // Redirect if auth is required but user is not authenticated
    if (requireAuth && !loading && !isAuthenticated && pathname) {
      const protectedPaths = [
        '/dashboard', 
        '/appointments', 
        '/profile', 
        '/chat',
        '/waitlist',
        '/prescriptions',
        '/insurance',
        '/notifications',
        '/payments',
        '/treatment-plans',
        '/recurring-appointments',
        '/urgent-appointments',
        '/family-members',
        '/forms',
        '/referrals',
        '/documents',
        '/recommendations',
        '/images',
        '/loyalty',
      ];
      if (protectedPaths.some(path => pathname.startsWith(path))) {
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, loading, requireAuth, pathname, router]);

  const checkAuth = async () => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      // Verify token is still valid by calling API
      const response = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const userData = response.data.data.user;
        setUser({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
        });
        setIsAuthenticated(true);
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('auth-change'));
  };

  const logout = async () => {
    try {
      // Clear conversation history on logout
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.delete('/api/chat/conversations/clear', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          // Log error but continue with logout even if clearing history fails
          console.error('Error clearing conversation history:', error);
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      window.dispatchEvent(new Event('auth-change'));
      router.push('/auth/login');
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth,
  };
}

