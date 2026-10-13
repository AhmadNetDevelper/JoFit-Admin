import { resolveService } from "@/services";

import type { SettingsService } from "./settings.contract";
import { httpSettingsService } from "./settings.http";
import { mockSettingsService } from "./settings.mock";

export const settingsService = resolveService<SettingsService>("settings", {
  mock: mockSettingsService,
  http: httpSettingsService,
});

export type { SettingsService } from "./settings.contract";
