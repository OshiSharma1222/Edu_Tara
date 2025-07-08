import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import type { AuthUser, SignUpData, SignInData } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting initial user:', error);
      } finally {
        setLoading(false);
      }
    };

    // Listen to auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (signUpData: SignUpData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.signUp(signUpData);
    
      if (!result.success) {
        setError(result.error || 'Sign up failed');
      } else {
        // Clear any previous errors on successful signup
        setError(null);
      }

      setLoading(false);
      return result;
    } catch (error) {
      setError('An unexpected error occurred during sign up');
      setLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  const signIn = useCallback(async (signInData: SignInData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.signIn(signInData);
    
      if (!result.success) {
        setError(result.error || 'Sign in failed');
      } else {
        // Clear any previous errors on successful signin
        setError(null);
      }

      setLoading(false);
      return result;
    } catch (error) {
      setError('An unexpected error occurred during sign in');
      setLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await authService.signOut();
    
    if (!result.success) {
      setError(result.error || 'Sign out failed');
    } else {
      setUser(null);
    }

    setLoading(false);
    return result;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    clearError,
    isAuthenticated: !!user
  };
};