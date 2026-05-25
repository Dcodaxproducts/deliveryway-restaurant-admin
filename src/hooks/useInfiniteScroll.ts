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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          callbackRef.current();
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [enabled, rootMargin, threshold]);

  return targetRef;
}