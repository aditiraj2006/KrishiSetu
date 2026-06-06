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
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

// ─── Role persistence key (survives redirects, cleared on tab close) ─────────
const PENDING_ROLE_KEY = "krishisetu_pending_role";

export type UserRole = "farmer" | "distributor" | "retailer" | "consumer";

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

export interface AuthContextValue extends AuthState {
  loading: boolean;
  login: (role: UserRole) => Promise<void>;
  loginWithGoogle: (role: UserRole) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    loading: true,
    redirectResultLoading: true,
    error: null,
  });

  // Keep a stable ref so async callbacks always have the latest firebaseUser
  const firebaseUserRef = useRef<FirebaseUser | null>(null);
  firebaseUserRef.current = state.firebaseUser;

  // ── Fetch or register user in the backend ────────────────────────────────
  const fetchUserProfile = async (
    firebaseUser: FirebaseUser,
    role?: UserRole
  ) => {
    const idToken = await firebaseUser.getIdToken();
    const headers = { Authorization: `Bearer ${idToken}` };

    try {
      const response = await fetch("/api/user/profile", { headers });
      let user: User;

      if (response.ok) {
        user = await response.json();
      } else {
        user = await apiRequest("POST", "/api/user/register", {
          email: firebaseUser.email!,
          name:
            firebaseUser.displayName ||
            firebaseUser.email!.split("@")[0],
          profileImage: firebaseUser.photoURL,
          role: role ?? null,
          roleSelected: !!role,
        }).then((res) => res.json());
      }

      localStorage.setItem("token", idToken);
      setState({
        user,
        firebaseUser,
        loading: false,
        redirectResultLoading: false,
        error: null,
      });
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

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Keep auth state in sync ────────────────────────────────────────────
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
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
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      setState((prev) => ({ ...prev, loading: true }));
      await fetchUserProfile(fbUser);
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    const fbUser = firebaseUserRef.current;
    if (!fbUser) return null;
    const idToken = await fbUser.getIdToken();
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
        error:
          "Firebase is not configured. Set the VITE_FIREBASE_* values in .env before signing in.",
      }));
      return;
    }

    savePendingRole(role);
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signInWithPopup(auth, googleProvider);
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
        error:
          "Firebase is not configured. Set the VITE_FIREBASE_* values in .env before signing in.",
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
    role: UserRole
  ) => {
    if (!isFirebaseConfigured || !auth) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          "Firebase is not configured. Set the VITE_FIREBASE_* values in .env before signing in.",
      }));
      throw new Error("Firebase is not configured");
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
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
      if (auth) await signOut(auth);
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

  const value: AuthContextValue = {
    ...state,
    loading: state.loading || state.redirectResultLoading,
    login: loginWithGoogle,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    refetchUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
