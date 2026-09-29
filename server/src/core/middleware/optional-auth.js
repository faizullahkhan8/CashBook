import { env } from '../../config/env.js';

export function optionalAuth(req, res, next) {
  if (!env.authEnabled) return next();
  return res.status(501).json({ message: 'Authentication is configured but not implemented yet.' });
}
