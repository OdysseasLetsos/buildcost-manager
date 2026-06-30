import { z } from "zod";
import { employeeBenefitTypes } from "./constants";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

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

export const benefitInputSchema = z.object({
  id: z.string().uuid("Η εγγραφή δεν είναι έγκυρη.").optional(),
  monthId: z.string().uuid("Επιλέξτε μήνα."),
  employeeId: z.string().uuid("Επιλέξτε εργαζόμενο."),
  benefitType: z.enum(employeeBenefitTypes, {
    message: "Επιλέξτε τύπο.",
  }),
  amount: positiveAmount,
  benefitDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Η ημερομηνία δεν είναι έγκυρη."),
  notes: optionalText,
});

export const benefitIdSchema = z
  .string()
  .uuid("Η εγγραφή δεν είναι έγκυρη.");

export type BenefitInput = z.infer<typeof benefitInputSchema>;
