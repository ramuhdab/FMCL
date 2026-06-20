import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fmcl-secret-key-2024-change-in-production';

export interface JWTPayload {
  id: number;
  name: string;
  email: string;
  role: string;
  building_id: number | null;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const APPROVAL_STEPS = [
  { step: 1, role: 'tech_manager', label: 'Tech Manager' },
  { step: 2, role: 'senior_manager', label: 'Senior Manager' },
  { step: 3, role: 'finance_manager', label: 'Finance Manager' },
  { step: 4, role: 'managing_director', label: 'Managing Director' },
];
