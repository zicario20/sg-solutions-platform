import { z } from "zod";

const normalizedEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(254));

const loginRequestSchema = z
  .object({
    email: normalizedEmail,
    password: z.string().min(1).max(1024),
  })
  .strict();

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export function parseLoginRequest(input: unknown): LoginRequest {
  return loginRequestSchema.parse(input);
}
