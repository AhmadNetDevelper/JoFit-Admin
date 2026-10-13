export type DataSource = "mock" | "http";

function readDataSource(): DataSource {
  return import.meta.env.VITE_DATA_SOURCE === "http" ? "http" : "mock";
}

export const apiConfig = {
  dataSource: readDataSource(),
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  timeoutMs: 15_000,
  /** Artificial delay in the mock adapters so loading states are reachable. */
  mockLatencyMs: Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? 0),
} as const;
