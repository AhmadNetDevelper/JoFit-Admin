import { resolveService } from "@/services";

import type { AuthService } from "./auth.contract";
import { httpAuthService } from "./auth.http";
import { mockAuthService } from "./auth.mock";

export const authService = resolveService<AuthService>("auth", {
  mock: mockAuthService,
  http: httpAuthService,
});

export type { AuthService } from "./auth.contract";
