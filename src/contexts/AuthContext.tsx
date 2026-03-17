import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session, AuthError } from "@supabase/supabase-js";

/**
 * "Remember me" implementation
 *
 * Supabase always persists sessions in localStorage — the storage adapter is
 * fixed at client creation time and cannot be changed per-login.
 *
 * Approach: sessionStorage sentinel.
 *   - remember=true  → standard behaviour; localStorage survives browser restart.
 *   - remember=false → after sign-in we write a "session alive" key to
 *     sessionStorage.  On next page load, if that key is absent (browser was
 *     closed and reopened) we call signOut() before rendering.
 *
 * Known limitation: opening a new tab will lose the sessionStorage key, signing
 * the user out in that tab.  This is the safest realistic trade-off without
 * re-implementing Supabase's token storage layer.
 */
const SESSION_ALIVE_KEY = "vibe-session-alive";
const REMEMBER_ME_KEY = "vibe-remember-me";

export const ONBOARDED_KEY = "vibe-onboarded";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<AuthError | null>;
  signUp: (email: string, password: string) => Promise<AuthError | null>;
  sendMagicLink: (email: string) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  sendMagicLink: async () => null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const init = async () => {
      const remember = localStorage.getItem(REMEMBER_ME_KEY);
      const sessionAlive = sessionStorage.getItem(SESSION_ALIVE_KEY);
      // Skip the policy check when a magic-link hash is present in the URL —
      // the session is being established from the link, not from a stored token.
      const hasMagicLinkHash = window.location.hash.includes("access_token");

      if (!hasMagicLinkHash && remember === "false" && !sessionAlive) {
        // Browser was restarted without "remember me" — clear the session.
        await supabase.auth.signOut();
        localStorage.removeItem(REMEMBER_ME_KEY);
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      // Set up the listener BEFORE calling getSession so we never miss an event.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
        // When a magic link resolves, default to "remember me = true".
        if (_event === "SIGNED_IN" && !localStorage.getItem(REMEMBER_ME_KEY)) {
          localStorage.setItem(REMEMBER_ME_KEY, "true");
          sessionStorage.removeItem(SESSION_ALIVE_KEY);
        }
        setSession(sess);
        setUser(sess?.user ?? null);
        setLoading(false);
      });

      unsubscribe = () => subscription.unsubscribe();

      const { data: { session: current } } = await supabase.auth.getSession();
      setSession(current);
      setUser(current?.user ?? null);
      setLoading(false);
    };

    init();
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe: boolean): Promise<AuthError | null> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "true" : "false");
        if (rememberMe) {
          sessionStorage.removeItem(SESSION_ALIVE_KEY);
        } else {
          sessionStorage.setItem(SESSION_ALIVE_KEY, "1");
        }
      }
      return error;
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthError | null> => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: "http://localhost:8080/auth" },
      });
      return error;
    },
    []
  );

  const sendMagicLink = useCallback(
    async (email: string): Promise<AuthError | null> => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: "http://localhost:8080/auth" },
      });
      return error;
    },
    []
  );

  const signOut = useCallback(async () => {
    localStorage.removeItem(REMEMBER_ME_KEY);
    sessionStorage.removeItem(SESSION_ALIVE_KEY);
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, sendMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
