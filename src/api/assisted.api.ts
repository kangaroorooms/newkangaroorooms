import axios from './axios';
import { assertValidParam, assertValidParams } from '../utils/apiGuard';
import { PROPERTY_CONCIERGE_PRICE_PAISE } from '../shared/constants/pricing';

/**
 * Property Concierge API
 * 
 * IMPORTANT: This is completely separate from subscription APIs.
 * Property Concierge is a fixed-price (₹499) service, not a recurring subscription.
 * 
 * ✅ KEY DIFFERENCES FROM SUBSCRIPTION:
 * - Amount is ALWAYS ₹499 (49900 paise), never varies by city
 * - No upgrade to any subscription plan
 * - One-time payment, not recurring
 * - Creates Property Concierge request record, not subscription record
 * - Payment goes to service, not subscription activation
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CreateAssistedOrderRequest {
  /**
   * User's city - used for service localization, NOT price calculation
   */
  city: string;
}

export interface CreateAssistedOrderResponse {
  orderId: string;
  amount: number; // Always 49900 (₹499 in paise)
  currency: string; // Always 'INR'
  keyId: string; // Razorpay Key ID for frontend
}

export interface VerifyAssistedPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyAssistedPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    payment: any;
    subscription?: any; // Might not be present for Property Concierge
  };
}

export interface CreateAssistedRequestData {
  name: string;
  phone: string;
  city: string;
  budget?: number;
  /**
   * Razorpay payment ID from successful payment
   * IMPORTANT: We store actual payment ID, not frontend-calculated amount
   */
  paymentId: string;
  /**
   * Razorpay order ID - for audit trail
   */
  orderId: string;
}

export interface CreateAssistedRequestResponse {
  success: boolean;
  message: string;
  data?: {
    requestId?: string;
    [key: string]: any;
  };
}

// ============================================================================
// API METHODS
// ============================================================================

const ASSISTED_BASE = '/assisted';
const AMOUNT_PAISE = PROPERTY_CONCIERGE_PRICE_PAISE;

/**
 * Create Razorpay order for Property Concierge
 * 
 * ✅ KEY POINTS:
 * - Amount is ALWAYS ₹499 (49900 paise)
 * - No city-based pricing
 * - No subscription upgrade
 * - Fresh endpoint separate from subscription payment
 * 
 * @param data Request data with city for localization
 * @returns Order details including orderId and amount
 */
export const createAssistedOrder = async (
  data: CreateAssistedOrderRequest
): Promise<CreateAssistedOrderResponse> => {
  assertValidParam(data.city, 'city');

  const response = await axios.post(`${ASSISTED_BASE}/create-order`, {
    city: data.city,
    // Backend will automatically set:
    // - amount: 49900 (₹499)
    // - currency: 'INR'
    // - receipt: 'assist_<timestamp>'
  });

  const result = response.data.data;

  // ✅ SAFETY CHECK: Verify amount is correct
  if (result.amount !== AMOUNT_PAISE) {
    throw new Error(
      `Invalid amount returned: ₹${result.amount / 100}. Expected ₹499.`
    );
  }

  return result;
};

/**
 * Verify payment signature and process payment
 * 
 * ✅ KEY POINTS:
 * - Verifies Razorpay signature
 * - Separate from subscription verification
 * - Does NOT upgrade any subscription
 * 
 * @param data Payment verification data
 * @returns Verification result
 */
export const verifyAssistedPayment = async (
  data: VerifyAssistedPaymentRequest
): Promise<VerifyAssistedPaymentResponse> => {
  assertValidParams({
    razorpay_order_id: data.razorpay_order_id,
    razorpay_payment_id: data.razorpay_payment_id,
    razorpay_signature: data.razorpay_signature,
  });

  const response = await axios.post(`${ASSISTED_BASE}/verify-payment`, {
    razorpay_order_id: data.razorpay_order_id,
    razorpay_payment_id: data.razorpay_payment_id,
    razorpay_signature: data.razorpay_signature,
  });

  const result = response.data;

  return result;
};

/**
 * Create Property Concierge request after payment
 * 
 * ✅ KEY POINTS:
 * - Called ONLY after successful payment verification
 * - Receives actual paymentId from Razorpay
 * - No longer sends frontend-calculated paymentAmount
 * - Creates record in assisted_requests table, not subscription table
 * 
 * @param data Property Concierge request data
 * @returns Creation result
 */
export const createAssistedRequest = async (
  data: CreateAssistedRequestData
): Promise<CreateAssistedRequestResponse> => {
  assertValidParams({
    name: data.name,
    phone: data.phone,
    city: data.city,
    paymentId: data.paymentId,
    orderId: data.orderId,
  });

  const response = await axios.post(`${ASSISTED_BASE}/requests`, {
    name: data.name,
    phone: data.phone,
    city: data.city,
    budget: data.budget,
    paymentId: data.paymentId,
    orderId: data.orderId,
    // Backend will handle:
    // - Creating record with actual payment details
    // - Sending notification to agent
    // - NO subscription upgrade
  });

  const result = response.data;

  return result;
};

// ============================================================================
// EXPORT AS OBJECT (backward compatibility if needed)
// ============================================================================

export const assistedApi = {
  createOrder: createAssistedOrder,
  verifyPayment: verifyAssistedPayment,
  createRequest: createAssistedRequest,
};
