import { Router } from 'express';
import crypto from 'crypto';
import { getPool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

// List bills with filtering and computed payment stats
router.get('/', async (req, res) => {
  try {
    const { from, to, search } = req.query;
    const pool = getPool();

    let whereClause = 'WHERE b.deleted_at IS NULL';
    const params = [];

    if (from) {
      whereClause += ' AND b.posting_date >= ?';
      params.push(from);
    }
    if (to) {
      whereClause += ' AND b.posting_date <= ?';
      params.push(to);
    }
    if (search) {
      whereClause += ' AND (b.supplier_name LIKE ? OR b.supplier_bill_no LIKE ? OR b.voucher_no LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const query = `
      SELECT b.* 
      FROM bills b 
      ${whereClause} 
      ORDER BY b.posting_date DESC, b.id DESC
    `;
    const [bills] = await pool.query(query, params);

    // Fetch active payments
    const [payments] = await pool.query('SELECT * FROM payments WHERE deleted_at IS NULL ORDER BY payment_date ASC, id ASC');

    // Attach payments and calculate balances
    const enriched = bills.map((b) => {
      const linked = payments.filter((p) => p.bill_sync_id === b.sync_id);
      const paid = money(linked.reduce((s, p) => s + Number(p.amount || 0), 0));
      const excluded = b.category !== 'PAYABLE';
      const actual = Number(b.actual_amount || 0);
      const remaining = excluded ? 0 : money(Math.max(0, actual - paid));

      let paymentStatus = 'UNPAID';
      if (excluded) {
        paymentStatus = b.category;
      } else if (paid === 0) {
        paymentStatus = 'UNPAID';
      } else if (remaining > 0) {
        paymentStatus = 'PARTIAL';
      } else if (paid > actual) {
        paymentStatus = 'OVERPAID';
      } else {
        paymentStatus = 'COMPLETE';
      }

      return {
        ...b,
        total_bill_amount: Number(b.total_bill_amount || 0),
        tax_percent: Number(b.tax_percent || 0),
        tax_amount: Number(b.tax_amount || 0),
        actual_amount: actual,
        payments: linked.map((p) => ({
          ...p,
          amount: Number(p.amount || 0),
        })),
        paid_amount: paid,
        remaining_balance: remaining,
        payment_status: paymentStatus,
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching bills:', err);
    res.status(500).json({ error: err.message });
  }
});

// Distinct supplier names
router.get('/suppliers', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT DISTINCT supplier_name FROM bills WHERE deleted_at IS NULL AND supplier_name IS NOT NULL AND supplier_name != "" ORDER BY supplier_name ASC'
    );
    res.json(rows.map((r) => r.supplier_name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update a bill
router.post('/', async (req, res) => {
  try {
    const b = req.body;
    const total = money(b.total_bill_amount);
    const tax = Number(b.tax_percent) || 0;
    const taxAmount = money((total * tax) / 100);
    const actual = money(total - taxAmount);
    const syncId = b.sync_id || crypto.randomUUID();
    const pool = getPool();

    const [existing] = await pool.query('SELECT id FROM bills WHERE sync_id = ?', [syncId]);

    if (existing.length > 0) {
      await pool.query(
        `UPDATE bills SET 
          posting_date = ?, 
          bill_date = ?, 
          supplier_name = ?, 
          supplier_bill_no = ?, 
          voucher_no = ?, 
          total_bill_amount = ?, 
          tax_percent = ?, 
          tax_amount = ?, 
          actual_amount = ?, 
          category = ?, 
          remarks = ? 
        WHERE sync_id = ?`,
        [
          b.posting_date,
          b.bill_date,
          b.supplier_name,
          b.supplier_bill_no || '',
          b.voucher_no || '',
          total,
          tax,
          taxAmount,
          actual,
          b.category || 'PAYABLE',
          b.remarks || '',
          syncId,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO bills (
          sync_id, posting_date, bill_date, supplier_name, supplier_bill_no, 
          voucher_no, total_bill_amount, tax_percent, tax_amount, actual_amount, 
          category, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          syncId,
          b.posting_date,
          b.bill_date,
          b.supplier_name,
          b.supplier_bill_no || '',
          b.voucher_no || '',
          total,
          tax,
          taxAmount,
          actual,
          b.category || 'PAYABLE',
          b.remarks || '',
          req.user?.username || 'system',
        ]
      );
    }

    const [saved] = await pool.query('SELECT * FROM bills WHERE sync_id = ?', [syncId]);
    res.json(saved[0]);
  } catch (err) {
    console.error('Error saving bill:', err);
    res.status(500).json({ error: err.message });
  }
});

// Soft delete a bill
router.delete('/:syncId', async (req, res) => {
  try {
    const { syncId } = req.params;
    const pool = getPool();
    await pool.query('UPDATE bills SET deleted_at = CURRENT_TIMESTAMP WHERE sync_id = ?', [syncId]);
    res.json({ success: true, syncId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
