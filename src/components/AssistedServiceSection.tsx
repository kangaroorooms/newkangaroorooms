import { Phone, CheckCircle2, Shield, Clock, Users } from "lucide-react";
import { useState } from "react";
import { AssistedServiceModal } from "./AssistedServiceModal";
import { useAppSelector } from "../store/hooks";

export function AssistedServiceSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { authStatus } = useAppSelector((state) => state.auth);

  const handleRequestClick = () => {
    if (authStatus !== "AUTHENTICATED") {
      // Redirect to login or show login prompt
      window.location.href = "/auth/login?redirect=/pricing";
      return;
    }
    setIsModalOpen(true);
  };

  const features = [
    "Dedicated property expert assigned within 24 hours",
    "Curated property shortlist based on your preferences",
    "Visit scheduling and coordination",
    "Rent negotiation on your behalf",
  ];

  const guarantees = [
    { icon: Clock, text: "Expert assigned within 24 hours" },
    { icon: Shield, text: "Verified property recommendations" },
    { icon: Users, text: "Dedicated search assistance" },
    { icon: CheckCircle2, text: "Support until finalization" },
  ];

  return (
    <>
      <section className="mb-4 sm:mb-4">
        <div className="rounded-[22px] border border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-slate-800/50 dark:via-slate-900/50 dark:to-slate-800/30 backdrop-blur-xl overflow-hidden shadow-lg sm:rounded-[32px]">
          {/* Main Container */}
          <div className="grid grid-cols-1 gap-4 p-4 sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-10">
            {/* LEFT: Content */}
            <div className="flex flex-col justify-center">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100/60 dark:bg-amber-900/30 px-3 py-1 w-fit">
                <Phone className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Premium Service
                </span>
              </div>

              {/* Title */}
              <h2 className="mt-4 text-xl sm:text-4xl font-bold text-navy dark:text-white font-playfair leading-tight">
                We Find Your Perfect Home. You Just Move In.
              </h2>

              {/* Subtitle */}
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-relaxed">
                Dedicated property expert handles everything: shortlisting,
                scheduling visits, negotiation, and paperwork. Save 40+ hours of
                search time.
              </p>

              {/* Features List */}
              <div className="mt-4 space-y-2 sm:mt-8 sm:space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Trust/Guarantee Section */}
              <div className="mt-6 sm:mt-8">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                  Our Guarantee
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {guarantees.map((guarantee, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <guarantee.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {guarantee.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: CTA Box */}
            <div className="flex flex-col justify-center">
              <div className="rounded-[18px] border border-amber-300/60 dark:border-amber-900/40 bg-white/90 dark:bg-slate-800/80 backdrop-blur-md shadow-xl p-4 sm:rounded-[24px] sm:p-8">
                {/* Price Label */}
                <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
                  One-Time Service Fee
                </p>

                {/* Price */}
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-bold text-navy dark:text-white font-playfair">
                    ₹499
                  </span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    one-time fee
                  </span>
                </div>

                {/* Price Note */}
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-100/90 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Need help choosing?
                  </p>

                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Our team is available on WhatsApp to answer your questions.
                  </p>

                  <a
                    href="https://wa.me/918209595522"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-all"
                  >
                    <Phone className="h-4 w-4" />
                    WhatsApp Support
                  </a>
                </div>

                {/* Divider */}
                <div className="my-4 h-px bg-gradient-to-r from-amber-200/20 to-orange-200/20 dark:from-amber-900/20 dark:to-orange-900/20 sm:my-6" />

                {/* CTA Button */}
                <button
                  onClick={handleRequestClick}
                  className="w-full rounded-[16px] bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 active:scale-95 dark:from-amber-500 dark:to-orange-500 dark:hover:from-amber-600 dark:hover:to-orange-600 px-6 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Get My Property Expert
                </button>

                {/* Footer Note */}
                <p className="mt-4 text-xs text-center text-slate-500 dark:text-slate-400">
                  Submit details to proceed with payment
                </p>
              </div>

              {/* Additional Trust Info */}
              <div className="mt-3 flex items-center gap-2 justify-center sm:mt-6">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ✓ No commitment
                </span>
                <span className="text-xs text-slate-300 dark:text-slate-600">
                  •
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  24-hour response
                </span>
                <span className="text-xs text-slate-300 dark:text-slate-600">
                  •
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Money-back guarantee
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      <AssistedServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
