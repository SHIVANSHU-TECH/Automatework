import { Router } from 'express';
import { createToken } from '../modules/auth/auth.service';
import { dbGet, dbSet, paths } from '../modules/database/database';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export const authRouter = Router();

// ─── Initialise Firebase Admin (once) ────────────────────────────────────────
const initAdmin = () => {
  if (getApps().length > 0) return;
  try {
    // Option A: GOOGLE_APPLICATION_CREDENTIALS env var (file path) — auto-detected
    // Option B: Individual env vars
    const projectId   = process.env.FIREBASE_PROJECT_ID   ?? 'trainerform-52f85';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (clientEmail && privateKey) {
      initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    } else {
      // Fallback — works on GCP/Firebase Hosting with default credentials
      initializeApp({ projectId });
    }
  } catch {
    // Already initialised
  }
};

// ─── Exchange Firebase ID token for app JWT ───────────────────────────────────
authRouter.post('/firebase', async (req, res) => {
  try {
    initAdmin();
    const { idToken } = req.body as { idToken: string };
    if (!idToken) return res.status(400).json({ message: 'idToken is required' });

    // Verify the Firebase token
    const decoded = await getAuth().verifyIdToken(idToken);
    const { uid, email, email_verified, name } = decoded;

    // Create or update user record in Firestore
    const existing = await dbGet<{ userId: string; email: string }>(paths.user(uid));
    if (!existing) {
      await dbSet(paths.user(uid), {
        userId:    uid,
        email:     email ?? '',
        name:      name ?? '',
        createdAt: new Date().toISOString(),
        provider:  decoded.firebase?.sign_in_provider ?? 'email',
      });
    }

    // Issue our own JWT scoped to this userId
    const token = createToken(uid);
    res.json({ token, userId: uid, email: email ?? '', emailVerified: email_verified ?? false });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes('expired') || msg.includes('invalid')) {
      return res.status(401).json({ message: 'Firebase token invalid or expired. Please sign in again.' });
    }
    res.status(500).json({ message: msg || 'Authentication failed' });
  }
});

// ─── Keep legacy email/password routes for backward compat ───────────────────
import { hashPassword, verifyPassword } from '../modules/auth/auth.service';
import { dbGetAll } from '../modules/database/database';
import { v4 as uuidv4 } from 'uuid';

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const allUsers = await dbGetAll<{ userId: string; email: string; passwordHash: string }>(paths.userByEmail());
    if (allUsers.find((u) => u.email === email)) return res.status(409).json({ message: 'Email already registered' });
    const passwordHash = await hashPassword(password);
    const userId = uuidv4();
    await dbSet(paths.user(userId), { userId, email, passwordHash, createdAt: new Date().toISOString() });
    res.status(201).json({ message: 'Account created. Please verify your email before signing in.' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Registration failed' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const allUsers = await dbGetAll<{ userId: string; email: string; passwordHash: string }>(paths.userByEmail());
    const user = allUsers.find((u) => u.email === email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: createToken(user.userId) });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Login failed' });
  }
});
