import { Router, Request, Response } from 'express';
import { query, logAudit } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// List all templates (can filter by category_id)
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { category_id } = req.query;
    let sql = `
      SELECT 
        rt.*,
        c.name as category_name,
        u.name as consultant_name,
        (SELECT COUNT(*) FROM client_requirements cr WHERE cr.requirement_template_id = rt.id) as active_assignments
      FROM requirement_templates rt
      LEFT JOIN business_categories c ON rt.category_id = c.id
      LEFT JOIN users u ON rt.consultant_id = u.id
      WHERE rt.active = true
    `;
    const params: any[] = [];

    if (category_id) {
      params.push(category_id);
      sql += ` AND rt.category_id = $${params.length}`;
    }

    sql += ` ORDER BY rt.id DESC`;

    const result = await query(sql, params);
    res.json({ templates: result.rows });
  } catch (err: any) {
    console.error('Error fetching templates:', err);
    res.status(500).json({ error: 'Failed to retrieve requirement templates.' });
  }
});

// Create new template (Consultant only)
router.post('/', authenticateToken, requireRole('CONSULTANT'), async (req: Request, res: Response): Promise<void> => {
  const {
    category_id,
    name,
    description,
    requirement_type,
    frequency,
    evidence_type,
    reminder_schedule,
    default_duration_days,
    default_priority,
    assign_to_existing_clients // boolean flag for Demo Step 13-14
  } = req.body;

  if (!name || !category_id) {
    res.status(400).json({ error: 'Requirement name and business category are required.' });
    return;
  }

  try {
    const scheduleJson = Array.isArray(reminder_schedule) ? JSON.stringify(reminder_schedule) : '[30, 15, 7]';

    const result = await query(`
      INSERT INTO requirement_templates (
        category_id, name, description, requirement_type, frequency,
        evidence_type, reminder_schedule, default_duration_days, default_priority,
        active, consultant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, true, $10)
      RETURNING *
    `, [
      category_id,
      name.trim(),
      description || '',
      requirement_type || 'STATUTORY',
      frequency || 'ANNUAL',
      evidence_type || 'PDF / Image',
      scheduleJson,
      default_duration_days || 90,
      default_priority || 'HIGH',
      req.user!.id
    ]);

    const newTemplate = result.rows[0];
    let assignedCount = 0;

    // Demo Step 13 & 14: Option to assign to existing businesses in this category
    if (assign_to_existing_clients) {
      const bizList = await query(
        `SELECT id FROM businesses WHERE business_category_id = $1`,
        [category_id]
      );

      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + (default_duration_days || 90));
      const dueFormatted = dueDate.toISOString().split('T')[0];

      for (const biz of bizList.rows) {
        await query(`
          INSERT INTO client_requirements (
            client_id, requirement_template_id, custom_name, assigned_date,
            due_date, expiry_date, status, priority, consultant_notes
          )
          VALUES ($1, $2, $3, CURRENT_DATE, $4, $4, 'Upcoming', $5, $6)
        `, [
          biz.id,
          newTemplate.id,
          newTemplate.name,
          dueFormatted,
          newTemplate.default_priority,
          `Newly configured compliance requirement broadcasted to ${biz.id}`
        ]);
        assignedCount++;
      }
    }

    await logAudit(req.user!.id, 'CREATE_REQUIREMENT_TEMPLATE', 'REQUIREMENT_TEMPLATE', newTemplate.id.toString(), {
      template_name: newTemplate.name,
      category_id,
      assigned_to_clients: assignedCount
    });

    res.status(201).json({
      template: newTemplate,
      assignedCount
    });
  } catch (err: any) {
    console.error('Error creating template:', err);
    res.status(500).json({ error: 'Failed to create requirement template.' });
  }
});

export default router;
