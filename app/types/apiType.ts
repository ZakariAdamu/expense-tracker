export interface ApiResponse<T = unknown> {
  status: "success" | "error" | string;
  message?: string;
  data: T;
  errors?: unknown[];
}
