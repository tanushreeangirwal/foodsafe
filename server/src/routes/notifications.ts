import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get notifications for current user
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT * 
      FROM notifications 
      WHERE recipient_user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [req.user!.id]);

    const unreadCountRes = await query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE recipient_user_id = $1 AND read_at IS NULL
    `, [req.user!.id]);

    res.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadCountRes.rows[0]?.count || '0', 10)
    });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// Mark single notification as read
router.post('/:id/read', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const notifId = parseInt(req.params.id, 10);

  try {
    await query(`
      UPDATE notifications 
      SET read_at = NOW() 
      WHERE id = $1 AND recipient_user_id = $2
    `, [notifId, req.user!.id]);

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// Mark all as read
router.post('/read-all', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    await query(`
      UPDATE notifications 
      SET read_at = NOW() 
      WHERE recipient_user_id = $1 AND read_at IS NULL
    `, [req.user!.id]);

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error marking all notifications read:', err);
    res.status(500).json({ error: 'Failed to mark notifications read.' });
  }
});

export default router;
