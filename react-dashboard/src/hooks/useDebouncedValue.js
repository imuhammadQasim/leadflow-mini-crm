import { useEffect, useState } from "react";

// Delays updating the returned value until `value` stops changing for
// `delayMs`. Used on the search box so we don't fire an API request on
// every keystroke.
export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
