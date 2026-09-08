import { Router, Request, Response } from 'express';
import { query, logAudit } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// List categories with count of businesses
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.active,
        c.created_at,
        COUNT(b.id) as business_count,
        COUNT(rt.id) as template_count
      FROM business_categories c
      LEFT JOIN businesses b ON b.business_category_id = c.id
      LEFT JOIN requirement_templates rt ON rt.category_id = c.id
      GROUP BY c.id, c.name, c.description, c.active, c.created_at
      ORDER BY c.name ASC
    `);

    res.json({ categories: result.rows });
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

// Create new business category (Consultant only)
router.post('/', authenticateToken, requireRole('CONSULTANT'), async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }

  try {
    const result = await query(
      `INSERT INTO business_categories (name, description, active)
       VALUES ($1, $2, true) RETURNING *`,
      [name.trim(), description || '']
    );

    const newCat = result.rows[0];
    await logAudit(req.user!.id, 'CREATE_CATEGORY', 'CATEGORY', newCat.id.toString(), { name: newCat.name });

    res.status(201).json({ category: newCat });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'A category with this name already exists.' });
      return;
    }
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create business category.' });
  }
});

export default router;
