import { Router } from 'express';
import passport from 'passport';
import { generateToken } from '../utils/jwt';
import { logger } from '../utils/logger';
const router = Router();

/**
 * GOOGLE OAUTH ROUTES
 *
 * GET /api/auth/google
 * - Initiates Google OAuth flow
 * - Redirects user to Google login page
 *
 * GET /api/auth/google/callback
 * - Google redirects here after authentication
 * - Creates or logs in user
 * - Generates JWT token
 * - Redirects to frontend with token
 */

// ── Initiate Google OAuth ────────────────────────────────────────────
// User clicks "Continue with Google" → redirects to Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false // We use JWT, not sessions
}));

// ── Google OAuth Callback ────────────────────────────────────────────
// Google redirects here after user authenticates
router.get('/google/callback', passport.authenticate('google', {
  session: false,
  failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/login?error=google_auth_failed`
}), (req, res) => {
  try {
    const user = req.user as any;
    if (!user) {
      logger.error('No user returned from Google OAuth');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/login?error=auth_failed`);
    }

    // Generate JWT token (same as email/password login)
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Redirect to frontend with token
    // Frontend will extract token from URL and store it
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/google/callback?token=${token}`);
  } catch (error: any) {
    logger.error('Error in Google OAuth callback', {
      error: error.message,
      stack: error.stack
    });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/login?error=callback_failed`);
  }
});
export default router;