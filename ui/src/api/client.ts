/**
 * Base API client for AgentGateway
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production" ? "" : "http://localhost:15000");

export interface ApiError {
  message: string;
  status?: number;
  isConfigurationError?: boolean;
}

/**
 * Creates an API error object
 */
export function createApiError(
  message: string,
  status?: number,
  isConfigurationError = false,
): ApiError {
  return { message, status, isConfigurationError };
}

/**
 * Base fetch wrapper with error handling
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Special handling for configuration errors
      if (response.status === 500) {
        throw createApiError(
          `Server configuration error: ${errorText}`,
          500,
          true,
        );
      }

      throw createApiError(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        response.status,
      );
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    // Re-throw ApiError objects
    if (error && typeof error === "object" && "isConfigurationError" in error) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw createApiError(
        "Unable to connect to AgentGateway. Please ensure the server is running.",
        0,
      );
    }

    throw createApiError(
      `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * HTTP GET request
 */
export function get<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: "GET" });
}

/**
 * HTTP POST request
 */
export function post<T>(
  endpoint: string,
  data?: unknown,
  options?: RequestInit,
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * HTTP PUT request
 */
export function put<T>(
  endpoint: string,
  data?: unknown,
  options?: RequestInit,
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * HTTP DELETE request
 */
export function del<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: "DELETE" });
}

/**
 * HTTP PATCH request
 */
export function patch<T>(
  endpoint: string,
  data?: unknown,
  options?: RequestInit,
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}
