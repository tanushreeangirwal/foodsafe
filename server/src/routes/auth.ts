import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, logAudit } from '../db';
import { JWT_SECRET, authenticateToken } from '../middleware/auth';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const userRes = await query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.client_id, u.status, b.business_name
       FROM users u
       LEFT JOIN businesses b ON u.client_id = b.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    if (userRes.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'User account is inactive.' });
      return;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    await logAudit(user.id, 'USER_LOGIN', 'USER', user.id.toString(), { email: user.email, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        client_id: user.client_id,
        business_name: user.business_name
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Fast persona switch for POC live demonstration
router.post('/switch-demo', async (req: Request, res: Response): Promise<void> => {
  const { role } = req.body; // 'CONSULTANT' | 'CLIENT' | 'MANAGER' | 'STAFF'

  try {
    let targetEmail = 'consultant@demo.foodsafe';
    if (role === 'CLIENT') targetEmail = 'client@demo.foodsafe';
    if (role === 'MANAGER') targetEmail = 'manager@demo.foodsafe';
    if (role === 'STAFF') targetEmail = 'staff@demo.foodsafe';

    const userRes = await query(
      `SELECT u.id, u.name, u.email, u.role, u.client_id, b.business_name
       FROM users u
       LEFT JOIN businesses b ON u.client_id = b.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [targetEmail]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: `Demo account for ${role} not found.` });
      return;
    }

    const user = userRes.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    await logAudit(user.id, 'DEMO_SWITCH', 'USER', user.id.toString(), { switched_to_role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        client_id: user.client_id,
        business_name: user.business_name
      }
    });
  } catch (err: any) {
    console.error('Demo switch error:', err);
    res.status(500).json({ error: 'Failed to switch demo persona.' });
  }
});

// Current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  res.json({ user: req.user });
});

export default router;
