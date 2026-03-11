import type { ApiResponse } from "../types/payroll";

export function jsonResponse<T>(
  data: T,
  status = 200
): Response {
  return Response.json(
    { success: true, data } as ApiResponse<T>,
    { status }
  );
}

export function errorResponse(
  message: string,
  status = 400,
  errors?: unknown
): Response {
  return Response.json(
    {
      success: false,
      message,
      ...(errors != null && { errors }),
    } as ApiResponse<undefined>,
    { status }
  );
}
