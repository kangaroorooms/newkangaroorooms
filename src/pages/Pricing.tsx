import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Check,
  X,
  Crown,
  MapPin,
  Shield,
  Sparkles,
  Zap,
  ChevronRight,
  Star,
  BadgeCheck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchPricing,
  fetchCurrentSubscription,
  fetchVisibility,
} from "../store/slices/subscription.slice";
import { showToast } from "../store/slices/ui.slice";
import {
  createOrder,
  verifyPayment,
  subscriptionApi,
} from "../api/subscription.api";
import { openRazorpayCheckout, isCapacitorNativeApp } from "../utils/razorpayGateway";
import { PlanName } from "../types/subscription.types";
import { AssistedServiceSection } from "../components/AssistedServiceSection";
import SearchableSelectInput from "../components/SearchableSelectInput";

const normalizeCityValue = (cityName: string) => cityName.trim().toLowerCase();
// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Pricing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const urlCity = searchParams.get("city");
  const returnTo = searchParams.get("returnTo");
  const intent = searchParams.get("intent");
  const roomId = searchParams.get("roomId");

  // Helper: Validate return URL is safe (internal route only)
  const isValidReturnUrl = (url: string | null): url is string => {
    if (!url) return false;
    // Only allow internal routes starting with /
    return typeof url === "string" && url.startsWith("/") && !url.includes("://");
  };

  const [selectedCity, setSelectedCity] = useState(() => {
    if (
      urlCity &&
      urlCity !== "undefined" &&
      urlCity !== "null" &&
      urlCity.trim() !== ""
    ) {
      return normalizeCityValue(urlCity);
    }
    return "bangalore";
  });

  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const {
    pricing,
    current: currentSubscription,
    subscriptions,
    loading,
  } = useAppSelector((state) => state.subscription);
  const { cities } = useAppSelector((state) => state.metadata);
  const { user, authStatus } = useAppSelector((state) => state.auth);
  // ✅ Cities are already loaded globally at App.tsx initialization
  // No need for duplicate loading here
  // Load pricing when city changes
  useEffect(() => {
    if (
      selectedCity &&
      selectedCity !== "undefined" &&
      selectedCity !== "null" &&
      selectedCity.trim() !== ""
    ) {
      dispatch(fetchPricing(selectedCity));
    }
  }, [dispatch, selectedCity]);

  useEffect(() => {
    if (authStatus === "AUTHENTICATED") {
      dispatch(fetchCurrentSubscription());
    }
  }, [dispatch, authStatus]);
  useEffect(() => {
    if (
      !selectedCity ||
      selectedCity === "undefined" ||
      selectedCity === "null" ||
      selectedCity.trim() === ""
    ) {
      return;
    }
    void subscriptionApi
      .trackConversionEvent({
        type: "PLAN_VIEW",
        city: selectedCity,
        source: "pricing_page",
      })
      .catch(() => undefined);
  }, [selectedCity]);
  // Load Razorpay script only in browser/web mode
  useEffect(() => {
    if (isCapacitorNativeApp()) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUpgrade = async (plan: PlanName, price: number) => {
    if (authStatus !== "AUTHENTICATED") {
      const redirectPath = encodeURIComponent(`/pricing?city=${selectedCity}`);
      navigate(`/auth/login?redirect=${redirectPath}`);
      return;
    }

    if (plan === "FREE") return;

    if (!selectedCity || selectedCity === "undefined") {
      dispatch(
        showToast({
          message: "Please select a valid city",
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
    void subscriptionApi
      .trackConversionEvent({
        type: "PLAN_PURCHASE_CLICK",
        city: selectedCity,
        plan,
        source: "pricing_page",
      })
      .catch(() => undefined);
    setProcessingPlan(plan);

    try {
      const orderData = await createOrder({
        plan,
        city: selectedCity,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Homilivo",
        description: `${plan} Plan - ${selectedCity}`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#1E293B",
        },
      };

      const handlePaymentResponse = async (response: any) => {
        try {
          const verifyResult = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (!verifyResult.success) {
            throw new Error(
              verifyResult.message || "Payment verification failed",
            );
          }

          dispatch(
            showToast({
              message: `Successfully upgraded to ${plan} plan!`,
              type: "success",
            }),
          );

          // ✅ PRODUCTION-GRADE FIX: Deterministic async orchestration
          // Verify subscription state actually updated before returning
          try {
            const subscriptionResult = await dispatch(
              fetchCurrentSubscription()
            ).unwrap();

            // Verify subscription state changed
            if (!subscriptionResult?.plan || subscriptionResult.plan === "FREE") {
              throw new Error("Subscription update failed - no active plan");
            }

            // If returning from unlock contact flow, refresh visibility/quota
            if (intent === "unlock_contact" && roomId && selectedCity) {
              await dispatch(
                fetchVisibility({ propertyId: roomId, city: selectedCity })
              ).unwrap();
            }

            // Navigate immediately - all state confirmed updated
            if (isValidReturnUrl(returnTo)) {
              // Add marker for RoomDetails to trigger fresh visibility fetch
              const separator = returnTo.includes("?") ? "&" : "?";
              navigate(`${returnTo}${separator}upgraded=true`);
            }
          } catch {
            // Subscription is already paid server-side, safe to navigate
            // Show warning so user refreshes if needed
            dispatch(
              showToast({
                message:
                  "Subscription activated. Returning to property...",
                type: "success",
              }),
            );
            if (isValidReturnUrl(returnTo)) {
              // Still add upgraded marker for fresh visibility refresh
              const separator = returnTo.includes("?") ? "&" : "?";
              navigate(`${returnTo}${separator}upgraded=true`);
            }
          }
        } catch (error: any) {
          dispatch(
            showToast({
              message: error.message || "Payment verification failed",
              type: "error",
            }),
          );
        } finally {
          setProcessingPlan(null);
        }
      };

      const handlePaymentCancel = () => {
        setProcessingPlan(null);
        dispatch(
          showToast({
            message: "Payment cancelled",
            type: "error",
          }),
        );
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
      setProcessingPlan(null);
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

  const isCurrentPlan = (plan: string) => {
    if (subscriptions.length > 0) {
      if (plan === "FREE") {
        return !subscriptions.some(
          (sub: any) => sub.city?.toLowerCase() === selectedCity?.toLowerCase(),
        );
      }

      return subscriptions.some(
        (sub: any) =>
          sub.plan === plan &&
          sub.city?.toLowerCase() === selectedCity?.toLowerCase(),
      );
    }

    if (!currentSubscription) return plan === "FREE";
    if (plan === "FREE") return currentSubscription.plan === "FREE";

    return (
      currentSubscription.plan === plan &&
      currentSubscription.city === selectedCity
    );
  };

  const getPlanBadge = (planName: string) => {
    if (planName === "FREE") {
      return {
        text: "Starter",
        icon: Sparkles,
        chip: "bg-slate-100/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600/70",
      };
    }

    if (planName === "GOLD") {
      return {
        text: "Most Popular",
        icon: Zap,
        chip: "bg-[rgba(212,175,55,0.12)] dark:bg-[rgba(212,175,55,0.16)] text-[rgba(170,120,0,1)] dark:text-[rgba(244,211,94,1)] border border-[rgba(212,175,55,0.28)]",
      };
    }

    if (planName === "PLATINUM") {
      return {
        text: "Elite Access",
        icon: Crown,
        chip: "bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-700/50",
      };
    }

    return null;
  };

  const getPlanStyles = (planName: string, isCurrent: boolean) => {
    const isGold = planName === "GOLD";
    const isPlatinum = planName === "PLATINUM";

    return {
      wrapper: isGold
        ? "border-[rgba(212,175,55,0.35)] dark:border-[rgba(212,175,55,0.4)] shadow-[0_20px_80px_rgba(212,175,55,0.12)] lg:-translate-y-3"
        : isPlatinum
        ? "border-purple-200/70 dark:border-purple-800/50 shadow-[0_18px_60px_rgba(88,28,135,0.12)]"
        : "border-slate-200/80 dark:border-slate-700/80 shadow-[0_10px_40px_rgba(15,23,42,0.06)]",

      ring: isCurrent
        ? "ring-2 ring-emerald-400/40"
        : isGold
        ? "ring-1 ring-[rgba(212,175,55,0.28)]"
        : "",

      priceAccent: isGold
        ? "text-[rgba(170,120,0,1)] dark:text-[rgba(244,211,94,1)]"
        : isPlatinum
        ? "text-purple-700 dark:text-purple-300"
        : "text-navy dark:text-white",

      iconAccent: isGold
        ? "text-[rgba(212,175,55,1)]"
        : isPlatinum
        ? "text-purple-500 dark:text-purple-400"
        : "text-slate-700 dark:text-slate-200",

      button: isCurrent
        ? "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
        : isGold
        ? "bg-[linear-gradient(135deg,rgba(212,175,55,1),rgba(184,134,11,1))] text-white hover:scale-[1.01] shadow-[0_14px_30px_rgba(212,175,55,0.25)]"
        : isPlatinum
        ? "bg-[linear-gradient(135deg,#7c3aed,#5b21b6)] text-white hover:scale-[1.01] shadow-[0_14px_30px_rgba(124,58,237,0.24)]"
        : "bg-navy dark:bg-slate-200 text-white dark:text-navy hover:scale-[1.01] shadow-[0_12px_26px_rgba(15,23,42,0.18)]",
    };
  };

  const getMobilePlanOrderClass = (planName: PlanName) => {
    if (planName === "GOLD") return "order-1 sm:order-none";
    if (planName === "PLATINUM") return "order-2 sm:order-none";
    return "order-3 sm:order-none";
  };

  const cityName =
    cities.find((c) => c.id === selectedCity)?.name || selectedCity;
  interface PlanFeature {
    text: string;
    available: boolean;
  }

  interface PricingPlan {
    plan: PlanName;
    features?: string[];
  }

  const getPlanFeatures = (plan: PricingPlan): PlanFeature[] => {
    if (Array.isArray(plan.features) && plan.features.length > 0) {
      return plan.features.map((text) => ({ text, available: true }));
    }

    switch (plan.plan) {
      case "FREE":
        return [
          { text: "Unlimited property views", available: true },
          { text: "5 owner contact details", available: true },
          { text: "Exact map location", available: false },
        ];

      case "GOLD":
        return [
          { text: "Unlimited property views", available: true },
          { text: "25 owner contact details (city)", available: true },
          { text: "Exact map location", available: true },
        ];

      case "PLATINUM":
        return [
          { text: "Unlimited owner contact details", available: true },
          { text: "Exact map location", available: true },
          { text: "Call support", available: true },
        ];

      default:
        return [];
    }
  };
  return (
    <div className="relative min-h-screen overflow-hidden bg-cream dark:bg-slate-950 transition-colors duration-300">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(212,175,55,0.08)] blur-3xl dark:bg-[rgba(212,175,55,0.06)]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-purple-200/20 blur-3xl dark:bg-purple-900/10" />
        <div className="absolute top-1/3 left-0 h-72 w-72 rounded-full bg-slate-200/30 blur-3xl dark:bg-slate-800/30" />
      </div>

      <section className="relative py-3 md:py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-3 sm:space-y-7 lg:space-y-8">
              {/* ASSISTED SERVICE SECTION */}
                <AssistedServiceSection />
            {/* HERO */}
            <section className="mb-4 sm:mb-14">
              <div className="relative rounded-[22px] border border-white/50 dark:border-white/10 bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:rounded-[28px]">
                <div className="absolute inset-0 overflow-hidden rounded-[22px] sm:rounded-[28px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.08),transparent_28%)]" />
                </div>
                <div className="relative grid grid-cols-1 gap-3 px-3 py-6 sm:gap-4 sm:px-8 sm:py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-8 lg:px-10 lg:py-12">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(212,175,55,0.25)] bg-[rgba(212,175,55,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(170,120,0,1)] dark:text-[rgba(244,211,94,1)] sm:mb-4 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs sm:tracking-[0.18em]">
                      <Star className="h-3.5 w-3.5" />
                      Premium Access Plans
                    </div>

                    <h1 className="max-w-3xl text-[24px] font-bold leading-[1.08] text-navy dark:text-white sm:text-4xl sm:leading-tight lg:text-5xl font-playfair">
                      Unlock Better Property Discovery
                    </h1>

                    <p className="mt-2 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-400 sm:mt-4 sm:text-base sm:leading-7">
                      Choose a plan designed for serious renters. Get
                      faster access to verified listings, owner details, and
                      premium discovery tools in{" "}
                      <span className="font-semibold text-navy dark:text-white">
                        {cityName}
                      </span>
                      .
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-3">
                      <SearchableSelectInput
                        id="city-selector"
                        value={selectedCity}
                        onChange={setSelectedCity}
                        options={cities.map((city) => ({
                          label: city.name,
                          value: city.id,
                        }))}
                        placeholder="Search city..."
                        emptyText="No cities found"
                        leadingIcon={
                          <MapPin className="h-4 w-4 text-[rgba(212,175,55,1)]" />
                        }
                        className="w-full min-w-0 sm:w-auto sm:min-w-[256px]"
                        inputClassName="rounded-2xl border border-slate-200/80 bg-white/90 px-3.5 py-2.5 text-sm font-semibold text-navy shadow-sm dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-white sm:px-4 sm:py-3"
                        dropdownClassName="max-h-[220px]"
                        showChevron={true}
                      />

                      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/90 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-400 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                        <BadgeCheck className="h-4 w-4" />
                        Secure Checkout
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-3 sm:gap-4 lg:grid-cols-1">
                    {[
                      {
                        icon: Shield,
                        title: "Verified & Secure",
                        mobileTitle: "Verified",
                        desc: "Safe checkout and verified access to premium features.",
                      },
                      {
                        icon: Zap,
                        title: "Instant Upgrade",
                        mobileTitle: "Instant Upgrade",
                        desc: "Your plan gets activated right after successful payment.",
                      },
                      {
                        icon: Crown,
                        title: "Premium Experience",
                        mobileTitle: "Premium Access",
                        desc: "Access advanced property details and direct owner contact.",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white/85 px-2.5 py-1.5 text-xs font-semibold text-navy backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-white sm:block sm:rounded-2xl sm:p-4 sm:text-sm"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/80 sm:mb-3 sm:h-11 sm:w-11 sm:rounded-xl">
                          <item.icon className="h-3.5 w-3.5 text-navy dark:text-white sm:h-5 sm:w-5" />
                        </div>
                        <h3 className="text-xs font-semibold text-navy dark:text-white sm:text-sm">
                          <span className="sm:hidden">{item.mobileTitle}</span>
                          <span className="hidden sm:inline">{item.title}</span>
                        </h3>
                        <p className="mt-1 hidden text-xs leading-6 text-slate-600 dark:text-slate-400 sm:block">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* LOADING */}
            {loading && !pricing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-[28px] border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/70 p-6 sm:p-7 animate-pulse"
                  >
                    <div className="mb-4 h-6 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mb-6 h-12 w-36 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-3">
                      <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="mt-8 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            ) : Array.isArray(pricing) && pricing.length > 0 ? (
              <>
                {/* PRICING CARDS */}
                <section className="mb-4 sm:mb-12">
                  <div className="grid grid-cols-1 gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6 items-stretch">
                    {pricing.map((plan) => {
                      const planName = plan.plan;
                      const isCurrent = isCurrentPlan(planName);
                      const badge = getPlanBadge(planName);
                      const styles = getPlanStyles(planName, isCurrent);
                      const isGold = planName === "GOLD";
                      const features = getPlanFeatures(plan);
                      return (
                        <div
                          key={planName}
                          className={`relative flex h-full flex-col overflow-hidden rounded-[22px] border bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl transition-all duration-300 sm:rounded-[30px] ${getMobilePlanOrderClass(planName)} ${styles.wrapper} ${styles.ring}`}
                        >
                          {isGold && (
                            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(212,175,55,0.4),rgba(212,175,55,1),rgba(212,175,55,0.4))]" />
                          )}

                          <div
                            className={`flex h-full flex-col ${
                              planName === "FREE" ? "p-3 sm:p-6 lg:p-7" : "p-4 sm:p-6 lg:p-7"
                            }`}
                          >
                            {/* Top */}
                            <div className="order-1 mb-2 flex items-start justify-between gap-2 sm:order-none sm:mb-6 sm:gap-3">
                              {badge && (
                                <div
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px] ${badge.chip}`}
                                >
                                  <badge.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  {badge.text}
                                </div>
                              )}

                              {isCurrent && (
                                <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-400 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[11px]">
                                  <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  Active
                                </div>
                              )}
                            </div>

                            {/* Name + Price */}
                            <div className="order-2 mb-2 sm:order-none sm:mb-6">
                              <h3 className="text-xl font-bold tracking-tight text-navy dark:text-white font-playfair sm:text-2xl">
                                {planName}
                              </h3>

                              <p
                                className={`mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-sm sm:leading-6 ${
                                  planName === "FREE" ? "hidden sm:block" : ""
                                }`}
                              >
                                {plan.price === 0
                                  ? "A solid starting point for browsing properties."
                                  : `Built for serious property discovery in ${cityName}.`}
                              </p>

                              <div className="mt-2 flex items-end gap-1.5 sm:mt-6 sm:gap-2">
                                <span className="text-xl font-semibold text-slate-500 dark:text-slate-400 sm:text-2xl">
                                  ₹
                                </span>
                                <span
                                  className={`text-4xl font-bold tracking-tight sm:text-6xl ${styles.priceAccent}`}
                                >
                                  {plan.price}
                                </span>
                                {plan.price > 0 && (
                                  <span className="pb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 sm:pb-2 sm:text-sm">
                                    /month
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* CTA */}
                            <div className="order-3 mt-1 sm:order-none sm:mt-7">
                              <button
                                onClick={() =>
                                  handleUpgrade(planName, plan.price)
                                }
                                disabled={
                                  isCurrent || processingPlan === planName
                                }
                                className={`group inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 sm:px-5 sm:py-3.5 ${
                                  styles.button
                                } ${
                                  processingPlan === planName
                                    ? "opacity-60 cursor-wait"
                                    : ""
                                }`}
                              >
                                {processingPlan === planName ? (
                                  "Processing..."
                                ) : isCurrent ? (
                                  "Current Plan"
                                ) : planName === "FREE" ? (
                                  "Free Forever"
                                ) : (
                                  <>
                                    Upgrade Now
                                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Mini highlights */}
                            <div className="order-4 my-2 flex flex-wrap gap-1.5 sm:order-none sm:mb-6 sm:mt-0 sm:grid sm:grid-cols-2 sm:gap-3">
                              <div className="rounded-full border border-slate-200/70 dark:border-slate-700/70 bg-slate-50/70 dark:bg-slate-800/50 px-2.5 py-1 sm:rounded-2xl sm:p-3">
                                <p className="hidden text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:block">
                                  Access
                                </p>
                                <p className="text-xs font-semibold text-navy dark:text-white sm:mt-1 sm:text-sm">
                                  <span className="sm:hidden">
                                    {planName === "FREE"
                                      ? "Basic Access"
                                      : planName === "GOLD"
                                      ? "Premium Access"
                                      : "Elite Access"}
                                  </span>
                                  <span className="hidden sm:inline">
                                    {planName === "FREE"
                                      ? "Basic"
                                      : planName === "GOLD"
                                      ? "Premium"
                                      : "Elite"}
                                  </span>
                                </p>
                              </div>

                              <div className="rounded-full border border-slate-200/70 dark:border-slate-700/70 bg-slate-50/70 dark:bg-slate-800/50 px-2.5 py-1 sm:rounded-2xl sm:p-3">
                                <p className="hidden text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:block">
                                  Best For
                                </p>
                                <p className="text-xs font-semibold text-navy dark:text-white sm:mt-1 sm:text-sm">
                                  {planName === "FREE"
                                    ? "Exploring"
                                    : planName === "GOLD"
                                    ? "Fast Search"
                                    : "Power Users"}
                                </p>
                              </div>
                            </div>

                            {/* Features */}
                            <div className="order-5 flex-1 sm:order-none">
                              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 sm:mb-3 sm:text-xs sm:tracking-[0.16em]">
                                Included Features
                              </div>

                              <ul className="space-y-1 sm:space-y-3.5">
                                {features.map((feature, i) => (
                                  <li
                                    key={i}
                                    className={`flex items-start gap-1.5 rounded-none border-0 bg-transparent px-0 py-1 sm:gap-3 sm:rounded-2xl sm:border sm:px-3.5 sm:py-3 ${
                                      feature.available
                                        ? "border-slate-200/60 dark:border-slate-700/60 sm:bg-white/60 sm:dark:bg-slate-800/40"
                                        : "border-slate-200/60 dark:border-slate-700/60 sm:bg-slate-50/70 sm:dark:bg-slate-800/30 opacity-75"
                                    }`}
                                  >
                                    <div
                                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full sm:h-5 sm:w-5 ${
                                        feature.available
                                          ? "bg-emerald-50 dark:bg-emerald-900/20"
                                          : "bg-rose-50 dark:bg-rose-900/20"
                                      }`}
                                    >
                                      {feature.available ? (
                                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 sm:h-3.5 sm:w-3.5" />
                                      ) : (
                                        <X className="h-3 w-3 text-rose-500 dark:text-rose-400 sm:h-3.5 sm:w-3.5" />
                                      )}
                                    </div>

                                    <span
                                      className={`text-[12px] leading-5 sm:text-sm sm:leading-6 ${
                                        feature.available
                                          ? "text-slate-700 dark:text-slate-300"
                                          : "text-slate-500 dark:text-slate-400"
                                      }`}
                                    >
                                      {feature.text}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* BOTTOM TRUST BAND */}
                <section className="hidden sm:block">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      {
                        icon: Shield,
                        title: "Secure Payment",
                        desc: "Protected checkout experience with trusted Razorpay payment flow.",
                      },
                      {
                        icon: Zap,
                        title: "Instant Activation",
                        desc: "Your subscription is activated immediately after successful payment.",
                      },
                      {
                        icon: Crown,
                        title: "Priority Experience",
                        desc: "Get better access, smoother discovery, and premium user benefits.",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="rounded-[24px] border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/70 p-5 sm:p-6 backdrop-blur-sm"
                      >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                          <item.icon className="h-5 w-5 text-navy dark:text-white" />
                        </div>
                        <h3 className="text-base font-semibold text-navy dark:text-white">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

              
              </>
            ) : (
              <div className="rounded-[28px] border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/70 px-6 py-16 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Crown className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-navy dark:text-white">
                  No plans available
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Please select a city to view pricing plans.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
