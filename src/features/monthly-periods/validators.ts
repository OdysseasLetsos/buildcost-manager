import { z } from "zod";

export const monthKeySchema = z
  .string()
  .trim()
  .regex(/^[0-9]{4}-(0[1-9]|1[0-2])$/, "Ο μήνας πρέπει να έχει μορφή YYYY-MM.");

export const monthlyPeriodInputSchema = z.object({
  monthKey: monthKeySchema,
});

export const monthlyPeriodIdSchema = z
  .string()
  .uuid("Ο μήνας δεν είναι έγκυρος.");

export type MonthlyPeriodInput = z.infer<typeof monthlyPeriodInputSchema>;
