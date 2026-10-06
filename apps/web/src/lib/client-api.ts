export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Browser-only helper for talking to NestJS through the /api proxy.
// Same-origin + credentials: 'include' is what lets the httpOnly session
// cookie ride along; JS itself can never read it.
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    ...init,
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    if (
      data !== null &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
    ) {
      message = (data as { message: string }).message;
    }
    throw new ApiError(res.status, message);
  }
  return data as T;
}
