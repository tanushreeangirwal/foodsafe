import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

export const JWT_SECRET = process.env.JWT_SECRET || 'foodsafe_secure_jwt_secret_key_2026';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'CONSULTANT' | 'CLIENT' | 'MANAGER' | 'STAFF';
  client_id: number | null;
  business_name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const userRes = await query(
      `SELECT u.id, u.name, u.email, u.role, u.client_id, b.business_name 
       FROM users u
       LEFT JOIN businesses b ON u.client_id = b.id
       WHERE u.id = $1 AND u.status = 'ACTIVE'`,
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      res.status(401).json({ error: 'User session invalid or deactivated.' });
      return;
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
    return;
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Access forbidden for role '${req.user.role}'. Required: ${allowedRoles.join(' or ')}` 
      });
      return;
    }

    next();
  };
}

export function enforceClientIsolation(paramName: string = 'clientId') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Consultant can access any client
    if (req.user.role === 'CONSULTANT') {
      next();
      return;
    }

    // Client, Manager, Staff can only access their own business
    const targetClientId = parseInt(req.params[paramName] || req.query[paramName] as string || req.body[paramName], 10);
    if (!targetClientId || targetClientId !== req.user.client_id) {
      res.status(403).json({ 
        error: 'Multi-tenant violation: You do not have permission to access records for another business.' 
      });
      return;
    }

    next();
  };
}
