import axios from "axios";
import { toast } from "@heroui/react";
import { env } from "@/config/env";

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "An unexpected error occurred";

    if (status && status >= 400 && status < 500 && status !== 404) {
      toast.danger(message);
    } else if (status && status >= 500) {
      toast.danger("Server error. Please try again later.");
    }

    return Promise.reject(error);
  }
);
