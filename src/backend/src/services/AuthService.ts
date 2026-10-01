import bcrypt from "bcryptjs";
import { PrismaUserRepository } from "../repositories/PrismaUserRepository";
import { generateToken } from "../utils/jwt";
import { Role } from "@prisma/client";
import { EmailVerificationService } from "./EmailVerificationService";
import { logger } from "../utils/logger";
import { ValidationError, DuplicateError, ForbiddenError } from "../errors/AppErrors";
export class AuthService {
  constructor(private userRepository: PrismaUserRepository) {}
  async register(email: string, password: string, name: string, role: Role, phone?: string | null) {
    // Normalize email
    email = email.toLowerCase().trim();

    // Validate role - only TENANT and OWNER can sign up
    if (role !== Role.TENANT && role !== Role.OWNER) {
      throw new ForbiddenError("Only TENANT and OWNER roles can sign up.");
    }

    // Enforce phone is required
    if (!phone || phone.trim() === "") {
      throw new ValidationError("Phone number is required");
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new DuplicateError("User already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      role,
      phone: phone.trim(),
      city: null,
      googleId: null,
      phoneVerified: false,
      phoneVerifiedAt: null,
      isActive: true,
      emailVerified: false,
      emailVerifiedAt: null,
      emailVerifyToken: null,
      emailVerifyExpiry: null
    });

    // Send verification email — NEVER crash registration if this fails
    try {
      await EmailVerificationService.generateAndSendVerification(user.id, user.email);
    } catch (err: any) {
      logger.error("Failed to send verification email during registration", {
        userId: user.id,
        error: err.message
      });
      // Registration still succeeds — user can resend later
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Return user without password
    const {
      password: _,
      ...userWithoutPassword
    } = user;
    return {
      user: userWithoutPassword,
      token
    };
  }
  async login(email: string, password: string) {
    // FIX 5: Normalize email before lookup
    email = email.toLowerCase().trim();

    // Fetch user from database
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // FIX 2: Block disabled users from logging in
    if (!user.isActive) {
      throw new ForbiddenError("Account has been disabled. Please contact support.");
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Return user without password (SOFT MODE: include emailVerified status)
    const {
      password: _,
      ...userWithoutPassword
    } = user;
    return {
      user: userWithoutPassword,
      token
    };
  }
  async getUserById(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;
    const {
      password: _,
      ...userWithoutPassword
    } = user;
    return userWithoutPassword;
  }
}