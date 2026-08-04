import { ArrowRight, BadgeCheck, HeartHandshake, Search, ShieldCheck, Sparkles, Users, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type OptionCard = {
  title: string;
  description: string;
  promise: string;
  bullets: string[];
  buttonText: string;
  buttonHref: string;
  icon: LucideIcon;
  accentClassName: string;
};

const optionCards: OptionCard[] = [
  {
    title: "Property Expert",
    description: "We do everything for you.",
    promise: "Save 40+ hours of searching.",
    bullets: ["We shortlist homes", "We schedule visits", "We negotiate rent"],
    buttonText: "Start with Property Expert",
    buttonHref: "/pricing?plan=expert",
    icon: Users,
    accentClassName: "border-gold/50 bg-white shadow-[0_0_0_1px_rgba(212,175,55,0.2),0_10px_30px_rgba(15,23,42,0.08)] dark:border-gold/40 dark:bg-slate-950/70",
  },
  {
    title: "Self Search Premium",
    description: "Search independently with premium tools.",
    promise: "Direct owner contact.",
    bullets: ["Exact map location and owner contact", "Premium listings", "No brokerage"],
    buttonText: "Start Self Search",
    buttonHref: "/rooms",
    icon: Search,
    accentClassName: "border-slate-200 bg-slate-50/80 shadow-[0_4px_12px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5",
  },
];

export function StayCollectionShowcase() {
  return (
    <section className="w-full py-2 sm:py-3 lg:py-20">
      <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:p-2.5 lg:p-8 dark:border-slate-700/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1.25 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold sm:px-3 sm:py-1.25 sm:text-[11px]">
              <Sparkles className="h-3.5 w-3.5" />
              Homilivo Premium
            </div>

            <h2 className="mt-2 text-[1.15rem] font-semibold leading-6 tracking-tight text-slate-900 dark:text-white sm:mt-2.5 sm:text-[1.45rem] sm:leading-7 lg:text-[2rem] lg:leading-tight">
              Choose How You Want to Rent
            </h2>
            <p className="mx-auto mt-1.5 max-w-2xl text-[0.9rem] leading-5 text-slate-600 dark:text-slate-300 sm:mt-1.5 sm:text-base sm:leading-6 lg:mx-0">
              Save time, avoid brokerage surprises, and choose the renting experience that fits you.
            </p>

            <div className="mt-2 grid gap-2 sm:mt-2.5 sm:gap-2.5 lg:grid-cols-2">
              {optionCards.map(({ title, description, promise, bullets, buttonText, buttonHref, icon: Icon, accentClassName }) => (
                <article key={title} className={`flex h-full flex-col rounded-2xl border p-2.5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-3 lg:p-4 ${accentClassName}`}>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-gold/10 p-2 text-gold">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">{title}</h3>
                  </div>

                  <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{description}</p>

                  <div className="mt-2 rounded-xl border border-gold/20 bg-gold/10 px-3 py-2 text-sm font-medium text-gold shadow-[0_2px_8px_rgba(212,175,55,0.08)]">
                    {promise}
                  </div>

                  <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                    {bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={buttonHref}
                    className="mt-auto inline-flex min-h-[44px] sm:min-h-[46px] w-full items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold px-4 py-2.5 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-yellow-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 motion-reduce:transition-none"
                  >
                    {buttonText}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>

            {/* <div className="mt-2 rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 lg:mt-3 lg:p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-gold" />
                  Verified Owners
                </span>
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-gold" />
                  Direct Owner Access
                </span>
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-gold" />
                  Transparent Pricing
                </span>
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
                  <HeartHandshake className="h-4 w-4 text-gold" />
                  Dedicated Support
                </span>
              </div>
            </div> */}

            {/* <div className="mt-2 flex flex-col items-center gap-1.5 lg:mt-3 lg:items-start">
              <p className="text-center text-[11px] font-medium text-slate-600 dark:text-slate-400 sm:text-xs lg:text-left">
                Still comparing?
              </p>
              <p className="max-w-md text-center text-[0.8rem] leading-5 text-slate-600 dark:text-slate-400 lg:text-left">
                See detailed pricing, membership features and FAQs before choosing.
              </p>
              <div className="text-center lg:text-left">
                <Link
                  to="/pricing"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold px-5 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-yellow-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 motion-reduce:transition-none"
                >
                  Compare All Plans
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div> */}
          </div>

          <div className="hidden w-full lg:block lg:max-w-[280px] lg:flex-shrink-0">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 text-slate-700 backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4 text-gold" />
                Why Homilivo
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/50">
                  <p className="font-medium text-slate-900 dark:text-white">Verified owners</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">Search with confidence.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/50">
                  <p className="font-medium text-slate-900 dark:text-white">Transparent pricing</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">Clear options from the start.</p>
                </div>
                 <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/50">
                  <p className="font-medium text-slate-900 dark:text-white">Our agent team helps</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">Get personalized assistance from our experts.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/50">
                  <p className="font-medium text-slate-900 dark:text-white">Secure experience</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">Support through every step.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}