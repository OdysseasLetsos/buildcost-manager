import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const positiveAmount = (fieldLabel: string) =>
  z
    .string()
    .trim()
    .transform((value) => Number(value.replace(",", ".")))
    .refine((value) => Number.isFinite(value), {
      message: `${fieldLabel} πρέπει να είναι αριθμός.`,
    })
    .refine((value) => value > 0, {
      message: `${fieldLabel} πρέπει να είναι μεγαλύτερο από 0.`,
    });

export const paymentInputSchema = z.object({
  id: z.string().uuid("Η πληρωμή δεν είναι έγκυρη.").optional(),
  monthId: z.string().uuid("Επιλέξτε μήνα."),
  employeeId: z.string().uuid("Επιλέξτε εργαζόμενο."),
  paymentDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Η ημερομηνία δεν είναι έγκυρη."),
  amount: positiveAmount("Το ποσό"),
  paymentMethod: z.enum(["cash", "bank", "other"], {
    message: "Επιλέξτε τρόπο πληρωμής.",
  }),
  notes: optionalText,
});

export const paymentIdSchema = z
  .string()
  .uuid("Η πληρωμή δεν είναι έγκυρη.");

export type PaymentInput = z.infer<typeof paymentInputSchema>;
