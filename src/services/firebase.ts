import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyBY32Bxu8vyyAOuIjrwwkT45hoOhVScyW0",
  authDomain: "anilist-27488.firebaseapp.com",
  projectId: "anilist-27488",
  storageBucket: "anilist-27488.firebasestorage.app",
  messagingSenderId: "304831134263",
  appId: "1:304831134263:web:ef18675690809dc01e9db2",
  measurementId: "G-CR0C6RNDRS",
};

// Initialize Firebase Authentication only — no Firestore or database
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Register with email and password:
 * - Creates user
 * - Sends verification email
 * - Signs user out immediately (does not sign in automatically)
 * - Returns email address for the verification screen
 */
export async function registerWithEmailPassword(
  email: string,
  pass: string
): Promise<{ email: string }> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = credential.user;

  try {
    // Send verification email
    await sendEmailVerification(user);
  } finally {
    // Immediately sign out to prevent auto-login before verification
    await fbSignOut(auth);
  }

  return { email: user.email || email.trim() };
}

/**
 * Log in with email and password:
 * - Verifies user
 * - If email is NOT verified, blocks access, signs out, and throws 'auth/unverified-email'
 */
export async function loginWithEmailPassword(
  email: string,
  pass: string
): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const user = credential.user;

  // Check email verification status
  if (!user.emailVerified) {
    // Attempt to send/resend verification email
    try {
      await sendEmailVerification(user);
    } catch {
      // Ignored if rate-limited
    }

    // Immediately block access and sign out
    await fbSignOut(auth);

    const error: any = new Error('Email not verified');
    error.code = 'auth/unverified-email';
    error.userEmail = user.email || email.trim();
    throw error;
  }

  return user;
}

/**
 * Resend verification email by temporarily authenticating and signing out
 */
export async function resendVerificationEmail(email: string, pass: string): Promise<void> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  if (!credential.user.emailVerified) {
    await sendEmailVerification(credential.user);
  }
  await fbSignOut(auth);
}

/**
 * Optional Google Sign-In
 */
export async function signInWithGoogle(): Promise<User | null> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

export interface FriendlyAuthError {
  title: string;
  solution: string;
  isUnauthorizedDomain?: boolean;
  domain?: string;
  firebaseConsoleUrl?: string;
}

/**
 * Parse and return user-friendly auth error message
 */
export function getFriendlyAuthErrorMessage(err: any): FriendlyAuthError {
  const code = err?.code || '';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  if (code === 'auth/unverified-email') {
    return {
      title: 'Email Verification Required',
      solution: `We have sent you a verification email to ${err.userEmail || 'your email'}. Please verify it and log in.`,
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      title: 'Email Already Registered',
      solution: 'An account with this email address already exists. Please log in instead.',
    };
  }

  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return {
      title: 'Invalid Email or Password',
      solution: 'The email or password you entered is incorrect. Please check your credentials and try again.',
    };
  }

  if (code === 'auth/user-not-found') {
    return {
      title: 'Account Not Found',
      solution: 'No account was found with this email. Please check the spelling or create a new account.',
    };
  }

  if (code === 'auth/weak-password') {
    return {
      title: 'Password Too Weak',
      solution: 'Password must be at least 6 characters long.',
    };
  }

  if (code === 'auth/invalid-email') {
    return {
      title: 'Invalid Email Address',
      solution: 'Please enter a valid email address (e.g. name@example.com).',
    };
  }

  if (code === 'auth/too-many-requests') {
    return {
      title: 'Too Many Attempts',
      solution: 'Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.',
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      title: 'Email/Password Sign-In Disabled in Firebase',
      solution:
        'In your Firebase Console: go to Authentication → Sign-in method → click "Email/Password" → toggle "Enable" → click Save.',
    };
  }

  if (code === 'auth/unauthorized-domain') {
    return {
      title: `Domain not authorized in Firebase`,
      solution: `Firebase blocks authentication popups from unverified domains for security. Add this domain to your Authorized domains in Firebase:`,
      isUnauthorizedDomain: true,
      domain: currentHost,
      firebaseConsoleUrl: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`,
    };
  }

  return {
    title: 'Authentication Notice',
    solution: err?.message || 'An error occurred during authentication. Please try again.',
  };
}
