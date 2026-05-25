import { RefObject, useEffect, useRef } from "react";

export function useClickOutside<T extends HTMLElement>(
  handler: () => void
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;

      if (!element || element.contains(event.target as Node)) {
        return;
      }

      handler();
    };

    document.addEventListener("click", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("click", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler]);

  return ref;
}