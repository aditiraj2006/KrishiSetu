import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Returns true if the current viewport width is below the mobile breakpoint (768px).
 * Uses matchMedia as the single source of truth to avoid stale-closure bugs
 * that can occur when mixing `window.innerWidth` with the `change` event listener.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Use mql.matches as source of truth — avoids stale window.innerWidth reads
    const onChange = () => setIsMobile(mql.matches);

    mql.addEventListener("change", onChange);
    // Initialize state on mount
    setIsMobile(mql.matches);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
