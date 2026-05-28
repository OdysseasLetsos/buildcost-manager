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

export const ikaInputSchema = z.object({
  id: z.string().uuid("Η εγγραφή ΙΚΑ δεν είναι έγκυρη.").optional(),
  monthId: z.string().uuid("Επιλέξτε μήνα."),
  employeeId: z.string().uuid("Επιλέξτε εργαζόμενο."),
  ikaAmount: positiveAmount("Το ποσό ΙΚΑ"),
  notes: optionalText,
});

export const ikaIdSchema = z
  .string()
  .uuid("Η εγγραφή ΙΚΑ δεν είναι έγκυρη.");

export type IkaInput = z.infer<typeof ikaInputSchema>;
