import { AxiosError } from "axios";

export interface IErrorResponse {
  message?: string;
  error?: string;
  status?: "success" | "fail" | "error";
}

export type TError = AxiosError<IErrorResponse>;
