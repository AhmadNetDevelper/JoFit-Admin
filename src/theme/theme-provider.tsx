import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { ThemeContext } from "./theme-context";
import {
  DEFAULT_PREFERENCES,
  readPreferences,
  resolveThemeMode,
  writePreferences,
  type Preferences,
} from "./preferences";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(readPreferences);
  const [systemMode, setSystemMode] = useState(() => resolveThemeMode("system"));

  /*
   * `system` is not a colour, it is a subscription: the answer changes when the
   * operating system does, at sunset or when someone flips a setting.
   *
   * The effect only registers the listener — the state it keeps is what the OS
   * last said, not what the admin should look like. That is derived below during
   * render, so choosing a mode never has to wait for an effect to catch up.
   */
  useEffect(() => {
    if (preferences.themeMode !== "system") return;

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemMode(query.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preferences.themeMode]);

  const resolvedMode =
    preferences.themeMode === "system" ? systemMode : preferences.themeMode;

  /*
   * Written to the document element rather than held in a wrapper, because the
   * stylesheet's dark variant is `@custom-variant dark (&:is(.dark *))`, and
   * because the surfaces must reach parts of the page React does not own — the
   * scrollbars, the space past the end of a short page, and form controls via
   * `color-scheme`.
   */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedMode === "dark");
    document.documentElement.style.colorScheme = resolvedMode;
  }, [resolvedMode]);

  /* The content layout is read by a CSS selector on the shell, not by React. */
  useEffect(() => {
    document.documentElement.dataset.contentLayout = preferences.contentLayout;
  }, [preferences.contentLayout]);

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      setPreferences((current) => {
        const next = { ...current, [key]: value };
        writePreferences(next);
        return next;
      });
    },
    [],
  );

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    writePreferences(DEFAULT_PREFERENCES);
  }, []);

  const toggleMode = useCallback(() => {
    setPreference("themeMode", resolvedMode === "dark" ? "light" : "dark");
  }, [resolvedMode, setPreference]);

  const value = useMemo(
    () => ({ preferences, resolvedMode, setPreference, resetPreferences, toggleMode }),
    [preferences, resolvedMode, setPreference, resetPreferences, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
