import { z } from "zod";
import { revenueStatuses, revenueTypes } from "./constants";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const requiredText = (message: string) => z.string().trim().min(1, message);

const nonNegativeAmount = (fieldLabel: string) =>
  z
    .string()
    .trim()
    .transform((value) => Number(value.replace(",", ".")))
    .refine((value) => Number.isFinite(value), {
      message: `${fieldLabel} πρέπει να είναι αριθμός.`,
    })
    .refine((value) => value >= 0, {
      message: `${fieldLabel} δεν μπορεί να είναι αρνητικό.`,
    });

export const revenueInputSchema = z.object({
  id: z.string().uuid("Το έσοδο δεν είναι έγκυρο.").optional(),
  monthId: z.string().uuid("Επιλέξτε μήνα."),
  projectId: z.string().uuid("Επιλέξτε έργο."),
  revenueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Η ημερομηνία δεν είναι έγκυρη."),
  clientName: requiredText("Συμπληρώστε πελάτη."),
  invoiceNumber: optionalText,
  revenueType: z.enum(revenueTypes, {
    message: "Επιλέξτε τύπο εσόδου.",
  }),
  invoicedAmount: nonNegativeAmount("Το τιμολογηθέν ποσό"),
  receivedAmount: nonNegativeAmount("Το εισπραχθέν ποσό"),
  remainingAmount: nonNegativeAmount("Το υπόλοιπο"),
  status: z.enum(revenueStatuses, {
    message: "Επιλέξτε κατάσταση.",
  }),
  notes: optionalText,
});

export const revenueIdSchema = z
  .string()
  .uuid("Το έσοδο δεν είναι έγκυρο.");

export type RevenueInput = z.infer<typeof revenueInputSchema>;
