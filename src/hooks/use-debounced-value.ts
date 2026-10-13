import { useEffect, useState } from "react";

/** Generic and domain-free — shared hooks carry no business knowledge. */
export function useDebouncedValue<TValue>(value: TValue, delayMs = 300): TValue {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
