import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export type AuthPayload = {
  email: string;
  password: string;
};

export const createToken = (userId: string) => {
  const secret = process.env.APP_AUTH_SECRET ?? 'change-me';
  return jwt.sign({ sub: userId }, secret, { expiresIn: '8h' });
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};
