const PRIMARY_API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const DEV_FALLBACK_API_BASES = [
  "/api",
  "http://localhost:8790/api",
  "http://localhost:8787/api",
];

const API_BASES = Array.from(
  new Set([
    PRIMARY_API_BASE,
    ...(import.meta.env.DEV ? DEV_FALLBACK_API_BASES : []),
  ].filter(Boolean))
);

type JsonOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

const normalizeApiBase = (base: string) =>
  base.endsWith("/") ? base.slice(0, -1) : base;

async function fetchWithFallback(
  path: string,
  init: RequestInit
): Promise<Response> {
  let lastError: Error | null = null;

  for (const candidate of API_BASES) {
    const base = normalizeApiBase(candidate);

    try {
      const response = await fetch(`${base}${path}`, init);
      return response;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Request failed");
    }
  }

  throw (
    lastError ??
    new Error("Backend not reachable. Start the API server and try again.")
  );
}

async function requestJson<T>(
  path: string,
  options: JsonOptions = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetchWithFallback(path, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(
      "Backend not reachable. Start the API server and try again."
    );
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Request failed");
  }

  return response.json();
}