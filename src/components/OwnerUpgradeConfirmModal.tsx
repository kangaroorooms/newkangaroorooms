import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Home, Phone } from "lucide-react";
import { Button } from "./ui/Button";

interface OwnerUpgradeConfirmModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  currentUserPhone?: string | null;
  onClose: () => void;
  onConfirm: (phone?: string) => void;
}

export function OwnerUpgradeConfirmModal({
  isOpen,
  isSubmitting,
  currentUserPhone,
  onClose,
  onConfirm,
}: OwnerUpgradeConfirmModalProps) {
  const [phone, setPhone] = useState("");

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (currentUserPhone) {
      onConfirm(); // No phone needed, user already has phone
    } else {
      onConfirm(phone); // Pass phone input
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-upgrade-title"
      aria-describedby="owner-upgrade-description"
    >
      {/* Premium Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative
          w-full
          max-w-xl
          max-h-[90vh]
          overflow-y-auto
          rounded-[32px]
          border
          border-white/10
          bg-white
          shadow-[0_25px_80px_rgba(15,23,42,0.28)]
          dark:bg-slate-900
          dark:border-white/10
          animate-in
          fade-in
          zoom-in-95
          duration-200
        "
      >
        {/* Decorative top glow */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-gold/10 to-transparent pointer-events-none" />

        {/* Close */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          aria-label="Close modal"
          className="
            absolute
            right-5
            top-5
            z-10
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            border
            border-slate-200/80
            bg-white/80
            text-slate-500
            backdrop-blur
            transition-all
            duration-200
            hover:scale-105
            hover:bg-slate-100
            hover:text-slate-700
            focus:outline-none
            focus:ring-2
            focus:ring-gold
            disabled:cursor-not-allowed
            disabled:opacity-50
            dark:border-white/10
            dark:bg-slate-800/80
            dark:text-slate-300
            dark:hover:bg-slate-700
            dark:hover:text-white
          "
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="px-6 pb-6 pt-8 sm:px-10 sm:pb-8 sm:pt-10">
          {/* Icon */}
          <div
            className="
              mb-6
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-gold
              to-yellow-500
              shadow-lg
              shadow-gold/20
            "
          >
            <Home className="h-8 w-8 text-slate-900" />
          </div>

          {/* Title + Description */}
        {/* Title + Description */}
<div className="max-w-lg">
  <h2
    id="owner-upgrade-title"
    className="
      font-playfair
      text-3xl
      font-semibold
      leading-tight
      tracking-tight
      text-slate-900
      dark:text-white
    "
  >
    Switch to Owner Access
  </h2>

  <p
    id="owner-upgrade-description"
    className="
      mt-4
      text-[15px]
      leading-7
      text-slate-600
      dark:text-slate-300
    "
  >
    Start listing your properties by converting your account to owner access.
  </p>
</div>

{/* Warning card */}
<div
  className="
    mt-8
    rounded-2xl
    border
    border-amber-200/70
    bg-amber-50/80
    p-5
    dark:border-amber-500/20
    dark:bg-amber-500/10
  "
>
  <div className="flex items-start gap-3">
    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" />

    <div>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">
        Tenant access may change after switching
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
        Some tenant-specific features such as active plans,
        visit bookings, or tenant-only access may no longer
        be available after switching to owner access.
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
        Your login and account information will remain the same.
      </p>
    </div>
  </div>
</div>

{/* Phone input field (only show if user has no phone) */}
{!currentUserPhone && (
  <div className="mt-8">
    <label
      htmlFor="phone"
      className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
    >
      Phone Number
    </label>
    <div className="relative">
      <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        id="phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Enter Valid Phone Number"
        disabled={isSubmitting}
        className="
          w-full
          rounded-xl
          border
          border-slate-300
          bg-white
          py-3
          pl-12
          pr-4
          text-sm
          text-slate-900
          placeholder:text-slate-400
          focus:border-gold
          focus:outline-none
          focus:ring-2
          focus:ring-gold/20
          disabled:cursor-not-allowed
          disabled:opacity-50
          dark:border-slate-600
          dark:bg-slate-800
          dark:text-white
          dark:placeholder:text-slate-500
          dark:focus:border-gold
          dark:focus:ring-gold/20
        "
      />
    </div>
    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
      Enter your phone number to verify owner identity
    </p>
  </div>
)}


          {/* Footer */}
          <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="
                h-12
                rounded-xl
                px-6
                text-sm
                font-medium
                sm:min-w-[120px]
              "
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleConfirm}
              loading={isSubmitting}
              className="
                h-12
                rounded-xl
                bg-gradient-to-r
                from-gold
                to-yellow-500
                px-6
                text-sm
                font-semibold
                text-slate-900
                shadow-lg
                shadow-gold/20
                transition-all
                duration-200
                hover:scale-[1.01]
                hover:from-yellow-400
                hover:to-gold
                hover:shadow-xl
                hover:shadow-gold/30
                sm:min-w-[180px]
              "
            >
              Continue as Owner
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}