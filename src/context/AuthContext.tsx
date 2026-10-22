'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { getDemoUserAction, signInDemoAction, signOutAction } from '@/lib/auth/actions';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: 'customer' | 'admin';
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInDemo: (role?: 'customer' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setProfile(data as UserProfile);
      }
    } catch {
      // Profile table fetch fallback
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!configured) {
      try {
        const demoUser = await getDemoUserAction();
        if (demoUser) {
          setUser({
            id: demoUser.id,
            email: demoUser.email,
            user_metadata: {
              full_name: demoUser.full_name,
              role: demoUser.role,
              phone: demoUser.phone,
            },
            app_metadata: { role: demoUser.role },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as unknown as User);

          setProfile({
            id: demoUser.id,
            full_name: demoUser.full_name,
            role: demoUser.role,
            phone: demoUser.phone || null,
            avatar_url: null,
          });
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch {
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [configured, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (!configured) {
        try {
          const demoUser = await getDemoUserAction();
          if (!isMounted) return;
          if (demoUser) {
            setUser({
              id: demoUser.id,
              email: demoUser.email,
              user_metadata: {
                full_name: demoUser.full_name,
                role: demoUser.role,
                phone: demoUser.phone,
              },
              app_metadata: { role: demoUser.role },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
            } as unknown as User);

            setProfile({
              id: demoUser.id,
              full_name: demoUser.full_name,
              role: demoUser.role,
              phone: demoUser.phone || null,
              avatar_url: null,
            });
          } else {
            setUser(null);
            setProfile(null);
          }
        } catch {
          if (isMounted) {
            setUser(null);
            setProfile(null);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
        return;
      }

      try {
        const supabase = createClient();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!isMounted) return;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    if (!configured) {
      return () => {
        isMounted = false;
      };
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      if (!isMounted) return;
      setUser(sessionUser);

      if (sessionUser) {
        await fetchProfile(sessionUser.id);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured, fetchProfile]);

  const signInDemo = async (role: 'customer' | 'admin' = 'customer') => {
    setIsLoading(true);
    await signInDemoAction(role);
    await refreshUser();
    setIsLoading(false);
    router.push(role === 'admin' ? '/admin/dashboard' : '/account');
    router.refresh();
  };

  const signOut = async () => {
    setIsLoading(true);
    await signOutAction();
    setUser(null);
    setProfile(null);
    setIsLoading(false);
    router.push('/auth/login?logout=success');
    router.refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isConfigured: configured,
        isDemoMode: !configured,
        signOut,
        refreshUser,
        signInDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
