import { z } from "zod";

export const userResponseSchema = z.object({
  "address": z.null(),
  "created_at": z.number(),
  "id": z.string(),
  "is_active": z.boolean(),
  "new_field": z.string(),
  "price": z.string(),
  "userId": z.number(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
