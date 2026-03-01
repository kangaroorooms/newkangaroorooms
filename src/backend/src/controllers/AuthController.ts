import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AuthService } from '../services/AuthService';
import { EmailVerificationService } from '../services/EmailVerificationService';
import { Role } from '@prisma/client';
export class AuthController {
  constructor(private authService: AuthService) {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.resendVerification = this.resendVerification.bind(this);
  }

  // =======================
  // GET CURRENT USER
  // =======================
  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized'
        });
      }
      const user = await this.authService.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      return res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch current user'
      });
    }
  }

  // =======================
  // REGISTER
  // =======================
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        email,
        password,
        name,
        role,
        phone
      } = req.body;
      if (!email || !password || !name || !role) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, name, and role are required'
        });
      }
      if (!phone || String(phone).trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }
      const roleMap: Record<string, Role> = {
        tenant: Role.TENANT,
        owner: Role.OWNER,
        agent: Role.AGENT,
        admin: Role.ADMIN
      };
      const normalizedRole = String(role).toLowerCase();
      if (!roleMap[normalizedRole]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be tenant or owner'
        });
      }
      const result = await this.authService.register(email, password, name, roleMap[normalizedRole], String(phone).trim());
      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      if (error.message === 'User already registered') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      if (error.message === 'Phone number is required') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // =======================
  // LOGIN
  // =======================
  async login(req: Request, res: Response) {
    try {
      const {
        email,
        password,
        portal = 'USER'
      } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      const result = await this.authService.login(email, password);

      // ── Portal enforcement ───────────────────────────────────────────
      // USER portal: block ADMIN accounts (must use /admin/login)
      // ADMIN portal: block non-ADMIN accounts
      if (portal !== 'ADMIN' && result.user.role === 'ADMIN') {
        return res.status(403).json({
          success: false,
          code: 'ADMIN_PORTAL_REQUIRED',
          message: 'Admin accounts must login from the admin portal'
        });
      }
      if (portal === 'ADMIN' && result.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          code: 'ADMIN_ONLY',
          message: 'This portal is for admin accounts only'
        });
      }
      // ────────────────────────────────────────────────────────────────

      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  // =======================
  // VERIFY EMAIL
  // =======================
  async verifyEmail(req: Request, res: Response) {
    try {
      const {
        token
      } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }
      const result = await EmailVerificationService.verifyEmail(token);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
      return res.json({
        success: true,
        message: result.message,
        data: {
          email: result.email
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Email verification failed'
      });
    }
  }

  // =======================
  // RESEND VERIFICATION
  // =======================
  async resendVerification(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      const result = await EmailVerificationService.resendVerification(userId);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
      return res.json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to resend verification email'
      });
    }
  }
}