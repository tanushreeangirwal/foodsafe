import { Router, Request, Response } from 'express';
import { query, logAudit } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// List requirements (strictly isolated by client if not consultant)
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { client_id, status, priority, category_id } = req.query;

    let sql = `
      SELECT 
        cr.*,
        b.business_name,
        b.city,
        c.name as category_name,
        rt.name as template_name,
        rt.requirement_type,
        rt.frequency,
        rt.evidence_type,
        rt.reminder_schedule,
        (
          SELECT json_agg(
            json_build_object(
              'id', ed.id,
              'file_url', ed.file_url,
              'file_name', ed.file_name,
              'file_type', ed.file_type,
              'review_status', ed.review_status,
              'reviewer_notes', ed.reviewer_notes,
              'uploaded_at', ed.uploaded_at
            )
          )
          FROM evidence_documents ed
          WHERE ed.client_requirement_id = cr.id
        ) as documents
      FROM client_requirements cr
      JOIN businesses b ON cr.client_id = b.id
      JOIN business_categories c ON b.business_category_id = c.id
      LEFT JOIN requirement_templates rt ON cr.requirement_template_id = rt.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Tenant isolation
    if (req.user?.role !== 'CONSULTANT') {
      params.push(req.user?.client_id);
      sql += ` AND cr.client_id = $${params.length}`;
    } else if (client_id) {
      params.push(client_id);
      sql += ` AND cr.client_id = $${params.length}`;
    }

    if (category_id) {
      params.push(category_id);
      sql += ` AND b.business_category_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND cr.status = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      sql += ` AND cr.priority = $${params.length}`;
    }

    sql += ` ORDER BY 
      CASE 
        WHEN cr.status = 'Overdue' THEN 1
        WHEN cr.status = 'Due Soon' THEN 2
        WHEN cr.status = 'Due' THEN 3
        WHEN cr.status = 'Submitted' THEN 4
        WHEN cr.status = 'Under Review' THEN 5
        WHEN cr.status = 'Upcoming' THEN 6
        WHEN cr.status = 'Approved' THEN 7
        ELSE 8
      END,
      cr.due_date ASC`;

    const result = await query(sql, params);
    res.json({ requirements: result.rows });
  } catch (err: any) {
    console.error('Error fetching requirements:', err);
    res.status(500).json({ error: 'Failed to retrieve requirements.' });
  }
});

// Single requirement detail
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const reqId = parseInt(req.params.id, 10);

  try {
    const result = await query(`
      SELECT 
        cr.*,
        b.business_name,
        b.business_type,
        b.contact_person,
        b.phone,
        b.email,
        c.name as category_name,
        rt.name as template_name,
        rt.description as template_description,
        rt.requirement_type,
        rt.frequency,
        rt.evidence_type,
        rt.reminder_schedule
      FROM client_requirements cr
      JOIN businesses b ON cr.client_id = b.id
      JOIN business_categories c ON b.business_category_id = c.id
      LEFT JOIN requirement_templates rt ON cr.requirement_template_id = rt.id
      WHERE cr.id = $1
    `, [reqId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Requirement not found.' });
      return;
    }

    const requirement = result.rows[0];

    // Tenant isolation
    if (req.user?.role !== 'CONSULTANT' && req.user?.client_id !== requirement.client_id) {
      res.status(403).json({ error: 'Multi-tenant isolation: Access denied to this requirement.' });
      return;
    }

    // Documents
    const docsRes = await query(`
      SELECT 
        ed.*,
        u.name as uploader_name,
        r.name as reviewer_name
      FROM evidence_documents ed
      LEFT JOIN users u ON ed.uploaded_by = u.id
      LEFT JOIN users r ON ed.reviewer_id = r.id
      WHERE ed.client_requirement_id = $1
      ORDER BY ed.uploaded_at DESC
    `, [reqId]);

    // History / Audit trail
    const auditRes = await query(`
      SELECT a.*, u.name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.entity_type = 'CLIENT_REQUIREMENT' AND a.entity_id = $1::text
      ORDER BY a.timestamp DESC
    `, [reqId]);

    res.json({
      requirement,
      documents: docsRes.rows,
      history: auditRes.rows
    });
  } catch (err: any) {
    console.error('Error fetching requirement detail:', err);
    res.status(500).json({ error: 'Failed to retrieve requirement details.' });
  }
});

// Update notes / priority / due date (Consultant)
router.patch('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const reqId = parseInt(req.params.id, 10);
  const { consultant_notes, priority, due_date } = req.body;

  try {
    const existing = await query(`SELECT * FROM client_requirements WHERE id = $1`, [reqId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Requirement not found.' });
      return;
    }

    const current = existing.rows[0];
    if (req.user?.role !== 'CONSULTANT' && req.user?.client_id !== current.client_id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const updated = await query(`
      UPDATE client_requirements
      SET 
        consultant_notes = COALESCE($1, consultant_notes),
        priority = COALESCE($2, priority),
        due_date = COALESCE($3, due_date),
        last_activity_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [consultant_notes, priority, due_date, reqId]);

    await logAudit(req.user!.id, 'UPDATE_REQUIREMENT_METADATA', 'CLIENT_REQUIREMENT', reqId.toString(), {
      consultant_notes,
      priority,
      due_date
    });

    res.json({ requirement: updated.rows[0] });
  } catch (err: any) {
    console.error('Error updating requirement:', err);
    res.status(500).json({ error: 'Failed to update requirement.' });
  }
});

export default router;
