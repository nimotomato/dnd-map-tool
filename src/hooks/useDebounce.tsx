import { useEffect, useRef } from "react";

export default function useDebounce(fn: Function, delay: number) {
  // Keep track of lates timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce function
  const debouncedFn = (...args: any[]) => {
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
