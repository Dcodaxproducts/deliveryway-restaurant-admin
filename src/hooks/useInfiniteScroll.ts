import { RefObject, useEffect, useRef } from "react";

type UseInfiniteScrollParams = {
  enabled: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
  threshold?: number;
};

export function useInfiniteScroll<T extends HTMLElement>({
  enabled,
  onLoadMore,
  rootMargin = "250px",
  threshold = 0.1,
}: UseInfiniteScrollParams): RefObject<T | null> {
  const targetRef = useRef<T | null>(null);
  const callbackRef = useRef(onLoadMore);

  useEffect(() => {
    callbackRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const target = targetRef.current;

    if (!target || !enabled) return;

    let frameId: number | null = null;
    let hasTriggered = false;
    const margin = Number.parseFloat(rootMargin) || 0;
    const loadMore = () => {
      if (hasTriggered) return;

      hasTriggered = true;
      callbackRef.current();
    };
    const checkPosition = () => {
      if (frameId !== null) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        const bounds = target.getBoundingClientRect();

        if (bounds.top <= window.innerHeight + margin) {
          loadMore();
        }
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      },
    );

    observer.observe(target);
    window.addEventListener("scroll", checkPosition, true);
    window.addEventListener("resize", checkPosition);
    checkPosition();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", checkPosition, true);
      window.removeEventListener("resize", checkPosition);
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [enabled, rootMargin, threshold]);

  return targetRef;
}
