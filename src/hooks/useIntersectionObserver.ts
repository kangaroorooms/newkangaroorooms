/**
 * 🔍 INTERSECTION OBSERVER HOOK
 * 
 * Automatically triggers callback when element enters viewport.
 * Used for infinite scroll / "load more when user scrolls to bottom" pattern.
 * 
 * OPTIMIZATIONS:
 * - Observer created only once (not recreated on every render)
 * - Callback stored in ref to avoid stale closure issues
 * - Automatic cleanup on unmount
 * - Respects enabled flag without recreating observer
 * 
 * USAGE:
 * const { ref, isVisible } = useIntersectionObserver({
 *   onVisible: () => loadMore(),
 *   threshold: 0.1
 * });
 * 
 * return <div ref={ref}>Load more trigger zone</div>;
 */

import { useEffect, useRef, useCallback } from "react";

interface UseIntersectionObserverOptions {
  onVisible?: (entry: IntersectionObserverEntry) => void;
  threshold?: number | number[];
  rootMargin?: string;
  enabled?: boolean;
}

export function useIntersectionObserver({
  onVisible,
  threshold = 0,
  rootMargin = "100px",
  enabled = true
}: UseIntersectionObserverOptions = {}) {
  const nodeRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const callbackRef = useRef<typeof onVisible | undefined>(onVisible);

  // Always keep latest callback in ref to avoid stale closures
  useEffect(() => {
    callbackRef.current = onVisible;
  }, [onVisible]);

  // Create (or recreate) the observer when threshold/rootMargin change.
  // Do NOT include `onVisible` in deps so observer isn't recreated when callback changes.
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && callbackRef.current) {
          try {
            callbackRef.current(entry);
          } catch (e) {
            // Guard: do not allow user callback errors to break the observer
            // eslint-disable-next-line no-console
            console.error('useIntersectionObserver callback error', e);
          }
        }
      }
    }, { threshold, rootMargin });

    observerRef.current = observer;

    // If node already set, observe it (respect enabled flag)
    if (nodeRef.current && enabled) observer.observe(nodeRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [threshold, rootMargin]);

  // Toggle observing when 'enabled' changes
  useEffect(() => {
    const obs = observerRef.current;
    const node = nodeRef.current;
    if (!obs || !node) return;
    if (enabled) obs.observe(node);
    else obs.unobserve(node);
  }, [enabled]);

  // Callback ref setter: attach/detach observed node without recreating observer
  const setRef = useCallback((node: HTMLElement | null) => {
    const prev = nodeRef.current;
    nodeRef.current = node;
    const obs = observerRef.current;
    if (!obs) return;

    if (prev && prev !== node) {
      try { obs.unobserve(prev); } catch (_) { /* ignore */ }
    }

    if (node && enabled) {
      obs.observe(node);
    }
  }, [enabled]);

  return { ref: setRef } as { ref: (el: HTMLElement | null) => void };
}
