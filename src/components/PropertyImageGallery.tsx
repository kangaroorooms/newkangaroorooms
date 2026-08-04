import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Grid2x2,
  CheckCircle2,
} from "lucide-react";

interface PropertyImageGalleryProps {
  images: string[];
  title: string;
  isVerified?: boolean;
}

export function PropertyImageGallery({
  images,
  title,
  isVerified = false,
}: PropertyImageGalleryProps) {
  const safeImages = useMemo(
    () =>
      Array.isArray(images) && images.length
        ? images
        : ["/placeholder-room.jpg"],
    [images]
  );

  // activeIndex drives: viewer slide + mobile dot highlight
  const [activeIndex, setActiveIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Ref for the mobile horizontal scroll strip
  const mobileTrackRef = useRef<HTMLDivElement | null>(null);

  const previewImages = safeImages.slice(0, 5);

  /* ─── helpers ─────────────────────────────────────── */

  const openViewer = useCallback((index = 0) => {
    setActiveIndex(index);
    setIsViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => setIsViewerOpen(false), []);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  }, [safeImages.length]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  }, [safeImages.length]);

  /* ─── sync dot highlight with mobile scroll ────────────────
     IntersectionObserver watches each slide; when one enters
     the viewport at ≥50% visibility, we update activeIndex.  */
 useEffect(() => {
  const track = mobileTrackRef.current;
  if (!track) return;

  let rafId = 0;

  const handleScroll = () => {
    cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {
      const slideWidth = track.clientWidth;
      if (!slideWidth) return;

      const nextIndex = Math.round(track.scrollLeft / slideWidth);
      const clampedIndex = Math.max(
        0,
        Math.min(safeImages.length - 1, nextIndex)
      );

      setActiveIndex((prev) => (prev === clampedIndex ? prev : clampedIndex));
    });
  };

  track.addEventListener("scroll", handleScroll, { passive: true });

  return () => {
    track.removeEventListener("scroll", handleScroll);
    cancelAnimationFrame(rafId);
  };
}, [safeImages.length]);

  /* ─── programmatic scroll when dot is tapped ──────────── */
 const scrollToSlide = useCallback((idx: number) => {
  const track = mobileTrackRef.current;
  if (!track) return;

  const slide = track.children[idx] as HTMLElement | undefined;
  if (!slide) return;

  setActiveIndex(idx);
  slide.scrollIntoView({
    behavior: "smooth",
    inline: "start",
    block: "nearest",
  });
}, []);

  /* ─── keyboard nav in viewer ───────────────────────────── */
  useEffect(() => {
    if (!isViewerOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isViewerOpen, goPrev, goNext, closeViewer]);

  if (!safeImages.length) return null;

  return (
    <>
      {/* ═══════════════ GRID VIEW ═══════════════ */}
      <section className="mb-8 md:mb-10">
        <div className="relative">

          {/* Desktop 5-photo grid */}
          <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-3 h-[420px] lg:h-[520px] rounded-[28px] overflow-hidden">
            {/* Main image – col 1-2, row 1-2 */}
            <button
              type="button"
              onClick={() => openViewer(0)}
              className="relative col-span-2 row-span-2 group overflow-hidden bg-slate-100 dark:bg-slate-800 focus:outline-none"
            >
              <img
                src={previewImages[0]}
                alt={`${title} – photo 1`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {isVerified && (
                <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 shadow-md">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-bold uppercase">Verified</span>
                </div>
              )}
            </button>

            {/* Side images */}
            {Array.from({ length: 4 }).map((_, idx) => {
              const image = previewImages[idx + 1];
              const actualIndex = idx + 1;
              return (
                <button
                  key={actualIndex}
                  type="button"
                  onClick={() => image && openViewer(actualIndex)}
                  className="relative group overflow-hidden bg-slate-100 dark:bg-slate-800 focus:outline-none"
                >
                  {image && (
                    <>
                      <img
                        src={image}
                        alt={`${title} – photo ${actualIndex + 1}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      {idx === 3 && safeImages.length > 5 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-semibold text-sm">
                          +{safeImages.length - 5} more
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─── Mobile horizontal carousel ───────────────── */}
          <div className="md:hidden">
            {/*
              Each slide is `w-[calc(100vw-2rem)]` so it fills the screen
              with a small peek of the next slide for discoverability.
              snap-mandatory keeps slides snapping cleanly.
            */}
            <div
  ref={mobileTrackRef}
  className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
>
              {safeImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => openViewer(idx)}
                  // w-[100%] in a flex row with gap means the snap target is
                  // the full container minus the gap; using min-w-full instead
                  // so each slide stretches to exactly the scroll container's width.
                  className="relative w-full shrink-0 snap-center h-[260px] rounded-[24px] overflow-hidden bg-slate-100 dark:bg-slate-800 focus:outline-none"
                >
                  <img
                    src={img}
                    alt={`${title} – photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {/* counter pill */}
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
                    {idx + 1} / {safeImages.length}
                  </div>
                </button>
              ))}
            </div>

            {/* Dot indicators – activeIndex updated by IntersectionObserver */}
            {safeImages.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {safeImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === activeIndex
                        ? "w-6 bg-slate-900 dark:bg-white"
                        : "w-2 bg-slate-300 dark:bg-slate-600"
                    }`}
                    aria-label={`Go to photo ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop "Show all" CTA */}
          <button
            type="button"
            onClick={() => openViewer(0)}
            className="absolute bottom-4 right-4 hidden md:inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg backdrop-blur-md bg-white/95 text-slate-900 border border-slate-200 hover:bg-white hover:shadow-xl dark:bg-slate-900/95 dark:text-white dark:border-slate-700 dark:hover:bg-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <Grid2x2 className="h-4 w-4" />
            Show all photos
          </button>
        </div>
      </section>

      {/* ═══════════════ FULLSCREEN VIEWER PORTAL ═══════════════ */}
      {isViewerOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] bg-black/95 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Photo gallery viewer"
          >
            {/* Top bar */}
            <div className="relative flex items-center justify-between px-5 py-4 flex-none">
              <span className="text-white/80 text-sm tabular-nums">
                {activeIndex + 1} / {safeImages.length}
              </span>
              <button
                type="button"
                onClick={closeViewer}
                className="text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors"
                aria-label="Close gallery"
              >
                <X size={20} />
              </button>
            </div>

            {/* Image area – fills remaining height */}
            <div className="relative flex-1 overflow-hidden">
              {/* Prev / Next arrows */}
              {safeImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors"
                    aria-label="Next photo"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/*
                CSS-transform slide strip.
                overflow-hidden is on the parent (.relative.flex-1),
                so only the active slide is visible.
              */}
              <div
                className="flex h-full transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {safeImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-full h-full flex-none flex items-center justify-center px-12"
                  >
                    <img
                      src={img}
                      alt={`${title} – photo ${idx + 1}`}
                      className="max-h-full max-w-full object-contain rounded-lg select-none"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Thumbnail strip */}
            {safeImages.length > 1 && (
              <div className="flex-none flex gap-2 overflow-x-auto px-4 py-3 bg-black/50"
                style={{ scrollbarWidth: "none" }}
              >
                {safeImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`h-16 w-24 rounded-lg overflow-hidden flex-none transition-all ${
                      activeIndex === idx
                        ? "ring-2 ring-white opacity-100"
                        : "opacity-50 hover:opacity-75"
                    }`}
                    aria-label={`View photo ${idx + 1}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}