import axiosInstance from "./axios";
import {
  ApiResponse,
  AuthResponse,
  RegisterInput,
  LoginInput,
  User,
} from "../types/api.types";

export interface CheckPhoneResponse {
  exists: boolean;
  isTemp: boolean;
}

export const authApi = {
  // Register new user
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      data,
    );
    return response.data.data;
  },
  // Login user
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      data,
    );
    return response.data.data;
  },

  // ================================================================
  // PRE-VERIFICATION SIGNUP FLOW (NEW - PRODUCTION GRADE)
  // ================================================================

  // Step 1: Request signup verification (validates input, sends OTP)
  requestSignupVerification: async (
    data: RegisterInput,
  ): Promise<{
    requestId: string;
    expiresAt: number;
    email: string;
    message: string;
  }> => {
    const response = await axiosInstance.post<ApiResponse<any>>(
      "/auth/request-signup-verification",
      data,
    );
    return response.data.data;
  },

  // Step 2: Complete signup after OTP verification (creates user, returns JWT)
  completeSignup: async (payload: {
    requestId: string;
    email: string;
    otp: string;
  }): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/complete-signup",
      payload,
    );
    return response.data.data;
  },

  // ================================================================

  // Upgrade authenticated TENANT to OWNER
  upgradeToOwner: async (): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/users/upgrade-role",
    );
    return response.data.data;
  },
  // Request owner access with phone checking
  requestOwnerAccess: async (
    phone?: string,
  ): Promise<{
    success: boolean;
    action:
      | "SWITCH_TO_OWNER"
      | "UPGRADE_TO_OWNER"
      | "PHONE_REQUIRED"
      | "ALREADY_OWNER";
    data: {
      user?: User;
      token?: string;
      message?: string;
    };
  }> => {
    const response = await axiosInstance.post<{
      success: boolean;
      action:
        | "SWITCH_TO_OWNER"
        | "UPGRADE_TO_OWNER"
        | "PHONE_REQUIRED"
        | "ALREADY_OWNER";
      data: {
        user?: User;
        token?: string;
        message?: string;
      };
    }>("/users/owner-access", { phone });
    return response.data;
  },
  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get<ApiResponse<User>>("/auth/me");
    return response.data.data;
  },
  // Check if phone exists and if account is temp
  checkPhone: async (phone: string): Promise<CheckPhoneResponse> => {
    const response = await axiosInstance.post<ApiResponse<CheckPhoneResponse>>(
      "/auth/check-phone",
      { phone },
    );
    return response.data.data;
  },
  // Claim temp account with phone + email + password
  claimAccount: async (
    phone: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/claim-account",
      {
        phone,
        email,
        password,
      },
    );
    return response.data.data;
  },
  // Login with phone (for existing, non-temp accounts)
  loginPhone: async (phone: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/login-phone",
      { phone },
    );
    return response.data.data;
  },
  // Auto-login owner from property review link
  autoLoginByProperty: async (propertyId: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/auto-login-by-property",
      { propertyId },
    );
    return response.data.data;
  },
  // Request password reset via email
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
      "/auth/forgot-password",
      { email },
    );
    return response.data.data;
  },
  // Reset password with token
  resetPassword: async (
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
      "/auth/reset-password",
      {
        token,
        newPassword,
      },
    );
    return response.data.data;
  },
  // Validate reset token (check if valid before showing form)
  validateResetToken: async (
    token: string,
  ): Promise<{ valid: boolean; email?: string }> => {
    const response = await axiosInstance.post<
      ApiResponse<{ valid: boolean; email?: string }>
    >("/auth/validate-reset-token", { token });
    return response.data.data;
  },
};
