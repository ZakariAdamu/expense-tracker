import { AxiosRequestConfig } from "axios";
import api from "./api";
import { ApiResponse } from "../types/apiType";

export const get = async <T>(
  url: string,
  params?: object,
): Promise<ApiResponse<T>> => {
  const response = await api.get(url, { params });
  return response.data as ApiResponse<T>;
};

export const post = async <T>(
  url: string,
  data?: object,
): Promise<ApiResponse<T>> => {
  let config: AxiosRequestConfig = {};

  // If data is FormData, don't set Content-Type (let browser set it with boundary)
  if (data instanceof FormData) {
    config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
  }
  const response = await api.post(url, data, config);
  return response.data as ApiResponse<T>;
};

export const put = async <T>(
  url: string,
  data?: object,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await api.put(url, data, config);
  return response.data as ApiResponse<T>;
};

export const patch = async <T>(
  url: string,
  data?: object,
): Promise<ApiResponse<T>> => {
  const response = await api.patch(url, data);
  return response.data as ApiResponse<T>;
};

export const del = async <T>(
  url: string,
  data?: object,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const response = await api.delete(url, {
    data,
    ...config,
  });
  return response.data as ApiResponse<T>;
};
