import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  updateProfile: (params: {
    displayName?: string;
    avatarUrl?: string;
  }) => Promise<{ error: string | null }>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
  updateProfile: async ({ displayName, avatarUrl }) => {
    const data: Record<string, string> = {};
    if (displayName !== undefined) data.display_name = displayName;
    if (avatarUrl !== undefined) data.avatar_url = avatarUrl;

    const { data: updated, error } = await supabase.auth.updateUser({
      data,
    });

    if (error) {
      return { error: error.message };
    }

    if (updated.user) {
      set({ user: updated.user });
    }

    return { error: null };
  },
}));
