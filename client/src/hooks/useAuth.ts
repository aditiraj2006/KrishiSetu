import type { User } from "@shared/schema";
import {
<<<<<<< HEAD
=======
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
>>>>>>> 537e144 ([fix] Persist role selection across Google OAuth redirect)
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
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
<<<<<<< HEAD
    error: null,
=======
    redirectResultLoading: true,
    error: null
>>>>>>> 537e144 ([fix] Persist role selection across Google OAuth redirect)
  });

  // ── Fetch or register user in the backend ─────────────────────────────────
  const fetchUserProfile = async (firebaseUser: FirebaseUser, role?: UserRole) => {
    // FIX: use Authorization Bearer instead of X-Firebase-UID header
    // X-Firebase-UID was the Issue #30 security bug — anyone could spoof it
    const idToken = await firebaseUser.getIdToken();
    const headers = {
      'Authorization': `Bearer ${idToken}`
    };

    try {
<<<<<<< HEAD
      const response = await fetch("/api/user/profile", {
        headers: {
          "X-Firebase-UID": firebaseUser.uid,
          Authorization: `Bearer ${idToken}`,
        },
      });
=======
      const response = await fetch('/api/user/profile', { headers });
>>>>>>> 537e144 ([fix] Persist role selection across Google OAuth redirect)
      let user: User;

      if (response.ok) {
        user = await response.json();
      } else {
<<<<<<< HEAD
        user = await apiRequest("POST", "/api/user/register", {
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
          firebaseUid: firebaseUser.uid,
          profileImage: firebaseUser.photoURL,
          roleSelected: false,
        }).then((res) => res.json());
=======
        // New user — register with the role if we have one
        user = await apiRequest('POST', '/api/user/register', {
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
          profileImage: firebaseUser.photoURL,
          role: role ?? null,
          roleSelected: !!role
        }).then(res => res.json());
>>>>>>> 537e144 ([fix] Persist role selection across Google OAuth redirect)
      }

      setState({ user, firebaseUser, loading: false, redirectResultLoading: false, error: null });
    } catch {
<<<<<<< HEAD
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load user profile",
      }));
=======
      setState(prev => ({ ...prev, loading: false, redirectResultLoading: false, error: 'Failed to load user profile' }));
>>>>>>> 537e144 ([fix] Persist role selection across Google OAuth redirect)
    }
  };

  // ── 1. Handle returning Google OAuth redirect (runs once on mount) ────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (cancelled) return;

        if (result?.user) {
          const pendingRole = getPendingRole();
          clearPendingRole();
          await fetchUserProfile(result.user, pendingRole ?? undefined);
          return;
        }
      } catch (err: any) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            redirectResultLoading: false,
            error: err.message ?? 'Google sign-in failed after redirect.'
          }));
        }
      } finally {
        if (!cancelled) {
          setState(prev => ({ ...prev, redirectResultLoading: false }));
        }
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Keep auth state in sync ────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
<<<<<<< HEAD
        localStorage.setItem("firebase-uid", fbUser.uid);
        await fetchUserProfile(fbUser);
      } else {
        localStorage.removeItem("firebase-uid");
        setState({
          user: null,
          firebaseUser: null,
          loading: false,
          error: null,
        });
=======
        await fetchUserProfile(fbUser);
      } else {
        // FIX: removed localStorage.setItem('firebase-uid') — Issue #30 security bug
        setState({ user: null, firebaseUser: null, loading: false, redirectResultLoading: false, error: null });
>>>>>>> 537e144 ([fix] Persist role selection across Google OAuth redirect)
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
<<<<<<< HEAD
      const response = await fetch("/api/user/profile", {
        headers: {
          "X-Firebase-UID": state.firebaseUser.uid,
          Authorization: `Bearer ${idToken}`,
        },
=======
      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${idToken}` }
>>>>>>> 537e144 ([fix] Persist role selection across Google OAuth redirect)
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

<<<<<<< HEAD
  const loginWithGoogle = () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    signInWithPopup(auth, googleProvider).catch((error) =>
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Google login failed",
      })),
    );
=======
  // ── Sign-in methods ───────────────────────────────────────────────────────

  const loginWithGoogle = async (role: UserRole) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await fetchUserProfile(result.user, role);
    } catch (popupError: any) {
      if (
        popupError.code === 'auth/popup-blocked' ||
        popupError.code === 'auth/popup-closed-by-user'
      ) {
        // Popup blocked — save role and fall back to redirect
        savePendingRole(role);
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      setState(prev => ({
        ...prev,
        loading: false,
        error: popupError.message || 'Google login failed'
      }));
    }
>>>>>>> 537e144 ([fix] Persist role selection across Google OAuth redirect)
  };

  const loginWithEmail = async (email: string, password: string) => {
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

<<<<<<< HEAD
  const registerWithEmail = async (email: string, password: string, name: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
=======
  const registerWithEmail = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
>>>>>>> 537e144 ([fix] Persist role selection across Google OAuth redirect)
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
      await signOut(auth);
<<<<<<< HEAD
      localStorage.removeItem("firebase-uid");
      setState({ user: null, firebaseUser: null, loading: false, error: null });
=======
      setState({ user: null, firebaseUser: null, loading: false, redirectResultLoading: false, error: null });
>>>>>>> 537e144 ([fix] Persist role selection across Google OAuth redirect)
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