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

const requiredContractAmount = z
  .string()
  .trim()
  .transform((value) => Number(value.replace(",", ".")))
  .refine((value) => Number.isFinite(value), {
    message: "Το ποσό σύμβασης πρέπει να είναι αριθμός.",
  })
  .refine((value) => value > 0, {
    message: "Το ποσό σύμβασης πρέπει να είναι μεγαλύτερο από 0.",
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

export const employeeProjectContractInputSchema = z.object({
  id: z.string().uuid().optional(),
  projectId: z.string().uuid("Επιλέξτε έργο."),
  contractAmount: requiredContractAmount,
  notes: optionalText,
});

export const employeeProjectContractsInputSchema = z
  .array(employeeProjectContractInputSchema)
  .superRefine((contracts, context) => {
    const projectIds = new Set<string>();

    for (const [index, contract] of contracts.entries()) {
      if (projectIds.has(contract.projectId)) {
        context.addIssue({
          code: "custom",
          path: [index, "projectId"],
          message: "Το έργο έχει ήδη προστεθεί για αυτόν τον συνεργάτη.",
        });
      }

      projectIds.add(contract.projectId);
    }
  });

export const employeeIdSchema = z.string().uuid("Ο εργαζόμενος δεν είναι έγκυρος.");

export type EmployeeInput = z.infer<typeof employeeInputSchema>;
export type EmployeeProjectContractInput = z.infer<typeof employeeProjectContractInputSchema>;
