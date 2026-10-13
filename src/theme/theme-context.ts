import { createContext } from "react";

import { DEFAULT_PREFERENCES, type Preferences } from "./preferences";

export interface ThemeValue {
  readonly preferences: Preferences;
  /** The mode actually in force, with `system` already resolved. */
  readonly resolvedMode: "light" | "dark";
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  resetPreferences: () => void;
  /** Light ⇄ dark in one click, for the button in the bar. */
  toggleMode: () => void;
}

export const ThemeContext = createContext<ThemeValue>({
  preferences: DEFAULT_PREFERENCES,
  resolvedMode: "light",
  setPreference: () => undefined,
  resetPreferences: () => undefined,
  toggleMode: () => undefined,
});
