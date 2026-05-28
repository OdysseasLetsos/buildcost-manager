import { z } from "zod";
import { expenseAllocationMethods, expenseScopes } from "./constants";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const requiredText = (message: string) => z.string().trim().min(1, message);

const positiveAmount = z
  .string()
  .trim()
  .transform((value) => Number(value.replace(",", ".")))
  .refine((value) => Number.isFinite(value), {
    message: "Το ποσό πρέπει να είναι αριθμός.",
  })
  .refine((value) => value > 0, {
    message: "Το ποσό πρέπει να είναι μεγαλύτερο από 0.",
  });

export const expenseInputSchema = z.object({
  id: z.string().uuid("Το έξοδο δεν είναι έγκυρο.").optional(),
  monthId: z.string().uuid("Επιλέξτε μήνα."),
  expenseDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Η ημερομηνία δεν είναι έγκυρη."),
  scope: z.enum(expenseScopes, {
    message: "Επιλέξτε τύπο εξόδου.",
  }),
  category: requiredText("Επιλέξτε κατηγορία."),
  description: optionalText,
  amount: positiveAmount,
  allocationMethod: z.enum(expenseAllocationMethods, {
    message: "Επιλέξτε μέθοδο κατανομής.",
  }),
  notes: optionalText,
});

export const expenseIdSchema = z
  .string()
  .uuid("Το έξοδο δεν είναι έγκυρο.");

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
