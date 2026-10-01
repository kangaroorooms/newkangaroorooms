import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { userRepository } from '../repositories';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { authRateLimiter } from '../middleware/security.middleware';
const router = Router();

/* ===========================
   ✅ ZOD SCHEMAS (INLINE)
   =========================== */
const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['TENANT', 'OWNER', 'tenant', 'owner']),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long'),
  city: z.string().optional()
});
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// ✅ CREATE SERVICE
const authService = new AuthService(userRepository);

// ✅ INJECT SERVICE INTO CONTROLLER
const authController = new AuthController(authService);

// Apply strict rate limiting
router.use(authRateLimiter);

// Register
router.post('/register', validateBody(RegisterSchema), (req, res, next) => authController.register(req, res, next));

// Login
router.post('/login', validateBody(LoginSchema), (req, res, next) => authController.login(req, res));

// Current user
router.get('/me', authMiddleware, (req, res, next) => authController.getCurrentUser(req as any, res));

// ── Email Verification ────────────────────────────────────────────────
// GET  /api/auth/verify-email?token=xxx  — Public (no auth required, user clicks link from email)
// POST /api/auth/resend-verification     — Authenticated (user must be logged in)
router.get('/verify-email', (req, res, next) => authController.verifyEmail(req, res));
router.post('/resend-verification', authMiddleware, (req, res, next) => authController.resendVerification(req as any, res));
export default router;