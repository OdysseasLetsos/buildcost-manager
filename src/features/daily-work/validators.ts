import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const numericAmount = (fieldLabel: string) =>
  z
    .string()
    .trim()
    .transform((value) => {
      if (!value) {
        return 0;
      }

      const amount = Number(value.replace(",", "."));

      return Number.isFinite(amount) ? amount : Number.NaN;
    })
    .refine((value) => !Number.isNaN(value), {
      message: `${fieldLabel} πρέπει να είναι αριθμός.`,
    })
    .refine((value) => value >= 0, {
      message: `${fieldLabel} δεν μπορεί να είναι αρνητικό.`,
    });

export const dailyWorkInputSchema = z
  .object({
    monthId: z.string().uuid("Επιλέξτε μήνα."),
    employeeId: z.string().uuid("Επιλέξτε εργαζόμενο."),
    projectId: z.string().uuid("Επιλέξτε έργο."),
    workDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Η ημερομηνία δεν είναι έγκυρη."),
    hours: numericAmount("Οι ώρες"),
    overtimeHours: numericAmount("Οι υπερωρίες"),
    expenseAmount: numericAmount("Τα έξοδα"),
    expenseDescription: optionalText,
    workDescription: optionalText,
    notes: optionalText,
  })
  .refine(
    (input) =>
      input.hours > 0 || input.overtimeHours > 0 || input.expenseAmount > 0,
    {
      message:
        "Συμπληρώστε ώρες, υπερωρίες ή έξοδα για να γίνει η καταχώρηση.",
      path: ["hours"],
    },
  );

export const dailyWorkEntryIdSchema = z
  .string()
  .uuid("Η καταχώρηση δεν είναι έγκυρη.");

export type DailyWorkInput = z.infer<typeof dailyWorkInputSchema>;
