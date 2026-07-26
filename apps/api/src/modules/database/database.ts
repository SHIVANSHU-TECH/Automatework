import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  type DatabaseReference,
} from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDYJdbz01UYSz3MNKG9G04UtQDkgWMWCYk',
  authDomain: 'trainerform-52f85.firebaseapp.com',
  databaseURL: 'https://trainerform-52f85-default-rtdb.firebaseio.com',
  projectId: 'trainerform-52f85',
  storageBucket: 'trainerform-52f85.firebasestorage.app',
  messagingSenderId: '226297252007',
  appId: '1:226297252007:web:85ec7514b492547c373382',
};

// Initialise only once (safe for hot-reload in dev)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

// ─── Generic helpers ───────────────────────────────────────────────────────────

/** Write a value at an exact path, overwriting whatever is there. */
export const dbSet = async (path: string, value: unknown): Promise<void> => {
  await Promise.race([
    set(ref(db, path), value),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase request timed out. Check your database is active.')), 8000)
    ),
  ]);
};

/** Read a single node. Returns null when the node does not exist. */
export const dbGet = async <T>(path: string): Promise<T | null> => {
  const snapshot = await Promise.race([
    get(ref(db, path)),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase request timed out. Check your database is active.')), 8000)
    ),
  ]);
  return snapshot.exists() ? (snapshot.val() as T) : null;
};

/** Read all children of a node as an array. */
export const dbGetAll = async <T>(path: string): Promise<T[]> => {
  const snapshot = await Promise.race([
    get(ref(db, path)),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase request timed out. Check your database is active.')), 8000)
    ),
  ]);
  if (!snapshot.exists()) return [];
  const val = snapshot.val() as Record<string, T>;
  return Object.values(val);
};

/** Update specific fields of a node without overwriting siblings. */
export const dbUpdate = async (path: string, value: Record<string, unknown>): Promise<void> => {
  await update(ref(db, path), value);
};

/** Delete a node. */
export const dbRemove = async (path: string): Promise<void> => {
  await remove(ref(db, path));
};

/**
 * Query children of a node where `childKey === value`.
 * Returns matching children as an array.
 */
export const dbQueryByChild = async <T>(
  path: string,
  childKey: string,
  value: string | number | boolean
): Promise<T[]> => {
  const nodeRef: DatabaseReference = ref(db, path);
  const q = query(nodeRef, orderByChild(childKey), equalTo(value));
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];
  const val = snapshot.val() as Record<string, T>;
  return Object.values(val);
};

// ─── Convenience path builders ────────────────────────────────────────────────

export const paths = {
  user: (userId: string) => `users/${userId}`,
  userByEmail: () => 'users',

  client: (clientId: string) => `clients/${clientId}`,
  clients: () => 'clients',

  analysis: (analysisId: string) => `website_analyses/${analysisId}`,
  analyses: () => 'website_analyses',

  proposal: (proposalId: string) => `proposals/${proposalId}`,
  proposals: () => 'proposals',

  aiAnalysis: (aiAnalysisId: string) => `ai_analyses/${aiAnalysisId}`,
  aiAnalyses: () => 'ai_analyses',

  auditLog: (logId: string) => `audit_logs/${logId}`,
  auditLogs: () => 'audit_logs',
};

export { db };
