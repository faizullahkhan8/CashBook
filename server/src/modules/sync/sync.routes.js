import { Router } from 'express';
import { z } from 'zod';
import { processBootstrap, processSyncEvent } from './sync.service.js';

const router = Router();
const eventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  eventVersion: z.number().optional(),
  pharmacyId: z.string().min(1),
  branchId: z.string().min(1),
  occurredAt: z.string(),
  payload: z.record(z.any()).default({}),
});

router.post('/events', async (req, res, next) => {
  try {
    const event = eventSchema.parse(req.body);
    res.status(202).json({ ok: true, ...(await processSyncEvent(event)) });
  } catch (error) { next(error); }
});

router.post('/bootstrap', async (req, res, next) => {
  try {
    const data = z.object({ pharmacyId: z.string(), branchId: z.string() }).passthrough().parse(req.body);
    const dashboard = await processBootstrap(data);
    res.json({ ok: true, dashboard });
  } catch (error) { next(error); }
});

export default router;
