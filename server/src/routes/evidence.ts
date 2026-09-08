import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query, logAudit } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Configure Multer storage
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext || mime) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, JPG, and PNG files are accepted.'));
  }
});

// Upload evidence document for requirement
router.post('/upload', authenticateToken, upload.single('evidence'), async (req: Request, res: Response): Promise<void> => {
  const { client_requirement_id, notes } = req.body;

  if (!req.file) {
    res.status(400).json({ error: 'No evidence file uploaded.' });
    return;
  }

  if (!client_requirement_id) {
    res.status(400).json({ error: 'client_requirement_id is required.' });
    return;
  }

  try {
    const reqRes = await query(`
      SELECT cr.*, b.id as business_id, b.business_name, COALESCE(cr.custom_name, rt.name) as req_name
      FROM client_requirements cr
      JOIN businesses b ON cr.client_id = b.id
      LEFT JOIN requirement_templates rt ON cr.requirement_template_id = rt.id
      WHERE cr.id = $1
    `, [client_requirement_id]);

    if (reqRes.rows.length === 0) {
      res.status(404).json({ error: 'Client requirement not found.' });
      return;
    }

    const requirement = reqRes.rows[0];

    // Multi-tenant isolation check
    if (req.user?.role !== 'CONSULTANT' && req.user?.client_id !== requirement.business_id) {
      res.status(403).json({ error: 'Access denied: Cannot upload evidence for another business.' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    // 1. Insert evidence document record
    const docRes = await query(`
      INSERT INTO evidence_documents (
        client_requirement_id, file_url, file_name, file_type, file_size,
        uploaded_by, uploaded_at, review_status, reviewer_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'PENDING', $7)
      RETURNING *
    `, [
      client_requirement_id,
      fileUrl,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      req.user!.id,
      notes || null
    ]);

    const newDoc = docRes.rows[0];

    // 2. Transition requirement status to Under Review
    await query(`
      UPDATE client_requirements
      SET 
        status = 'Under Review',
        last_activity_at = NOW()
      WHERE id = $1
    `, [client_requirement_id]);

    // 3. Notify Consultant
    const consultantUsers = await query(`SELECT id FROM users WHERE role = 'CONSULTANT'`);
    for (const consultant of consultantUsers.rows) {
      await query(`
        INSERT INTO notifications (
          recipient_user_id, type, title, message, priority,
          related_entity_type, related_entity_id
        )
        VALUES ($1, 'ACTION_REQUIRED', 'Evidence Awaiting Review', $2, 'HIGH', 'CLIENT_REQUIREMENT', $3)
      `, [
        consultant.id,
        `${requirement.business_name} submitted evidence for ${requirement.req_name}.`,
        client_requirement_id.toString()
      ]);
    }

    // 4. Audit log
    await logAudit(req.user!.id, 'CLIENT_UPLOADED_EVIDENCE', 'CLIENT_REQUIREMENT', client_requirement_id.toString(), {
      file_name: req.file.originalname,
      file_size: req.file.size,
      business_name: requirement.business_name,
      requirement_name: requirement.req_name
    });

    res.status(201).json({
      document: newDoc,
      message: 'Evidence document uploaded successfully. Status is now Under Review.'
    });
  } catch (err: any) {
    console.error('Evidence upload error:', err);
    res.status(500).json({ error: 'Failed to upload evidence document.' });
  }
});

// Consultant reviews evidence: Approve or Reject
router.post('/:id/review', authenticateToken, requireRole('CONSULTANT'), async (req: Request, res: Response): Promise<void> => {
  const documentId = parseInt(req.params.id, 10);
  const { review_status, reviewer_notes } = req.body; // 'APPROVED' | 'REJECTED'

  if (!['APPROVED', 'REJECTED'].includes(review_status)) {
    res.status(400).json({ error: "review_status must be either 'APPROVED' or 'REJECTED'." });
    return;
  }

  if (review_status === 'REJECTED' && (!reviewer_notes || !reviewer_notes.trim())) {
    res.status(400).json({ error: 'Reviewer notes with a clear rejection reason are mandatory when rejecting evidence.' });
    return;
  }

  try {
    const docRes = await query(`
      SELECT ed.*, cr.client_id, cr.id as req_id, b.business_name, COALESCE(cr.custom_name, rt.name) as req_name
      FROM evidence_documents ed
      JOIN client_requirements cr ON ed.client_requirement_id = cr.id
      JOIN businesses b ON cr.client_id = b.id
      LEFT JOIN requirement_templates rt ON cr.requirement_template_id = rt.id
      WHERE ed.id = $1
    `, [documentId]);

    if (docRes.rows.length === 0) {
      res.status(404).json({ error: 'Evidence document not found.' });
      return;
    }

    const doc = docRes.rows[0];

    // 1. Update document
    const updatedDoc = await query(`
      UPDATE evidence_documents
      SET 
        review_status = $1,
        reviewer_id = $2,
        reviewer_notes = $3,
        reviewed_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [review_status, req.user!.id, reviewer_notes || '', documentId]);

    // 2. Update requirement status
    const newReqStatus = review_status === 'APPROVED' ? 'Approved' : 'Rejected';
    await query(`
      UPDATE client_requirements
      SET 
        status = $1,
        consultant_notes = CASE 
          WHEN $2 = 'REJECTED' THEN 'Evidence rejected: ' || $3
          ELSE 'Evidence approved by consultant.'
        END,
        last_activity_at = NOW()
      WHERE id = $4
    `, [newReqStatus, review_status, reviewer_notes || '', doc.req_id]);

    // 3. Update business status
    if (review_status === 'APPROVED') {
      // Check if business has other critical or overdue requirements
      const issuesRes = await query(`
        SELECT COUNT(*) as count 
        FROM client_requirements 
        WHERE client_id = $1 AND status IN ('Overdue', 'Expired', 'Rejected')
      `, [doc.client_id]);

      const issueCount = parseInt(issuesRes.rows[0].count, 10);
      if (issueCount === 0) {
        await query(`UPDATE businesses SET status = 'COMPLIANT' WHERE id = $1`, [doc.client_id]);
      }
    } else {
      await query(`UPDATE businesses SET status = 'ATTENTION_REQUIRED' WHERE id = $1`, [doc.client_id]);
    }

    // 4. Notify Client users
    const clientUsers = await query(`SELECT id FROM users WHERE client_id = $1`, [doc.client_id]);
    for (const u of clientUsers.rows) {
      if (review_status === 'APPROVED') {
        await query(`
          INSERT INTO notifications (
            recipient_user_id, type, title, message, priority,
            related_entity_type, related_entity_id
          )
          VALUES ($1, 'INFORMATIONAL', 'Evidence Approved', $2, 'MEDIUM', 'CLIENT_REQUIREMENT', $3)
        `, [
          u.id,
          `Your evidence for "${doc.req_name}" has been approved by the consultant.`,
          doc.req_id.toString()
        ]);
      } else {
        await query(`
          INSERT INTO notifications (
            recipient_user_id, type, title, message, priority,
            related_entity_type, related_entity_id
          )
          VALUES ($1, 'CRITICAL', 'Evidence Rejected', $2, 'CRITICAL', 'CLIENT_REQUIREMENT', $3)
        `, [
          u.id,
          `Evidence rejected for "${doc.req_name}". Reason: ${reviewer_notes}`,
          doc.req_id.toString()
        ]);
      }
    }

    // 5. Audit log
    await logAudit(
      req.user!.id, 
      review_status === 'APPROVED' ? 'CONSULTANT_APPROVED_EVIDENCE' : 'CONSULTANT_REJECTED_EVIDENCE',
      'EVIDENCE_DOCUMENT',
      documentId.toString(),
      {
        requirement_id: doc.req_id,
        business_name: doc.business_name,
        requirement_name: doc.req_name,
        reviewer_notes
      }
    );

    res.json({
      document: updatedDoc.rows[0],
      requirementStatus: newReqStatus,
      message: `Evidence has been ${review_status.toLowerCase()}.`
    });
  } catch (err: any) {
    console.error('Evidence review error:', err);
    res.status(500).json({ error: 'Failed to process evidence review.' });
  }
});

// Pending documents review queue (Consultant only)
router.get('/pending', authenticateToken, requireRole('CONSULTANT'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT 
        ed.*,
        cr.client_id,
        b.business_name,
        c.name as category_name,
        COALESCE(cr.custom_name, rt.name) as requirement_name,
        cr.due_date,
        cr.priority,
        u.name as uploader_name
      FROM evidence_documents ed
      JOIN client_requirements cr ON ed.client_requirement_id = cr.id
      JOIN businesses b ON cr.client_id = b.id
      JOIN business_categories c ON b.business_category_id = c.id
      LEFT JOIN requirement_templates rt ON cr.requirement_template_id = rt.id
      LEFT JOIN users u ON ed.uploaded_by = u.id
      WHERE ed.review_status = 'PENDING'
      ORDER BY ed.uploaded_at ASC
    `);

    res.json({ pendingDocuments: result.rows });
  } catch (err: any) {
    console.error('Error fetching pending documents:', err);
    res.status(500).json({ error: 'Failed to retrieve pending documents queue.' });
  }
});

export default router;
