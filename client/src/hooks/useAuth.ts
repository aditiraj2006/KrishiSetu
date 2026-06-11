import type { User } from "@shared/schema";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

// ─── Role persistence key (survives redirects, cleared on tab close) ─────────
const PENDING_ROLE_KEY = 'krishisetu_pending_role';

export type UserRole = 'farmer' | 'distributor' | 'retailer' | 'consumer';

function savePendingRole(role: UserRole) {
  sessionStorage.setItem(PENDING_ROLE_KEY, role);
}
function getPendingRole(): UserRole | null {
  return sessionStorage.getItem(PENDING_ROLE_KEY) as UserRole | null;
}
function clearPendingRole() {
  sessionStorage.removeItem(PENDING_ROLE_KEY);
}

export interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  redirectResultLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    loading: true,
    redirectResultLoading: true,
    error: null,
  });

  // ── Fetch or register user in the backend ─────────────────────────────────
  const fetchUserProfile = async (firebaseUser: FirebaseUser, role?: UserRole) => {
    const idToken = await firebaseUser.getIdToken();
    const headers = {
      Authorization: `Bearer ${idToken}`,
    };

    try {
      const response = await fetch("/api/user/profile", { headers });
      let user: User;

      if (response.ok) {
        user = await response.json();
      } else {
        user = await apiRequest("POST", "/api/user/register", {
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
          profileImage: firebaseUser.photoURL,
          role: role ?? null,
          roleSelected: !!role,
        }).then((res) => res.json());
      }

      localStorage.setItem("token", idToken);
      setState({ user, firebaseUser, loading: false, redirectResultLoading: false, error: null });
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        redirectResultLoading: false,
        error: "Failed to load user profile",
      }));
    }
  };

  // ── 1. Handle returning Google OAuth redirect (runs once on mount) ────────
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setState({
        user: null,
        firebaseUser: null,
        loading: false,
        redirectResultLoading: false,
        error: null,
      });
      return;
    }

    const firebaseAuth = auth;
    let cancelled = false;

    (async () => {
      try {
        const result = await getRedirectResult(firebaseAuth);
        if (cancelled) return;

        if (result?.user) {
          const pendingRole = getPendingRole();
          clearPendingRole();
          await fetchUserProfile(result.user, pendingRole ?? undefined);
          return;
        }
      } catch (err: any) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            redirectResultLoading: false,
            error: err.message ?? "Google sign-in failed after redirect.",
          }));
        }
      } finally {
        if (!cancelled) {
          setState((prev) => ({ ...prev, redirectResultLoading: false }));
        }
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Keep auth state in sync ────────────────────────────────────────────
  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        await fetchUserProfile(fbUser);
      } else {
        localStorage.removeItem("token");
        setState({
          user: null,
          firebaseUser: null,
          loading: false,
          redirectResultLoading: false,
          error: null,
        });
      }
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refetchUser = async () => {
    if (state.firebaseUser) {
      setState((prev) => ({ ...prev, loading: true }));
      await fetchUserProfile(state.firebaseUser);
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    if (!state.firebaseUser) return null;
    const idToken = await state.firebaseUser.getIdToken();
    try {
      const response = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setState((prev) => ({ ...prev, user: updatedUser }));
        return updatedUser;
      }
    } catch {
      console.error("Failed to refresh user");
    }
    return null;
  };

  // ── Sign-in methods ───────────────────────────────────────────────────────

  const loginWithGoogle = async (role: UserRole) => {
    if (!isFirebaseConfigured || !auth) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Firebase is not configured. Set the VITE_FIREBASE_* values in .env before signing in.",
      }));
      return;
    }

    // Save the pending role immediately so it survives redirects
    savePendingRole(role);

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Popup succeeded, so we can clear the pending role selection
      clearPendingRole();
      await fetchUserProfile(result.user, role);
    } catch (popupError: any) {
      if (
        popupError.code === "auth/popup-blocked" ||
        popupError.code === "auth/popup-closed-by-user"
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      // Clear pending role on other popup failures
      clearPendingRole();
      setState((prev) => ({
        ...prev,
        loading: false,
        error: popupError.message || "Google login failed",
      }));
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Firebase is not configured. Set the VITE_FIREBASE_* values in .env before signing in.",
      }));
      throw new Error("Firebase is not configured");
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Email login failed",
      }));
      throw error;
    }
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
  ) => {
    if (!isFirebaseConfigured || !auth) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Firebase is not configured. Set the VITE_FIREBASE_* values in .env before signing in.",
      }));
      throw new Error("Firebase is not configured");
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await fetchUserProfile(userCredential.user, role);
      return userCredential.user;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Registration failed",
      }));
      throw error;
    }
  };

  const logout = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      clearPendingRole();
      if (auth) {
        await signOut(auth);
      }
      localStorage.removeItem("token");
      setState({
        user: null,
        firebaseUser: null,
        loading: false,
        redirectResultLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Logout failed",
      }));
    }
  };

  return {
    ...state,
    loading: state.loading || state.redirectResultLoading,
    login: loginWithGoogle,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    refetchUser,
    refreshUser,
  } as const;
}