import { useEffect, useRef } from "react";

export default function useDebounce<T extends unknown[], R>(
  fn: (...args: T) => R,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFn = (...args: T): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fn(...args);
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFn;
}
