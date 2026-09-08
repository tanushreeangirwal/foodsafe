import { Router, Request, Response } from 'express';
import { query, logAudit } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Simulated category estimates for large portfolio scale demonstration (approx 2000+ businesses total)
const CATEGORY_SCALE_ESTIMATES: Record<string, number> = {
  'Pickle Manufacturer': 287,
  'Papad Manufacturer': 214,
  'Masala Manufacturer': 192,
  'Snack Manufacturer': 345,
  'Bakery': 260,
  'Restaurant': 415,
  'Cafe': 210,
  'Cloud Kitchen': 224,
};

// Calculate targeting reach estimate before publishing
router.post('/target-estimate', authenticateToken, requireRole('CONSULTANT'), async (req: Request, res: Response): Promise<void> => {
  const { category_ids } = req.body;

  try {
    if (!Array.isArray(category_ids) || category_ids.length === 0) {
      res.json({ totalEstimate: 0, breakdowns: [] });
      return;
    }

    const catRes = await query(`
      SELECT id, name FROM business_categories WHERE id = ANY($1::int[])
    `, [category_ids]);

    let total = 0;
    const breakdowns = catRes.rows.map(c => {
      const estimatedCount = CATEGORY_SCALE_ESTIMATES[c.name] || 150;
      total += estimatedCount;
      return {
        categoryId: c.id,
        categoryName: c.name,
        estimatedBusinesses: estimatedCount
      };
    });

    res.json({
      totalEstimate: total,
      breakdowns
    });
  } catch (err: any) {
    console.error('Error estimating reach:', err);
    res.status(500).json({ error: 'Failed to estimate regulatory reach.' });
  }
});

// List regulatory updates
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const isConsultant = req.user?.role === 'CONSULTANT';
    const clientId = req.user?.client_id;

    if (isConsultant) {
      const result = await query(`
        SELECT 
          ru.*,
          u.name as creator_name,
          COALESCE(
            jsonb_agg(
              DISTINCT jsonb_build_object('id', bc.id, 'name', bc.name)
            ) FILTER (WHERE bc.id IS NOT NULL), '[]'::jsonb
          ) as targeted_categories,
          (
            SELECT COUNT(*) 
            FROM regulatory_acknowledgements ra 
            WHERE ra.regulatory_update_id = ru.id AND ra.status = 'ACKNOWLEDGED'
          ) as actual_acknowledged_count,
          (
            SELECT COUNT(*) 
            FROM regulatory_acknowledgements ra 
            WHERE ra.regulatory_update_id = ru.id
          ) as actual_target_count
        FROM regulatory_updates ru
        LEFT JOIN users u ON ru.created_by = u.id
        LEFT JOIN regulatory_targets rt ON rt.regulatory_update_id = ru.id
        LEFT JOIN business_categories bc ON rt.business_category_id = bc.id
        GROUP BY ru.id, u.name
        ORDER BY ru.published_date DESC, ru.id DESC
      `);

      res.json({ updates: result.rows });
    } else {
      // Client/Manager/Staff view: only applicable updates
      const bizRes = await query(`SELECT business_category_id FROM businesses WHERE id = $1`, [clientId]);
      const catId = bizRes.rows[0]?.business_category_id;

      const result = await query(`
        SELECT 
          ru.*,
          u.name as creator_name,
          COALESCE(ra.status, 'PENDING') as acknowledgement_status,
          ra.acknowledged_at
        FROM regulatory_updates ru
        LEFT JOIN users u ON ru.created_by = u.id
        LEFT JOIN regulatory_acknowledgements ra ON ra.regulatory_update_id = ru.id AND ra.client_id = $1
        WHERE ru.status = 'PUBLISHED'
          AND (
            EXISTS (SELECT 1 FROM regulatory_targets rt WHERE rt.regulatory_update_id = ru.id AND rt.business_category_id = $2)
            OR EXISTS (SELECT 1 FROM regulatory_client_targets rct WHERE rct.regulatory_update_id = ru.id AND rct.client_id = $1)
          )
        ORDER BY ru.published_date DESC, ru.id DESC
      `, [clientId, catId]);

      res.json({ updates: result.rows });
    }
  } catch (err: any) {
    console.error('Error fetching regulatory updates:', err);
    res.status(500).json({ error: 'Failed to retrieve regulatory updates.' });
  }
});

// Single regulatory update with broadcast dashboard
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const updateId = parseInt(req.params.id, 10);

  try {
    const updateRes = await query(`
      SELECT 
        ru.*,
        u.name as creator_name,
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object('id', bc.id, 'name', bc.name)
          ) FILTER (WHERE bc.id IS NOT NULL), '[]'::jsonb
        ) as targeted_categories
      FROM regulatory_updates ru
      LEFT JOIN users u ON ru.created_by = u.id
      LEFT JOIN regulatory_targets rt ON rt.regulatory_update_id = ru.id
      LEFT JOIN business_categories bc ON rt.business_category_id = bc.id
      WHERE ru.id = $1
      GROUP BY ru.id, u.name
    `, [updateId]);

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Regulatory update not found.' });
      return;
    }

    const regUpdate = updateRes.rows[0];

    // Get client targeting & acknowledgement records
    const clientsRes = await query(`
      SELECT 
        b.id as client_id,
        b.business_name,
        bc.name as category_name,
        b.city,
        b.contact_person,
        COALESCE(ra.status, 'PENDING') as acknowledgement_status,
        ra.acknowledged_at,
        u.name as acknowledged_by_user
      FROM businesses b
      JOIN business_categories bc ON b.business_category_id = bc.id
      LEFT JOIN regulatory_acknowledgements ra ON ra.regulatory_update_id = $1 AND ra.client_id = b.id
      LEFT JOIN users u ON ra.user_id = u.id
      WHERE EXISTS (
        SELECT 1 FROM regulatory_targets rt 
        WHERE rt.regulatory_update_id = $1 AND rt.business_category_id = b.business_category_id
      ) OR EXISTS (
        SELECT 1 FROM regulatory_client_targets rct
        WHERE rct.regulatory_update_id = $1 AND rct.client_id = b.id
      )
      ORDER BY ra.status DESC, b.business_name ASC
    `, [updateId]);

    // Calculate broadcast figures
    // Real seeded counts + simulated scale reach for portfolio display
    const realTotal = clientsRes.rows.length;
    const realAck = clientsRes.rows.filter(c => c.acknowledgement_status === 'ACKNOWLEDGED').length;
    const realPending = realTotal - realAck;

    const simulatedTotal = regUpdate.simulated_reach || (realTotal * 35);
    const ackRatio = realTotal > 0 ? (realAck / realTotal) : 0.85;
    const simulatedAck = Math.min(simulatedTotal, Math.round(simulatedTotal * 0.84) + realAck);
    const simulatedRead = Math.min(simulatedTotal, Math.round(simulatedTotal * 0.925));
    const simulatedPending = Math.max(0, simulatedTotal - simulatedAck);

    res.json({
      update: regUpdate,
      broadcastStats: {
        totalAffected: simulatedTotal,
        sent: simulatedTotal,
        read: simulatedRead,
        acknowledged: simulatedAck,
        pending: simulatedPending,
        actionCompleted: Math.round(simulatedAck * 0.72)
      },
      clients: clientsRes.rows
    });
  } catch (err: any) {
    console.error('Error fetching regulatory update details:', err);
    res.status(500).json({ error: 'Failed to retrieve regulatory update details.' });
  }
});

// Create and broadcast regulatory update (Consultant only)
router.post('/', authenticateToken, requireRole('CONSULTANT'), async (req: Request, res: Response): Promise<void> => {
  const {
    title,
    summary,
    description,
    source,
    source_url,
    effective_date,
    consultant_notes,
    category_ids,
    client_ids
  } = req.body;

  if (!title || !summary) {
    res.status(400).json({ error: 'Title and summary are required.' });
    return;
  }

  // Ensure DEMO prefix if not verified
  let finalTitle = title.trim();
  if (!finalTitle.toUpperCase().includes('DEMO REGULATORY UPDATE') && !finalTitle.toUpperCase().includes('FSSAI')) {
    finalTitle = `DEMO REGULATORY UPDATE — ${finalTitle}`;
  }

  try {
    // 1. Calculate simulated total reach based on categories
    let simulatedReach = 0;
    if (Array.isArray(category_ids) && category_ids.length > 0) {
      const cats = await query(`SELECT name FROM business_categories WHERE id = ANY($1::int[])`, [category_ids]);
      for (const c of cats.rows) {
        simulatedReach += CATEGORY_SCALE_ESTIMATES[c.name] || 150;
      }
    } else {
      simulatedReach = 693; // default demo reach
    }

    // 2. Insert update
    const updateRes = await query(`
      INSERT INTO regulatory_updates (
        title, summary, description, source, source_url,
        published_date, effective_date, created_by, status,
        consultant_notes, simulated_reach
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, 'PUBLISHED', $8, $9)
      RETURNING *
    `, [
      finalTitle,
      summary.trim(),
      description || '',
      source || 'Food Safety Authority Bulletin',
      source_url || 'https://fssai.gov.in',
      effective_date || null,
      req.user!.id,
      consultant_notes || '',
      simulatedReach
    ]);

    const newUpdate = updateRes.rows[0];

    // 3. Insert category targets
    if (Array.isArray(category_ids)) {
      for (const catId of category_ids) {
        await query(`INSERT INTO regulatory_targets (regulatory_update_id, business_category_id) VALUES ($1, $2)`, [newUpdate.id, catId]);
      }
    }

    // 4. Insert specific client targets if provided
    if (Array.isArray(client_ids)) {
      for (const clientId of client_ids) {
        await query(`INSERT INTO regulatory_client_targets (regulatory_update_id, client_id) VALUES ($1, $2)`, [newUpdate.id, clientId]);
      }
    }

    // 5. Find all affected seeded businesses & generate notifications + pending acknowledgement records
    const targetedBizRes = await query(`
      SELECT DISTINCT b.id, b.business_name
      FROM businesses b
      WHERE b.business_category_id = ANY($1::int[])
         OR b.id = ANY($2::int[])
    `, [category_ids || [], client_ids || []]);

    for (const biz of targetedBizRes.rows) {
      // Create pending acknowledgement row
      await query(`
        INSERT INTO regulatory_acknowledgements (regulatory_update_id, client_id, status)
        VALUES ($1, $2, 'PENDING')
        ON CONFLICT DO NOTHING
      `, [newUpdate.id, biz.id]);

      // Notify client users
      const users = await query(`SELECT id FROM users WHERE client_id = $1`, [biz.id]);
      for (const u of users.rows) {
        await query(`
          INSERT INTO notifications (
            recipient_user_id, type, title, message, priority,
            related_entity_type, related_entity_id
          )
          VALUES ($1, 'REGULATORY', 'New Regulatory Update Published', $2, 'HIGH', 'REGULATORY_UPDATE', $3)
        `, [
          u.id,
          `${finalTitle}: ${summary.substring(0, 120)}... Action and acknowledgement required.`,
          newUpdate.id.toString()
        ]);
      }
    }

    // 6. Audit log
    await logAudit(req.user!.id, 'PUBLISH_REGULATORY_UPDATE', 'REGULATORY_UPDATE', newUpdate.id.toString(), {
      title: finalTitle,
      targeted_categories: category_ids,
      simulated_reach: simulatedReach,
      seeded_businesses_notified: targetedBizRes.rows.length
    });

    res.status(201).json({
      update: newUpdate,
      simulatedReach,
      seededNotifiedCount: targetedBizRes.rows.length
    });
  } catch (err: any) {
    console.error('Error creating regulatory update:', err);
    res.status(500).json({ error: 'Failed to publish regulatory update.' });
  }
});

// Acknowledge regulatory update (Client / Business Owner / Manager)
router.post('/:id/acknowledge', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const updateId = parseInt(req.params.id, 10);
  const clientId = req.user?.client_id;

  if (!clientId && req.user?.role !== 'CONSULTANT') {
    res.status(400).json({ error: 'User is not linked to any business.' });
    return;
  }

  const targetClientId = clientId || parseInt(req.body.client_id, 10);

  try {
    const updateRes = await query(`SELECT * FROM regulatory_updates WHERE id = $1`, [updateId]);
    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Regulatory update not found.' });
      return;
    }
    const update = updateRes.rows[0];

    const bizRes = await query(`SELECT business_name FROM businesses WHERE id = $1`, [targetClientId]);
    const businessName = bizRes.rows[0]?.business_name || 'Client';

    // Update acknowledgement row
    const updateAck = await query(`
      UPDATE regulatory_acknowledgements
      SET user_id = $3, acknowledged_at = NOW(), status = 'ACKNOWLEDGED'
      WHERE regulatory_update_id = $1 AND client_id = $2
      RETURNING *
    `, [updateId, targetClientId, req.user!.id]);

    if (updateAck.rows.length === 0) {
      await query(`
        INSERT INTO regulatory_acknowledgements (regulatory_update_id, client_id, user_id, acknowledged_at, status)
        VALUES ($1, $2, $3, NOW(), 'ACKNOWLEDGED')
      `, [updateId, targetClientId, req.user!.id]);
    }

    // Also notify consultants
    const consultants = await query(`SELECT id FROM users WHERE role = 'CONSULTANT'`);
    for (const c of consultants.rows) {
      await query(`
        INSERT INTO notifications (
          recipient_user_id, type, title, message, priority,
          related_entity_type, related_entity_id
        )
        VALUES ($1, 'INFORMATIONAL', 'Regulatory Update Acknowledged', $2, 'MEDIUM', 'REGULATORY_UPDATE', $3)
      `, [
        c.id,
        `${businessName} acknowledged regulatory update: "${update.title}".`,
        updateId.toString()
      ]);
    }

    // Audit log
    await logAudit(req.user!.id, 'ACKNOWLEDGE_REGULATORY_UPDATE', 'REGULATORY_UPDATE', updateId.toString(), {
      client_id: targetClientId,
      business_name: businessName
    });

    res.json({
      success: true,
      message: 'Regulatory update acknowledged successfully.'
    });
  } catch (err: any) {
    console.error('Error acknowledging regulatory update:', err);
    res.status(500).json({ error: 'Failed to acknowledge regulatory update.' });
  }
});

export default router;
