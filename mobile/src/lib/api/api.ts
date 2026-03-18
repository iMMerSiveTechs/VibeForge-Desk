import { fetch } from "expo/fetch";

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  body: any;

  constructor(status: number, body: any, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRYABLE_MIN_STATUS = 500;

// ---------------------------------------------------------------------------
// Response envelope type - all app routes return { data: T }
// ---------------------------------------------------------------------------

interface ApiResponse<T> {
  data: T;
}

interface RequestOptions {
  method?: string;
  body?: string;
  timeout?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof DOMException && error.name === "AbortError") return true;
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;

const request = async <T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { method, body, timeout = DEFAULT_TIMEOUT_MS } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Exponential backoff for retries (0ms, 1000ms, 2000ms)
    if (attempt > 0) {
      await sleep(1000 * attempt);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${baseUrl}${url}`, {
        method,
        body,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 1. Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      // 2. Check for error status codes
      if (!response.ok) {
        let errorBody: any = null;
        try {
          errorBody = await response.json();
        } catch {
          try {
            errorBody = await response.text();
          } catch {
            // Could not read body
          }
        }

        const apiError = new ApiError(
          response.status,
          errorBody,
          errorBody?.message ?? errorBody?.error ?? `Request failed with status ${response.status}`
        );

        // Retry on 5xx errors, throw immediately on 4xx
        if (response.status >= RETRYABLE_MIN_STATUS && attempt < MAX_RETRIES) {
          lastError = apiError;
          continue;
        }

        throw apiError;
      }

      // 3. JSON responses: parse and unwrap { data }
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const json: ApiResponse<T> = await response.json();
        return json.data;
      }

      // 4. Non-JSON: return undefined
      return undefined as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // If it's already an ApiError, re-throw (unless retrying)
      if (error instanceof ApiError) {
        throw error;
      }

      // Network / timeout errors
      if (isNetworkError(error)) {
        if (attempt < MAX_RETRIES) {
          lastError = error;
          continue;
        }

        const message =
          error instanceof DOMException && error.name === "AbortError"
            ? "Request timed out. Please check your connection and try again."
            : "Unable to connect. Please check your internet connection.";

        throw new ApiError(0, null, message);
      }

      // Unknown error – don't retry
      throw error;
    }
  }

  // Exhausted retries
  if (lastError instanceof ApiError) {
    throw lastError;
  }
  throw new ApiError(0, null, "Request failed after multiple attempts. Please try again later.");
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: any) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(url: string, body: any) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
  patch: <T>(url: string, body: any) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
};
