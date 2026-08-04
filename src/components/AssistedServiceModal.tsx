import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Phone,
  User,
  MapPin,
  Wallet,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { showToast } from "../store/slices/ui.slice";
import {
  createAssistedOrder,
  verifyAssistedPayment,
  createAssistedRequest,
} from "../api/assisted.api";
import { CitySelector } from "./CitySelector";
import {
  PROPERTY_CONCIERGE_PRICE_PAISE,
  PROPERTY_CONCIERGE_DESCRIPTION,
} from "../shared/constants/pricing";
import {
  isCapacitorNativeApp,
  openRazorpayCheckout,
} from "../utils/razorpayGateway";

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface AssistedServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormStep = "form" | "success";

interface FormData {
  name: string;
  phone: string;
  city: string;
  budget: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  city?: string;
  budget?: string;
}

const SUPPORT_PHONE_NUMBER = "918209595522";
const AMOUNT = PROPERTY_CONCIERGE_PRICE_PAISE;

const sanitizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 10);

export function AssistedServiceModal({
  isOpen,
  onClose,
}: AssistedServiceModalProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  const { user, authStatus } = useAppSelector((state) => state.auth);
  const { loading: subscriptionLoading } = useAppSelector(
    (state) => state.subscription,
  );

  const [step, setStep] = useState<FormStep>("form");
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: user?.name || "",
    phone: sanitizePhone(user?.phone || ""),
    city: "",
    budget: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Load Razorpay script
  useEffect(() => {
    if (isCapacitorNativeApp()) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => setRazorpayLoaded(true);

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Handle scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const htmlElement = document.documentElement;
    const originalOverflow = htmlElement.style.overflow;
    const originalPaddingRight = htmlElement.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    htmlElement.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      htmlElement.style.paddingRight = scrollbarWidth + "px";
    }

    setTimeout(() => firstInputRef.current?.focus(), 100);

    return () => {
      htmlElement.style.overflow = originalOverflow || "";
      htmlElement.style.paddingRight = originalPaddingRight || "";
    };
  }, [isOpen]);

  // Handle backdrop click
  useEffect(() => {
    if (!isOpen) return;

    const handleBackdropClick = (e: MouseEvent) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    };

    window.addEventListener("mousedown", handleBackdropClick);
    return () => window.removeEventListener("mousedown", handleBackdropClick);
  }, [isOpen, onClose]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Please enter your full name";
    }

    if (!formData.phone || formData.phone.length !== 10) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.city) {
      newErrors.city = "Please select a city";
    }

    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = "Please enter a valid budget amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "phone") {
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizePhone(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    if (authStatus !== "AUTHENTICATED") {
      dispatch(
        showToast({
          message: "Please log in to request assistance",
          type: "error",
        }),
      );
      return;
    }

    if (!isCapacitorNativeApp() && (!razorpayLoaded || !window.Razorpay)) {
      dispatch(
        showToast({
          message: "Payment system is loading. Please try again in a moment.",
          type: "error",
        }),
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create order - ✅ NEW: Using dedicated assisted service API
      const orderData = await createAssistedOrder({
        city: formData.city,
      });

      // Step 2: Open Razorpay with proper async handler
      const handlePaymentResponse = async (response: any) => {
        try {
          const verifyResult = await verifyAssistedPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (!verifyResult.success) {
            throw new Error(
              verifyResult.message || "Payment verification failed",
            );
          }

          const requestResult = await createAssistedRequest({
            name: formData.name,
            phone: formData.phone,
            city: formData.city,
            budget: formData.budget ? Number(formData.budget) : undefined,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
          });

          if (!requestResult.success) {
            throw new Error(
              requestResult.message || "Failed to create service request",
            );
          }

          setStep("success");

          setIsProcessing(false);

          dispatch(
            showToast({
              message:
                "Property Concierge activated! Your expert will contact you within 24 hours.",
              type: "success",
            }),
          );

          try {
            const { fetchCurrentSubscription } = await import(
              "../store/slices/subscription.slice"
            );

            dispatch(fetchCurrentSubscription());
          } catch {}
        } catch (error: any) {
          dispatch(
            showToast({
              message: error.message || "Error processing your request",
              type: "error",
            }),
          );

          setIsProcessing(false);
        }
      };
      const handlePaymentCancel = () => {
        setIsProcessing(false);

        dispatch(
          showToast({
            message: "Payment cancelled. Your request was not submitted.",
            type: "error",
          }),
        );
      };
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: AMOUNT,
        currency: "INR",
        name: "Homilivo",
        description: PROPERTY_CONCIERGE_DESCRIPTION,
        order_id: orderData.orderId,

        prefill: {
          name: user?.name || formData.name,
          email: user?.email || "",
          contact: formData.phone,
        },
        theme: {
          color: "#1E293B",
        },
      };

      if (isCapacitorNativeApp()) {
        const response = await openRazorpayCheckout(
          options,
          handlePaymentResponse,
          handlePaymentCancel,
        );

        if (response) {
          await handlePaymentResponse(response);
        }
      } else {
        const razorpay = new window.Razorpay({
          ...options,
          handler: handlePaymentResponse,
          modal: {
            ondismiss: handlePaymentCancel,
          },
        });

        razorpay.open();
      }
    } catch (error: any) {
      setIsProcessing(false);
      dispatch(
        showToast({
          message:
            error.response?.data?.message ||
            error.message ||
            "Failed to initiate payment",
          type: "error",
        }),
      );
    }
  };

  const handleClose = () => {
    setStep("form");
    setFormData({
      name: user?.name || "",
      phone: sanitizePhone(user?.phone || ""),
      city: "",
      budget: "",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="relative mx-4 w-full max-w-md rounded-[24px] border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-navy dark:text-white font-playfair">
            Request Property Concierge
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {step === "form" ? (
            <>
              {/* Info Box */}
              <div className="mb-6 rounded-[16px] bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/30 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    ₹499 service fee
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Our experts will help you find the perfect property and
                    negotiate the best deal.
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-navy dark:text-white mb-1.5">
                    <User className="h-4 w-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    disabled={isProcessing}
                    autoComplete="name"
                    className="w-full px-4 py-3 rounded-[12px] border border-slate-300/80 dark:border-slate-600/80 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[48px]"
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-navy dark:text-white mb-1.5">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    disabled={isProcessing}
                    autoComplete="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    className="w-full px-4 py-3 rounded-[12px] border border-slate-300/80 dark:border-slate-600/80 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[48px]"
                  />
                  {errors.phone && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* City */}
                <CitySelector
                  value={formData.city}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, city: value }))
                  }
                  disabled={isProcessing}
                  error={errors.city}
                  placeholder="Search city..."
                  showPopular={true}
                />

                {/* Budget */}
                <div>
                  <label className="block text-sm font-semibold text-navy dark:text-white mb-1.5">
                    <Wallet className="h-4 w-4 inline mr-2" />
                    Monthly Budget{" "}
                    <span className="text-slate-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder="e.g., 15000"
                    disabled={isProcessing}
                    inputMode="numeric"
                    className="w-full px-4 py-3 rounded-[12px] border border-slate-300/80 dark:border-slate-600/80 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[48px]"
                  />
                  {errors.budget && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.budget}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Helps us find properties within your range
                  </p>
                </div>
              </div>

              {/* Price Summary */}
              <div className="mt-6 rounded-[16px] bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Service Fee
                  </span>
                  <span className="font-semibold text-navy dark:text-white">
                    ₹499
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  One-Time Service Fee
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing || subscriptionLoading}
                className="w-full mt-6 rounded-[14px] bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 active:scale-95 dark:from-amber-500 dark:to-orange-500 dark:hover:from-amber-600 dark:hover:to-orange-600 px-6 py-3.5 font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px]"
              >
                {isProcessing || subscriptionLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    Proceed to Payment
                  </>
                )}
              </button>

              {/* Cancel Button */}
              <button
                onClick={handleClose}
                disabled={isProcessing || subscriptionLoading}
                className="w-full mt-2 rounded-[14px] border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 px-6 py-3.5 font-medium text-slate-700 dark:text-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              >
                Cancel
              </button>
            </>
          ) : (
            // Success Step
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-2xl font-bold text-navy dark:text-white font-playfair mb-2">
                Welcome to Property Concierge!
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                Payment successful. Your dedicated property expert will contact
                you within 24 hours.
              </p>

              {/* Request ID */}
              {/* <div className="mb-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Request ID
                </p>
                <p className="text-sm font-mono font-semibold text-navy dark:text-white">
                  PC-{Date.now().toString().slice(-8)}
                </p>
              </div> */}

              {/* Timeline */}
              <div className="w-full rounded-[16px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/30 p-4 mb-6 text-left">
                <p className="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  What happens next:
                </p>
                <ul className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold">
                        Expert contacts you within 24 hours
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        Via phone to understand your requirements
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold">
                        Curated property shortlist within 48 hours
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        Properties matching your preferences
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold">
                        Visit scheduling at your convenience
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        Expert coordinates with property owners
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                      4
                    </div>
                    <div>
                      <p className="font-semibold">
                        Negotiation & paperwork assistance
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        Until you finalize your rental
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  handleClose();
                  navigate("/tenant/dashboard");
                }}
                className="w-full rounded-[14px] bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 active:scale-95 dark:from-amber-500 dark:to-orange-500 dark:hover:from-amber-600 dark:hover:to-orange-600 px-6 py-3.5 font-semibold text-white shadow-lg hover:shadow-xl transition-all min-h-[48px]"
              >
                View My Service
              </button>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-3">
                You can track the progress of your Property Concierge request
                anytime from your dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
