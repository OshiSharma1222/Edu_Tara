import { supabase } from '../lib/supabase';
import type { AuthUser, User } from '../lib/supabase';

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
  grade?: number;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export interface UserProfileResponse {
  success: boolean;
  user?: User;
  error?: string;
}

class AuthService {
  // Sign up new user
  async signUp({ email, password, name, grade }: SignUpData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            grade
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Update user profile with additional data
        if (name || grade) {
          const profileResult = await this.createUserProfile(data.user.email!, { name, grade });
          if (!profileResult.success) {
            console.error('Failed to create user profile:', profileResult.error);
            // Don't fail the signup if profile creation fails
          }
        }

        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email!,
            user_metadata: data.user.user_metadata
          }
        };
      }

      return { success: false, error: 'Failed to create user' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Sign in existing user
  async signIn({ email, password }: SignInData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email!,
            user_metadata: data.user.user_metadata
          }
        };
      }

      return { success: false, error: 'Failed to sign in' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Sign out user
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        return {
          id: user.id,
          email: user.email!,
          user_metadata: user.user_metadata
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get user profile from database by email
  async getUserProfile(email: string): Promise<UserProfileResponse> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle(); // Use maybeSingle to avoid error when no rows found

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'User profile not found' };
      }

      return { success: true, user: data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Create user profile (for new users)
  async createUserProfile(email: string, profileData: Partial<Pick<User, 'name' | 'grade'>>): Promise<UserProfileResponse> {
    try {
      // Try to get existing user first
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      // If user exists, return it
      if (existingUser && !fetchError) {
        return { success: true, user: existingUser };
      }

      // If user doesn't exist, create new profile
      const { data, error } = await supabase
        .from('users')
        .insert({
          email,
          ...profileData
        })
        .select()
        .single();

      if (error) {
        console.warn('Error creating user profile:', error);
        return { success: false, error: `Failed to create user profile: ${error.message}` };
      }

      return { success: true, user: data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Update user profile
  async updateUserProfile(email: string, updates: Partial<Pick<User, 'name' | 'grade'>>): Promise<UserProfileResponse> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('email', email)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email!,
          user_metadata: session.user.user_metadata
        });
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();