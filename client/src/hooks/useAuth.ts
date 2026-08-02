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
      "firebase-uid": firebaseUser.uid,
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
        .catch(err => console.error(err))