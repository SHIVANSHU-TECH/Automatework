import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  type Firestore,
} from 'firebase/firestore';

// ─── Firebase config ──────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: 'AIzaSyDYJdbz01UYSz3MNKG9G04UtQDkgWMWCYk',
  authDomain: 'trainerform-52f85.firebaseapp.com',
  databaseURL: 'https://trainerform-52f85-default-rtdb.firebaseio.com',
  projectId: 'trainerform-52f85',
  storageBucket: 'trainerform-52f85.firebasestorage.app',
  messagingSenderId: '226297252007',
  appId: '1:226297252007:web:85ec7514b492547c373382',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db: Firestore = getFirestore(app);

// ─── Timeout wrapper ──────────────────────────────────────────────────────────

const withTimeout = <T>(promise: Promise<T>, ms = 10000): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Firestore request timed out after ${ms}ms. Check your Firebase project at console.firebase.google.com`)),
        ms
      )
    ),
  ]);

// ─── Generic helpers ──────────────────────────────────────────────────────────

/** Write (upsert) a document at collection/id.
 * path format: "collectionName/documentId"
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dbSet = async (path: string, value: unknown): Promise<void> => {
  const [col, ...rest] = path.split('/');
  const id = rest.join('/');
  // Cast to any — Firestore accepts any plain object; TypeScript's DocumentData
  // requires an index signature which our typed interfaces don't have.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await withTimeout(setDoc(doc(db, col, id), value as any));
};

/**
 * Read a single document. Returns null when not found.
 * path format: "collectionName/documentId"
 */
export const dbGet = async <T>(path: string): Promise<T | null> => {
  const [col, ...rest] = path.split('/');
  const id = rest.join('/');
  const snap = await withTimeout(getDoc(doc(db, col, id)));
  return snap.exists() ? (snap.data() as T) : null;
};

/**
 * Read all documents in a collection as an array.
 * path format: "collectionName"
 */
export const dbGetAll = async <T>(path: string): Promise<T[]> => {
  const snap = await withTimeout(getDocs(collection(db, path)));
  return snap.docs.map((d) => d.data() as T);
};

/**
 * Update specific fields of a document without overwriting other fields.
 * path format: "collectionName/documentId"
 */
export const dbUpdate = async (path: string, value: Record<string, unknown>): Promise<void> => {
  const [col, ...rest] = path.split('/');
  const id = rest.join('/');
  await withTimeout(updateDoc(doc(db, col, id), value));
};

/**
 * Delete a document.
 * path format: "collectionName/documentId"
 */
export const dbRemove = async (path: string): Promise<void> => {
  const [col, ...rest] = path.split('/');
  const id = rest.join('/');
  await withTimeout(deleteDoc(doc(db, col, id)));
};

/**
 * Query documents in a collection where field === value.
 */
export const dbQueryByField = async <T>(
  collectionName: string,
  field: string,
  value: string | number | boolean
): Promise<T[]> => {
  const q = query(collection(db, collectionName), where(field, '==', value));
  const snap = await withTimeout(getDocs(q));
  return snap.docs.map((d) => d.data() as T);
};

/**
 * Query with ordering.
 */
export const dbGetAllOrdered = async <T>(
  collectionName: string,
  orderField: string,
  direction: 'asc' | 'desc' = 'desc'
): Promise<T[]> => {
  const q = query(collection(db, collectionName), orderBy(orderField, direction));
  const snap = await withTimeout(getDocs(q));
  return snap.docs.map((d) => d.data() as T);
};

// ─── Path builders (user-scoped for data isolation) ──────────────────────────

export const paths = {
  user:      (userId: string)       => `users/${userId}`,
  userByEmail: ()                   => 'users',

  // All data is scoped under the user's ID — Client A sees only their data
  client:    (userId: string, clientId: string)     => `user_data/${userId}/clients/${clientId}`,
  clients:   (userId: string)                       => `user_data/${userId}/clients`,

  analysis:  (userId: string, analysisId: string)   => `user_data/${userId}/website_analyses/${analysisId}`,
  analyses:  (userId: string)                       => `user_data/${userId}/website_analyses`,

  proposal:  (userId: string, proposalId: string)   => `user_data/${userId}/proposals/${proposalId}`,
  proposals: (userId: string)                       => `user_data/${userId}/proposals`,

  aiAnalysis:(userId: string, aiAnalysisId: string) => `user_data/${userId}/ai_analyses/${aiAnalysisId}`,
  aiAnalyses:(userId: string)                       => `user_data/${userId}/ai_analyses`,
};

export { db };
