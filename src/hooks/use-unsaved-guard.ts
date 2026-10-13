import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Stops a navigation away from a form with unsaved edits.
 *
 * The admin's editors hold their draft in component state, so leaving the screen
 * discards it silently. On a coach profile or an article body that is minutes of
 * typing, and nothing warns before it goes.
 *
 * Two different exits have to be covered, and they are not the same mechanism:
 *
 * - Inside the app, React Router owns navigation, so `useBlocker` can stop it
 *   and ask. The caller decides what to ask with — this hook returns the
 *   blocker so the screen can render its own dialog in its own language.
 * - Leaving the page entirely — closing the tab, reloading, following an
 *   external link — is the browser's, and all it allows is `beforeunload`. The
 *   text is the browser's own and cannot be translated or styled; the only
 *   choice is whether to prompt at all.
 *
 * Pass `when: false` while saving, or the success navigation the save triggers
 * blocks itself.
 */
export function useUnsavedGuard(when: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!when) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      /* Required by older browsers; modern ones ignore the value and show
         their own wording. */
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [when]);

  return blocker;
}
