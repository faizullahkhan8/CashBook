import { Router } from 'express';
import crypto from 'crypto';
import { getPool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Add or update payment
router.post('/', async (req, res) => {
  try {
    const p = req.body;
    const syncId = p.sync_id || crypto.randomUUID();
    const amount = money(p.amount);
    const pool = getPool();

    const [existing] = await pool.query('SELECT id FROM payments WHERE sync_id = ?', [syncId]);

    if (existing.length > 0) {
      await pool.query(
        `UPDATE payments SET 
          bill_sync_id = ?, 
          payment_date = ?, 
          amount = ?, 
          payment_mode = ?, 
          reference_no = ?, 
          remarks = ? 
        WHERE sync_id = ?`,
        [p.bill_sync_id, p.payment_date, amount, p.payment_mode || '', p.reference_no || '', p.remarks || '', syncId]
      );
    } else {
      await pool.query(
        `INSERT INTO payments (
          sync_id, bill_sync_id, payment_date, amount, 
          payment_mode, reference_no, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          syncId,
          p.bill_sync_id,
          p.payment_date,
          amount,
          p.payment_mode || 'COUNTER_CASH',
          p.reference_no || '',
          p.remarks || '',
          req.user?.username || 'system',
        ]
      );
    }

    const [saved] = await pool.query('SELECT * FROM payments WHERE sync_id = ?', [syncId]);
    res.json(saved[0]);
  } catch (err) {
    console.error('Error saving payment:', err);
    res.status(500).json({ error: err.message });
  }
});

// Soft delete payment
router.delete('/:syncId', async (req, res) => {
  try {
    const { syncId } = req.params;
    const pool = getPool();
    await pool.query('UPDATE payments SET deleted_at = CURRENT_TIMESTAMP WHERE sync_id = ?', [syncId]);
    res.json({ success: true, syncId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
