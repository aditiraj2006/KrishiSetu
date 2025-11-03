import { useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    loading: true,
    error: null
  });

  const fetchUserProfile = async (firebaseUser: FirebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'X-Firebase-UID': firebaseUser.uid,
          'Authorization': `Bearer ${idToken}`
        }
      });
      let user: User;
      if (response.ok) {
        user = await response.json();
      } else {
        user = await apiRequest('POST', '/api/user/register', {
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
          firebaseUid: firebaseUser.uid,
          profileImage: firebaseUser.photoURL,
          roleSelected: false
        }).then(res => res.json());
      }
      setState({ user, firebaseUser, loading: false, error: null });
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to load user profile' }));
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async fbUser => {
      if (fbUser) {
        localStorage.setItem('firebase-uid', fbUser.uid);
        await fetchUserProfile(fbUser);
      } else {
        localStorage.removeItem('firebase-uid');
        setState({ user: null, firebaseUser: null, loading: false, error: null });
      }
    });
    return unsubscribe;
  }, []);

  const refetchUser = async () => {
    if (state.firebaseUser) {
      setState(prev => ({ ...prev, loading: true }));
      await fetchUserProfile(state.firebaseUser);
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    if (!state.firebaseUser) return null;
    const idToken = await state.firebaseUser.getIdToken();
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'X-Firebase-UID': state.firebaseUser.uid,
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setState(prev => ({ ...prev, user: updatedUser }));
        return updatedUser;
      }
    } catch {
      console.error('Failed to refresh user');
    }
    return null;
  };

  const loginWithGoogle = () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    signInWithPopup(auth, googleProvider)
      .catch(error =>
        setState(prev => ({ ...prev, loading: false, error: error.message || 'Google login failed' }))
      );
  };

  const loginWithEmail = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message || 'Email login failed' }));
      throw error;
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      return userCredential.user;
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message || 'Registration failed' }));
      throw error;
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signOut(auth);
      localStorage.removeItem('firebase-uid');
      setState({ user: null, firebaseUser: null, loading: false, error: null });
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message || 'Logout failed' }));
    }
  };

  return {
    ...state,
    login: loginWithGoogle,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    refetchUser,
    refreshUser
  } as const;
}
