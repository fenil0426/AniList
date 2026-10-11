import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { WatchlistItem, FavCharacter } from '../types/anime';

export const firebaseConfig = {
  apiKey: "AIzaSyBY32Bxu8vyyAOuIjrwwkT45hoOhVScyW0",
  authDomain: "anilist-27488.firebaseapp.com",
  projectId: "anilist-27488",
  storageBucket: "anilist-27488.firebasestorage.app",
  messagingSenderId: "304831134263",
  appId: "1:304831134263:web:ef18675690809dc01e9db2",
  measurementId: "G-CR0C6RNDRS",
};

// Initialize app safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: any) {
    if (
      err.code === 'auth/popup-blocked' ||
      err.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      return null;
    }
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

// Push local watchlist and favs to Firestore
export async function syncUserDataToFirestore(
  uid: string,
  watchlist: Record<number, WatchlistItem>,
  favCharacters: Record<number, FavCharacter>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        watchlist,
        favCharacters,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to sync to Firestore:', error);
    throw error;
  }
}

// Fetch user data from Firestore
export async function fetchUserDataFromFirestore(
  uid: string
): Promise<{
  watchlist?: Record<number, WatchlistItem>;
  favCharacters?: Record<number, FavCharacter>;
} | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      watchlist: data.watchlist || data.list || {},
      favCharacters: data.favCharacters || data.favChars || {},
    };
  } catch (error) {
    console.error('Failed to load user data from Firestore:', error);
    return null;
  }
}

// Real-time listener for user document changes
export function subscribeToUserData(
  uid: string,
  onData: (data: {
    watchlist?: Record<number, WatchlistItem>;
    favCharacters?: Record<number, FavCharacter>;
  }) => void
): Unsubscribe {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.metadata.hasPendingWrites || !snap.exists()) return;
      const d = snap.data();
      onData({
        watchlist: d.watchlist || d.list || {},
        favCharacters: d.favCharacters || d.favChars || {},
      });
    },
    (err) => {
      console.warn('Firestore subscription notice:', err.message);
    }
  );
}
