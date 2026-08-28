"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const DISPLAY_NAME_KEY = "connectmeet_display_name";

export const DEMO_CREDENTIALS = {
  email: "demo@connectmeet.io",
  password: "ConnectMeet@2026",
  fullName: "Demo User",
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, redirectTo?: string) => Promise<void>;
  signInDemo: (redirectTo?: string) => Promise<void>;
  signUp: (params: { fullName: string; email: string; password: string }) => Promise<{ success: boolean; needsConfirmation: boolean }>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractDisplayName(user: User | null) {
  return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Guest";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const syncDisplayName = useCallback((nextUser: User | null) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DISPLAY_NAME_KEY, extractDisplayName(nextUser));
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    if (typeof document !== "undefined" && document.cookie.includes("connectmeet_demo_session=true")) {
      const demoUser = {
        id: "demo-user-connectmeet",
        email: DEMO_CREDENTIALS.email,
        user_metadata: { full_name: DEMO_CREDENTIALS.fullName },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User;
      setUser(demoUser);
      setSession({
        access_token: "demo-token",
        refresh_token: "demo-refresh-token",
        expires_in: 3600,
        token_type: "bearer",
        user: demoUser,
      } as Session);
      syncDisplayName(demoUser);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user ?? null);
        syncDisplayName(data.session.user ?? null);
      }
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) {
        setSession(nextSession);
        setUser(nextSession.user ?? null);
        syncDisplayName(nextSession.user ?? null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [syncDisplayName, supabase]);

  const signInDemo = useCallback(
    async (redirectTo = "/dashboard") => {
      // Set demo session cookie so middleware grants access immediately
      if (typeof document !== "undefined") {
        document.cookie = "connectmeet_demo_session=true; path=/; max-age=604800; SameSite=Lax";
      }

      const demoUser = {
        id: "demo-user-connectmeet",
        email: DEMO_CREDENTIALS.email,
        user_metadata: { full_name: DEMO_CREDENTIALS.fullName },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User;

      setUser(demoUser);
      setSession({
        access_token: "demo-token",
        refresh_token: "demo-refresh-token",
        expires_in: 3600,
        token_type: "bearer",
        user: demoUser,
      } as Session);
      window.localStorage.setItem(DISPLAY_NAME_KEY, DEMO_CREDENTIALS.fullName);

      // Attempt Supabase sign in in background
      if (supabase) {
        void supabase.auth.signInWithPassword({
          email: DEMO_CREDENTIALS.email,
          password: DEMO_CREDENTIALS.password,
        });
      }

      toast.success("Welcome! Logged in with Demo Account.");
      router.push(redirectTo);
      router.refresh();
    },
    [router, supabase]
  );

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async (email, password, redirectTo = "/dashboard") => {
      const cleanEmail = email.trim();

      // If logging in with demo credentials, use guaranteed demo handler
      if (
        cleanEmail.toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase() &&
        password === DEMO_CREDENTIALS.password
      ) {
        await signInDemo(redirectTo);
        return;
      }

      if (!supabase) {
        toast.warning("Supabase is not configured yet. Add the environment variables to enable login.");
        return;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data.session) {
          setUser(data.session.user ?? null);
          setSession(data.session);
          syncDisplayName(data.session.user ?? null);
        }

        toast.success("Welcome back!");
        router.push(redirectTo);
        router.refresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to sign in";
        toast.error(message);
      }
    },
    [router, supabase, signInDemo, syncDisplayName]
  );

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async ({ fullName, email, password }) => {
      if (!supabase) {
        toast.warning("Supabase is not configured yet. Add the environment variables to enable sign up.");
        return { success: false, needsConfirmation: false };
      }

      try {
        const cleanEmail = email.trim();
        const cleanFullName = fullName.trim();
        const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: cleanFullName },
            emailRedirectTo: redirectTo,
          },
        });

        if (error) {
          toast.error(error.message);
          return { success: false, needsConfirmation: false };
        }

        // Supabase returns empty identities array if user already exists
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          toast.error("An account with this email already exists. Please log in.");
          router.push("/login");
          return { success: false, needsConfirmation: false };
        }

        if (data.session) {
          setUser(data.session.user ?? null);
          setSession(data.session);
          syncDisplayName(data.session.user ?? null);
          toast.success("Account created! Redirecting to your dashboard...");
          router.push("/dashboard");
          router.refresh();
          return { success: true, needsConfirmation: false };
        }

        if (data.user) {
          toast.info("We have sent an email. Please confirm it.");
          return { success: true, needsConfirmation: true };
        }

        return { success: true, needsConfirmation: false };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to sign up";
        toast.error(message);
        return { success: false, needsConfirmation: false };
      }
    },
    [router, supabase, syncDisplayName]
  );

  const resendConfirmationEmail = useCallback(
    async (email: string) => {
      if (!supabase) return;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Confirmation email resent successfully.");
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (typeof document !== "undefined") {
      document.cookie = "connectmeet_demo_session=; path=/; max-age=0; SameSite=Lax";
    }
    window.localStorage.removeItem(DISPLAY_NAME_KEY);
    setUser(null);
    setSession(null);

    if (supabase) {
      await supabase.auth.signOut();
    }

    router.push("/");
    router.refresh();
  }, [router, supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: Boolean(user && session),
      signIn,
      signInDemo,
      signUp,
      resendConfirmationEmail,
      signOut,
    }),
    [loading, session, signIn, signInDemo, signOut, signUp, resendConfirmationEmail, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
