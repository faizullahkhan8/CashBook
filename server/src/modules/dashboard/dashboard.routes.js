import { Router } from 'express';
import { getDashboardSnapshot } from './dashboard.service.js';
import { env } from '../../config/env.js';

const router = Router();
router.get('/', async (req, res, next) => {
  try {
    const scope = {
      pharmacyId: String(req.query.pharmacyId || env.defaultPharmacyId),
      branchId: String(req.query.branchId || env.defaultBranchId),
    };
    res.json({ data: await getDashboardSnapshot(scope) });
  } catch (error) { next(error); }
});
export default router;
