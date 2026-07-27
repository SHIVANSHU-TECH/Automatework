import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            'AIzaSyDYJdbz01UYSz3MNKG9G04UtQDkgWMWCYk',
  authDomain:        'trainerform-52f85.firebaseapp.com',
  databaseURL:       'https://trainerform-52f85-default-rtdb.firebaseio.com',
  projectId:         'trainerform-52f85',
  storageBucket:     'trainerform-52f85.firebasestorage.app',
  messagingSenderId: '226297252007',
  appId:             '1:226297252007:web:85ec7514b492547c373382',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ─── Auth actions ─────────────────────────────────────────────────────────────

export const registerWithEmail = async (email: string, password: string): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Send verification email immediately
  await sendEmailVerification(cred.user, {
    url: `${window.location.origin}/login?verified=1`,
  });
  return cred.user;
};

export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  if (!cred.user.emailVerified) {
    await firebaseSignOut(auth);
    throw new Error('Please verify your email before signing in. Check your inbox for a verification link.');
  }
  return cred.user;
};

export const loginWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const resendVerification = async (email: string, password: string): Promise<void> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user, {
    url: `${window.location.origin}/login?verified=1`,
  });
  await firebaseSignOut(auth);
};

export const signOut = () => firebaseSignOut(auth);

export const getFirebaseIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

export { onAuthStateChanged };
export type { User };
