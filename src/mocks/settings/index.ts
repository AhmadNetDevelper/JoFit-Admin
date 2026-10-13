import { defaultTheme } from "@/features/settings/default-theme";
import type { StorefrontTheme } from "@/features/settings";

export { defaultTheme };

let current: StorefrontTheme = defaultTheme;

export function mockTheme(): StorefrontTheme {
  return current;
}

export function setMockTheme(next: StorefrontTheme): void {
  current = next;
}
