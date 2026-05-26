const DEFAULT_TIMEOUT_MS = 15000;

export class FetchJsonError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown
  ) {
    super(message);
    this.name = "FetchJsonError";
  }
}

type FetchJsonOptions = RequestInit & {
  timeoutMs?: number;
};

async function readResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<unknown>;
  }

  const text = await response.text();
  return text || undefined;
}

export async function fetchJson<T>(
  url: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS, headers, signal, ...options }: FetchJsonOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...headers,
      },
      signal: controller.signal,
    });

    const payload = await readResponsePayload(response);

    if (!response.ok) {
      const serverMessage =
        payload && typeof payload === "object" && "message" in payload
          ? String(payload.message)
          : "";

      const message = response.status === 429
        ? "Too many attempts. Please wait a moment and try again."
        : response.status === 401 || response.status === 403
        ? "Session expired. Please log in again."
        : serverMessage || `Request failed with status ${response.status}`;

      throw new FetchJsonError(message, response.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new FetchJsonError("Request timed out. Please try again.", 408);
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
