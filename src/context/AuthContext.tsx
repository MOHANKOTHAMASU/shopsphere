'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  signOut: (redirectUrl?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  signInDemo: (role?: 'customer' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cross-tab broadcast channel name
const AUTH_BROADCAST_CHANNEL = 'shopsphere_cross_tab_auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Request counter to avoid race conditions when switching accounts
  const profileRequestIdRef = useRef<number>(0);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Helper to safely broadcast auth state changes across all browser tabs
  const broadcastAuthEvent = useCallback((event: 'SIGNED_IN' | 'SIGNED_OUT' | 'ACCOUNT_SWITCHED', userId?: string) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        if (!broadcastChannelRef.current) {
          broadcastChannelRef.current = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
        }
        broadcastChannelRef.current.postMessage({
          type: 'SHOPSPHERE_AUTH_EVENT',
          event,
          userId,
          timestamp: Date.now(),
        });
      }
      // Also emit localStorage storage event for older browser compatibility
      if (typeof window !== 'undefined') {
        localStorage.setItem('shopsphere_auth_sync_ping', JSON.stringify({ event, userId, t: Date.now() }));
      }
    } catch {
      // Broadcast error non-fatal
    }
  }, []);

  /**
   * Secure, race-condition protected profile fetching
   * Guaranteed to never set profile if authenticated user ID does not match
   */
  const fetchProfile = useCallback(async (userId: string) => {
    const currentReqId = ++profileRequestIdRef.current;

    // Immediately clear stale profile if fetching for a different user
    setProfile((prev) => (prev && prev.id === userId ? prev : null));

    try {
      if (configured) {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        // Discard out-of-order response if another auth request was initiated in between
        if (currentReqId !== profileRequestIdRef.current) return;

        if (!error && data) {
          setProfile(data as UserProfile);
          return;
        }
      }

      // Check signed session cookie fallback
      const demoUser = await getDemoUserAction();
      if (currentReqId !== profileRequestIdRef.current) return;

      if (demoUser && demoUser.id === userId) {
        setProfile({
          id: demoUser.id,
          full_name: demoUser.full_name,
          role: demoUser.role,
          phone: demoUser.phone || null,
          avatar_url: null,
        });
      } else {
        setProfile(null);
      }
    } catch {
      if (currentReqId === profileRequestIdRef.current) {
        setProfile(null);
      }
    }
  }, [configured]);

  /**
   * Refreshes user session from Supabase or signed session cookie
   */
  const refreshUser = useCallback(async () => {
    // 1. Try Supabase Auth first if configured
    if (configured) {
      try {
        const supabase = createClient();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);
          await fetchProfile(currentUser.id);
          setIsLoading(false);
          broadcastAuthEvent('SIGNED_IN', currentUser.id);
          return;
        }
      } catch {
        // Fall through to signed cookie session
      }
    }

    // 2. Resilient Fallback to cryptographic signed session cookie
    try {
      const demoUser = await getDemoUserAction();
      if (demoUser && demoUser.id) {
        const fallbackUser = {
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
        } as unknown as User;

        setUser(fallbackUser);
        setProfile({
          id: demoUser.id,
          full_name: demoUser.full_name,
          role: demoUser.role,
          phone: demoUser.phone || null,
          avatar_url: null,
        });
        broadcastAuthEvent('SIGNED_IN', demoUser.id);
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
  }, [configured, fetchProfile, broadcastAuthEvent]);

  // Initial authentication initialization and cross-tab event listeners
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // 1. Try Supabase first if configured
      if (configured) {
        try {
          const supabase = createClient();
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();

          if (!isMounted) return;
          if (currentUser) {
            setUser(currentUser);
            await fetchProfile(currentUser.id);
            setIsLoading(false);
            return;
          }
        } catch {
          // Supabase unreachable; fall through to signed session cookie
        }
      }

      // 2. Check signed session cookie
      try {
        const demoUser = await getDemoUserAction();
        if (!isMounted) return;
        if (demoUser && demoUser.id) {
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
    };

    initAuth();

    // Setup Cross-Tab Synchronization Listener (BroadcastChannel)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
      broadcastChannelRef.current = channel;

      channel.onmessage = (msgEvent) => {
        if (!isMounted) return;
        const payload = msgEvent.data;
        if (payload?.type === 'SHOPSPHERE_AUTH_EVENT') {
          if (payload.event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            router.refresh();
          } else if (payload.event === 'SIGNED_IN' || payload.event === 'ACCOUNT_SWITCHED') {
            // Immediately clear stale profile and re-sync
            setProfile(null);
            initAuth();
            router.refresh();
          }
        }
      };
    }

    // Setup Storage Event Listener for Cross-Tab Sync fallback
    const handleStorageEvent = (event: StorageEvent) => {
      if (!isMounted) return;
      if (event.key === 'shopsphere_auth_sync_ping' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data.event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            router.refresh();
          } else if (data.event === 'SIGNED_IN') {
            setProfile(null);
            initAuth();
            router.refresh();
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    if (!configured) {
      return () => {
        isMounted = false;
        window.removeEventListener('storage', handleStorageEvent);
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.close();
          broadcastChannelRef.current = null;
        }
      };
    }

    // Supabase auth state change subscription
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sessionUser = session?.user ?? null;
      if (!isMounted) return;

      // Handle specific events
      if (event === 'SIGNED_OUT' || !sessionUser) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        broadcastAuthEvent('SIGNED_OUT');
        return;
      }

      // User changed or logged in
      setUser(sessionUser);
      setProfile(null); // Clear previous profile immediately to avoid stale display
      await fetchProfile(sessionUser.id);
      setIsLoading(false);
      broadcastAuthEvent('SIGNED_IN', sessionUser.id);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageEvent);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    };
  }, [configured, fetchProfile, router, broadcastAuthEvent]);

  const signInDemo = async (role: 'customer' | 'admin' = 'customer') => {
    setIsLoading(true);
    await signInDemoAction(role);
    await refreshUser();
    setIsLoading(false);
    broadcastAuthEvent('SIGNED_IN');
    router.push(role === 'admin' ? '/admin/dashboard' : '/account');
    router.refresh();
  };

  const signOut = async (redirectUrl: string = '/auth/login?logout=success') => {
    setIsLoading(true);
    try {
      localStorage.removeItem('shopsphere_cart_guest');
      localStorage.removeItem('shopsphere_wishlist_guest');
      if (user?.id) {
        localStorage.removeItem(`shopsphere_cart_${user.id}`);
        localStorage.removeItem(`shopsphere_wishlist_${user.id}`);
      }
    } catch {
      // Non-fatal
    }
    broadcastAuthEvent('SIGNED_OUT');
    await signOutAction();
    setUser(null);
    setProfile(null);
    setIsLoading(false);
    router.push(redirectUrl);
    router.refresh();
  };

  // Strictly ensure profile matches active user
  const sanitizedProfile = profile && user && profile.id === user.id ? profile : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: sanitizedProfile,
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
