import { useCallback, useState } from "react";

export type RouteTransition = "home-to-community";

export function useRouteTransition() {
  const [activeTransition, setActiveTransition] = useState<RouteTransition | null>(null);

  const startTransition = useCallback((transition: RouteTransition) => {
    setActiveTransition(transition);
  }, []);

  const clearTransition = useCallback(() => {
    setActiveTransition(null);
  }, []);

  const isTransitionActive = useCallback(
    (transition: RouteTransition) => activeTransition === transition,
    [activeTransition],
  );

  return {
    activeTransition,
    clearTransition,
    isTransitionActive,
    startTransition,
  };
}
