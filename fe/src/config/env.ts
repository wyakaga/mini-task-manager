import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default("http://localhost:5000/api"),
  VITE_API_TIMEOUT: z.coerce.number().default(10000),
});

export const env = envSchema.parse(import.meta.env);
