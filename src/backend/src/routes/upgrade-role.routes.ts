import { Router } from 'express';
import { upgradeRole } from '../controllers/UpgradeRoleController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/users/upgrade-role
 * Upgrades authenticated TENANT to OWNER role.
 */
router.post('/upgrade-role', authenticate, upgradeRole);

export default router;