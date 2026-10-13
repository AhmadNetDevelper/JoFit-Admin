import { apiConfig } from "@/config";
import { AppError } from "@/lib";

export interface ServiceAdapters<TService> {
  readonly mock: TService;
  /** Register the HTTP adapter here when the backend exists. */
  readonly http?: TService;
}

/**
 * Picks a domain service implementation from configuration. This is the one
 * place that knows a mock layer exists.
 */
export function resolveService<TService>(
  domain: string,
  adapters: ServiceAdapters<TService>,
): TService {
  const adapter = adapters[apiConfig.dataSource];
  if (!adapter) {
    throw new AppError(
      "unavailable",
      `The "${domain}" domain has no ${apiConfig.dataSource} adapter registered.`,
    );
  }
  return adapter;
}
