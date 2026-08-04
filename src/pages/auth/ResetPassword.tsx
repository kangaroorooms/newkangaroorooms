import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

import { useAppDispatch } from "../../store/hooks";
import { authApi } from "../../api/auth.api";
import { showToast } from "../../store/slices/ui.slice";

type FormErrors = {
  password?: string;
  confirmPassword?: string;
  general?: string;
};

type PageState = "loading" | "validating" | "form" | "success" | "error";

export function ResetPassword() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const token = searchParams.get("token");

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setPageState("error");
        setFormErrors({ general: "Reset token is missing from the URL" });
        return;
      }

      try {
        setPageState("validating");
        const result = await authApi.validateResetToken(token);

        if (result.valid) {
          setPageState("form");
        } else {
          setPageState("error");
          setFormErrors({ general: "Reset link is invalid or has expired" });
        }
      } catch {
        setPageState("error");
        setFormErrors({
          general: "Failed to validate reset token. Please try again.",
        });
      }
    };

    validateToken();
  }, [token]);

  useEffect(() => {
    if (formErrors.general) {
      errorSummaryRef.current?.focus();
    }
  }, [formErrors.general]);

  const passwordError = useMemo(() => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  }, [password]);

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  }, [password, confirmPassword]);

  const passwordMatch = useMemo(() => {
    return password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  }, [password, confirmPassword]);

  const isFormValid = useMemo(() => {
    return (
      password.trim().length > 0 &&
      confirmPassword.trim().length > 0 &&
      !passwordError &&
      !confirmPasswordError &&
      passwordMatch
    );
  }, [password, confirmPassword, passwordError, confirmPasswordError, passwordMatch]);

  const validate = () => {
    const newErrors: FormErrors = {};

    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate() || !token) return;

    setLoading(true);

    try {
      await authApi.resetPassword(token, password.trim());

      dispatch(
        showToast({
          message: "Password reset successfully! Redirecting to login...",
          type: "success",
        })
      );

      setPageState("success");

      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to reset password";

      dispatch(showToast({ message: msg, type: "error" }));
      setFormErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full px-4 py-3 rounded-xl bg-white dark:bg-black border text-black dark:text-white outline-none transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-2 focus:ring-[#d4af37]/30";
  const inputBorder =
    "border-gray-300 dark:border-gray-800 focus:border-[#d4af37]";

  /* ---------------- LOADING ---------------- */
  if (pageState === "loading" || pageState === "validating") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0d0b06]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto bg-[#d4af37]/10">
            <Clock className="w-7 h-7 text-[#d4af37] animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Validating reset link...
          </p>
        </div>
      </main>
    );
  }

  /* ---------------- ERROR ---------------- */
  if (pageState === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0d0b06] px-4">
        Passowrd checking
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-[1px] bg-gradient-to-br from-[#d4af37]/40 to-transparent">
            <div className="bg-gray-100 dark:bg-[#111] rounded-2xl p-8 text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center bg-red-500/10">
                <Lock className="w-7 h-7 text-red-400" />
              </div>

              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                Link expired
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                {formErrors.general}
              </p>

              <Link to="/auth/forgot-password">
                <button className="w-full py-3 rounded-xl bg-[#d4af37] text-black font-semibold hover:brightness-110 transition">
                  Request new link
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- SUCCESS ---------------- */
  if (pageState === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0d0b06] px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-[1px] bg-gradient-to-br from-[#d4af37]/40 to-transparent">
            <div className="bg-gray-100 dark:bg-[#111] rounded-2xl p-8 text-center shadow-2xl">
              <CheckCircle2 className="w-8 h-8 text-[#d4af37] mx-auto mb-4" />

              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                Password Reset
              </h2>

              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your password has been updated successfully.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- FORM ---------------- */
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-[#0d0b06]">
      <section className="w-full max-w-md">
        <div className="rounded-2xl p-[1px] bg-gradient-to-br from-[#d4af37]/40 to-transparent">
          <div className="bg-gray-100 dark:bg-[#111] rounded-2xl p-8 shadow-2xl">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Set New Password
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Choose a strong password and confirm it below.
              </p>
            </div>

            {formErrors.general && (
              <div
                ref={errorSummaryRef}
                tabIndex={-1}
                className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{formErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputBase} ${inputBorder} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 px-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-2 text-sm text-red-500">
                    {formErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputBase} ${inputBorder} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 px-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {confirmPassword && (
                  <div
                    className={`mt-2 text-sm font-medium flex items-center gap-2 ${
                      passwordMatch ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {passwordMatch ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Password match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Password not match</span>
                      </>
                    )}
                  </div>
                )}

                {formErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full py-3 rounded-xl bg-[#d4af37] text-black font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}