import { z } from "zod";
import {
  expenseAllocationMethods,
  expenseScopes,
  officeExpenseSubtypes,
  transportExpenseSubtypes,
} from "./constants";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const requiredText = (message: string) => z.string().trim().min(1, message);

const optionalUuid = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .pipe(z.string().uuid("Η επιλογή δεν είναι έγκυρη.").nullable());

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
  expenseSubtype: optionalText,
  officeId: optionalUuid.optional(),
  vehicleId: optionalUuid.optional(),
  description: optionalText,
  amount: positiveAmount,
  allocationMethod: z.enum(expenseAllocationMethods, {
    message: "Επιλέξτε μέθοδο κατανομής.",
  }),
  notes: optionalText,
}).superRefine((input, context) => {
  if (input.category === "office") {
    if (!input.officeId) {
      context.addIssue({
        code: "custom",
        path: ["officeId"],
        message: "Επιλέξτε γραφείο.",
      });
    }

    if (
      !input.expenseSubtype ||
      !officeExpenseSubtypes.some((subtype) => subtype.value === input.expenseSubtype)
    ) {
      context.addIssue({
        code: "custom",
        path: ["expenseSubtype"],
        message: "Επιλέξτε τύπο εξόδου γραφείου.",
      });
    }
  }

  if (input.category === "transport") {
    if (!input.vehicleId) {
      context.addIssue({
        code: "custom",
        path: ["vehicleId"],
        message: "Επιλέξτε όχημα.",
      });
    }

    if (
      !input.expenseSubtype ||
      !transportExpenseSubtypes.some(
        (subtype) => subtype.value === input.expenseSubtype,
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["expenseSubtype"],
        message: "Επιλέξτε τύπο εξόδου μεταφορικών.",
      });
    }
  }
});

export const companyOfficeInputSchema = z.object({
  name: requiredText("Το όνομα γραφείου είναι υποχρεωτικό."),
  address: optionalText,
  notes: optionalText,
});

export const companyVehicleInputSchema = z.object({
  name: requiredText("Το όνομα οχήματος είναι υποχρεωτικό."),
  plateNumber: optionalText,
  model: optionalText,
  notes: optionalText,
});

export const expenseIdSchema = z
  .string()
  .uuid("Το έξοδο δεν είναι έγκυρο.");

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
export type CompanyOfficeInput = z.infer<typeof companyOfficeInputSchema>;
export type CompanyVehicleInput = z.infer<typeof companyVehicleInputSchema>;
