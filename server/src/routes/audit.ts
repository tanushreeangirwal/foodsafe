import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Get system audit logs (Consultant only)
router.get('/', authenticateToken, requireRole('CONSULTANT'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 100 } = req.query;

    const result = await query(`
      SELECT 
        a.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC
      LIMIT $1
    `, [parseInt(limit as string, 10)]);

    res.json({ auditLogs: result.rows });
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to retrieve audit trail.' });
  }
});

export default router;
