import { Router } from 'express';
import { createToken, hashPassword, verifyPassword } from '../modules/auth/auth.service';
import { dbGetAll, dbSet, paths } from '../modules/database/database';
import { v4 as uuidv4 } from 'uuid';

export const authRouter = Router();

// ─── Register ─────────────────────────────────────────────────────────────────

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const allUsers = await dbGetAll<{ userId: string; email: string; passwordHash: string; createdAt: string }>(
      paths.userByEmail()
    );
    const existing = allUsers.find((u) => u.email === email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const userId = uuidv4();
    const now = new Date().toISOString();

    await dbSet(paths.user(userId), { userId, email, passwordHash, createdAt: now });

    res.status(201).json({ token: createToken(userId) });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Registration failed' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const allUsers = await dbGetAll<{ userId: string; email: string; passwordHash: string }>(
      paths.userByEmail()
    );
    const user = allUsers.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ token: createToken(user.userId) });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Login failed' });
  }
});
