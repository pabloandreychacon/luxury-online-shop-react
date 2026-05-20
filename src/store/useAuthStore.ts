import { create } from 'zustand';
import type { User, AuthState } from '../lib/types';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const mapProfile = (profileData: any): User => ({
  id: profileData.Id,
  email: profileData.Email,
  firstName: profileData.FullName || '',
  lastName: '',
  createdAt: profileData.CreatedAt,
});

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,

  checkAuth: async () => {
    try {
      const storedUserId = localStorage.getItem('userId');
      if (!storedUserId) return set({ loading: false });

      const { data, error } = await supabase.from('Profiles').select('*').eq('Id', storedUserId);
      if (error || !data?.length) {
        localStorage.removeItem('userId');
        return set({ loading: false });
      }
      set({ user: mapProfile(data[0]), loading: false });
    } catch {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      if (!email || !password) throw new Error('Email and password are required');

      const normalizedEmail = email.toLowerCase().trim();
      const { data, error } = await supabase.from('Profiles').select('*').eq('Email', normalizedEmail);

      if (error) throw new Error('Failed to load profile. Please try again.');
      if (!data?.length) throw new Error('Invalid email or password. Please try again.');

      const profileData = data[0];
      const passwordMatch = await bcrypt.compare(password, profileData.PasswordHash);
      if (!passwordMatch) throw new Error('Invalid email or password. Please try again.');

      localStorage.setItem('userId', profileData.Id);
      set({ user: mapProfile(profileData), loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  signup: async (email, password, firstName, lastName) => {
    set({ loading: true, error: null });
    try {
      if (!email || !password || !firstName || !lastName) throw new Error('All fields are required');
      if (password.length < 6) throw new Error('Password must be at least 6 characters long');

      const normalizedEmail = email.toLowerCase().trim();
      const { data: existing } = await supabase.from('Profiles').select('Email').eq('Email', normalizedEmail);
      if (existing?.length) throw new Error('This email is already registered.');

      const passwordHash = await bcrypt.hash(password, 10);
      const { data, error } = await supabase
        .from('Profiles')
        .insert([{ Email: normalizedEmail, FullName: `${firstName} ${lastName}`.trim(), PasswordHash: passwordHash }])
        .select();

      if (error || !data?.length) throw new Error('Failed to create account. Please try again.');

      localStorage.setItem('userId', data[0].Id);
      set({ user: mapProfile(data[0]), loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  logout: async () => {
    localStorage.removeItem('userId');
    set({ user: null, loading: false, error: null });
  },
}));
