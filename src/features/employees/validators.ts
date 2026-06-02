import { z } from "zod";
import { employeeTypes } from "./types";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const optionalRate = z
  .string()
  .trim()
  .transform((value) => {
    if (!value) {
      return null;
    }

    const amount = Number(value.replace(",", "."));

    return Number.isFinite(amount) ? amount : Number.NaN;
  })
  .refine((value) => value === null || !Number.isNaN(value), {
    message: "Η τιμή πρέπει να είναι αριθμός.",
  })
  .refine((value) => value === null || value >= 0, {
    message: "Η τιμή δεν μπορεί να είναι αρνητική.",
  });

export const employeeInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Συμπληρώστε ονοματεπώνυμο.")
    .max(200, "Το ονοματεπώνυμο είναι πολύ μεγάλο."),
  employeeType: z.enum(employeeTypes, {
    message: "Ο τύπος εργαζομένου δεν είναι έγκυρος.",
  }),
  dailyRate: optionalRate,
  hourlyRate: optionalRate,
  overtimeRate: optionalRate,
  active: z
    .string()
    .nullable()
    .transform((value) => value === "true"),
  notes: optionalText,
});

export const employeeIdSchema = z.string().uuid("Ο εργαζόμενος δεν είναι έγκυρος.");

export type EmployeeInput = z.infer<typeof employeeInputSchema>;
