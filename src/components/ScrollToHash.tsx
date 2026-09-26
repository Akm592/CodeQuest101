// React Router does not scroll to `#hash` targets on its own, and this app had
// no ScrollRestoration either. So `navigate("/#visualizations")` from a
// visualizer's Back button landed at the top of the home page — the anchor was
// in the URL and nothing moved.
//
// This also restores the ordinary browser behaviour of starting a new page at
// the top, which a SPA otherwise loses.

import * as React from "react";
import { useLocation } from "react-router-dom";

export const ScrollToHash: React.FC = () => {
  const { pathname, hash } = useLocation();

  React.useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    // The target section may not be mounted on the first frame after a route
    // change (HomePage renders its sections through motion wrappers), so retry
    // for a few frames before giving up rather than scrolling to nothing.
    let frames = 0;
    let raf = 0;

    const tryScroll = () => {
      const id = decodeURIComponent(hash.slice(1));
      const el = document.getElementById(id);
      if (el) {
        // `auto`, not `smooth`: this fires on navigation, and animating a
        // multi-thousand-pixel jump reads as the page falling over.
        el.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }
      if (frames++ < 30) raf = requestAnimationFrame(tryScroll);
    };

    raf = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash]);

  return null;
};

export default ScrollToHash;
