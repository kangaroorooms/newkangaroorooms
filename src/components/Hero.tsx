import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { SearchBar } from "./SearchBar";
import { useListPropertyAction } from "../hooks/useListPropertyAction";
import { Button } from "./ui/Button";
import { PhoneModal } from "./PhoneModal";
import { OwnerUpgradeConfirmModal } from "./OwnerUpgradeConfirmModal";

const trustItems = [
  { icon: Shield, text: "Verified Owners" },
  { icon: Zap, text: "Instant Contact" },
  // { icon: Star, text: "Premium Listings" },
];

export function Hero() {
  const gold = "rgba(212,175,55,0.9)";
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const {
    shouldShowListProperty,
    handleListPropertyClick,
    isUpgradingToOwner,
    isOwnerUpgradeConfirmOpen,
    closeOwnerUpgradeConfirm,
    confirmOwnerUpgrade,
  } = useListPropertyAction({
    onRequirePhone: () => setShowPhoneModal(true),
  });

  return (
    <section className="relative overflow-visible">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1600596542815-2a4d9fddace7?q=80&w=2070&auto=format&fit=crop")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Light mode */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-slate-50 dark:hidden" />

        {/* Dark mode */}
        <div className="absolute inset-0 hidden dark:block bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-slate-950/95" />
      </div>

      {/* Content */}
      <div className="relative z-20 min-h-[75vh] md:min-h-[85vh] flex flex-col items-center justify-center px-4 sm:px-6 text-center max-w-6xl mx-auto py-safe">
        {/* Badge */}
        <div className="mb-4 sm:mb-6 px-3 sm:px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md text-xs sm:text-sm tracking-widest uppercase text-slate-600 dark:text-slate-300">
          Verified Properties • Trusted Owners
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
          Find Your Perfect{" "}
          <span style={{ color: gold }}>Rental Living Space</span>
        </h1>

        {/* Subtext */}
        <p className="mt-4 sm:mt-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl px-4">
          Discover curated PGs, rooms, apartments, and homes with verified
          owners.
        </p>

        {/* Search */}
        <div className="relative z-30 mt-6 sm:mt-8 md:mt-10 w-full px-4 sm:px-0">
          <SearchBar />
        </div>

        {/* Trust row */}
        <div className="relative z-10 mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-4 justify-center px-4">
          {trustItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md text-xs sm:text-sm text-slate-600 dark:text-slate-300"
            >
              <item.icon className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
              {item.text}
            </div>
          ))}

          {shouldShowListProperty && (
            <div className="flex w-full flex-col items-center">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                🏡 Are you a Property Owner?
              </p>

              <h3 className="mt-2 max-w-md text-center text-l leading-tight text-slate-900 dark:text-white">
                Reach thousands of verified tenants and rent faster.
              </h3>

              <p className="mt-2 max-w-sm text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
                Publish your property in minutes. No brokerage. No hidden fees. Free Listing.
              </p>
            </div>
          )}
          {shouldShowListProperty && (
            <button
              onClick={handleListPropertyClick}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white border border-amber-400/30 backdrop-blur-md text-xs sm:text-sm font-semibold shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5 dark:from-amber-600 dark:to-amber-700"
            >
              <Home className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>List Your Property</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      {showPhoneModal && (
        <PhoneModal onClose={() => setShowPhoneModal(false)} />
      )}

      <OwnerUpgradeConfirmModal
        isOpen={isOwnerUpgradeConfirmOpen}
        isSubmitting={isUpgradingToOwner}
        onClose={closeOwnerUpgradeConfirm}
        onConfirm={confirmOwnerUpgrade}
      />

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-400">
        <ChevronDown className="animate-bounce" />
      </div>
    </section>
  );
}
