import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import { getPrismaClient } from '../utils/prisma';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
const prisma = getPrismaClient();

/**
 * GOOGLE OAUTH CONFIGURATION
 *
 * Strategy: Find or create user by email (email is primary identity).
 *
 * Flow:
 * 1. User clicks "Continue with Google"
 * 2. Redirected to Google for authentication
 * 3. Google redirects back with profile data
 * 4. We find or create user by email
 * 5. Issue JWT token (same as email/password login)
 *
 * Security:
 * - Email is primary identity (prevents duplicate accounts)
 * - If user exists with email, update googleId and login
 * - If user doesn't exist, create new account with googleId
 * - Password set to random secure value for OAuth users
 */

passport.use(new GoogleStrategy({
  clientID: env.GOOGLE_CLIENT_ID as string,
  clientSecret: env.GOOGLE_CLIENT_SECRET as string,
  callbackURL: env.GOOGLE_CALLBACK_URL as string,
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Extract email and Google ID from profile
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;
    const name = profile.displayName || 'Google User';
    if (!email) {
      return done(new Error('No email provided by Google'), undefined);
    }

    // Find existing user by email (email is primary identity)
    let user = await prisma.user.findUnique({
      where: {
        email
      }
    });
    if (user) {
      // FIX 2b: Block disabled users from Google OAuth login
      if (!user.isActive) {
        return done(new Error('Account has been disabled. Please contact support.'), undefined);
      }

      // User exists - update googleId if not set
      if (!user.googleId) {
        // Link Google account + auto-verify email (Google already verified it)
        user = await prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            googleId,
            emailVerified: true,
            emailVerifiedAt: user.emailVerified ? undefined : new Date(),
            emailVerifyToken: null,
            emailVerifyExpiry: null
          }
        });
        logger.info('Updated existing user with Google ID + email verified', {
          userId: user.id,
          email
        });
      } else {
        logger.info('Existing Google user logged in', {
          userId: user.id,
          email
        });
      }
    } else {
      // User doesn't exist - create new account
      // Generate random password (OAuth users don't need it)
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-16) + Date.now().toString(36), 10);
      // Google OAuth users are auto-verified (Google confirmed the email)
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
          password: randomPassword,
          role: 'TENANT',
          isActive: true,
          emailVerified: true,
          emailVerifiedAt: new Date()
        }
      });
      logger.info('Created new user via Google OAuth (email auto-verified)', {
        userId: user.id,
        email
      });
    }

    // Return user (passport will attach to req.user)
    return done(null, user);
  } catch (error: any) {
    logger.error('Google OAuth error', {
      error: error.message,
      stack: error.stack
    });
    return done(error, undefined);
  }
}));

// Serialize user for session (not used in JWT strategy, but required by passport)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session (not used in JWT strategy, but required by passport)
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
export default passport;