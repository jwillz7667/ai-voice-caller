'use client';

import { create } from 'zustand';
import { UserProfile } from './supabase';

interface UserStore {
  credits: number;
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  setCredits: (credits: number) => void;
  addCredits: (amount: number) => void;
  subtractCredits: (amount: number) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  credits: 0,
  profile: null,
  setProfile: (profile) => set({ 
    profile, 
    credits: profile?.credits || 0 
  }),
  setCredits: (credits) => set({ credits }),
  addCredits: (amount) => set((state) => ({ credits: state.credits + amount })),
  subtractCredits: (amount) => set((state) => ({ credits: Math.max(0, state.credits - amount) })),
})); 