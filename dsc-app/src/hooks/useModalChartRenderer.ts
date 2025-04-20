import { useEffect, useState } from "react";

/**
 * Hook to manage chart rendering in modals
 * Handles delayed rendering of charts when modals are opened
 * and ensures proper resize events are triggered
 *
 * @param isVisible Whether the parent container (modal) is visible
 * @param renderDelay Delay before rendering charts (ms)
 * @param resizeDelay Delay before triggering resize event (ms)
 * @returns Boolean indicating whether charts should be rendered
 */
export const useModalChartRenderer = (
  isVisible: boolean,
  renderDelay: number = 50,
  resizeDelay: number = 100,
): boolean => {
  const [shouldRenderCharts, setShouldRenderCharts] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure the modal is fully rendered before charts
      const renderTimer = setTimeout(() => {
        setShouldRenderCharts(true);

        // Trigger resize after charts are rendered to ensure proper sizing
        const resizeTimer = setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        }, resizeDelay);

        return () => clearTimeout(resizeTimer);
      }, renderDelay);

      return () => clearTimeout(renderTimer);
    } else {
      // When modal closes, stop rendering charts to reset their state
      setShouldRenderCharts(false);
    }
  }, [isVisible, renderDelay, resizeDelay]);

  return shouldRenderCharts;
};

/**
 * Manually trigger chart resize
 * Useful when you need to force charts to redraw
 */
export const triggerChartResize = (): void => {
  // Use requestAnimationFrame for optimal timing
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"));
  });
};
