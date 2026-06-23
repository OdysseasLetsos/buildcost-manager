import { z } from "zod";
import { projectStatuses } from "./types";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Η ημερομηνία δεν είναι έγκυρη.",
  });

const optionalBudget = z
  .string()
  .trim()
  .transform((value) => {
    if (!value) {
      return null;
    }

    const normalized = value.replace(",", ".");
    const amount = Number(normalized);

    return Number.isFinite(amount) ? amount : Number.NaN;
  })
  .refine((value) => value === null || !Number.isNaN(value), {
    message: "Ο προϋπολογισμός πρέπει να είναι αριθμός.",
  })
  .refine((value) => value === null || value >= 0, {
    message: "Ο προϋπολογισμός δεν μπορεί να είναι αρνητικός.",
  });

export const projectInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Συμπληρώστε κωδικό έργου.")
      .max(50, "Ο κωδικός έργου είναι πολύ μεγάλος."),
    name: z
      .string()
      .trim()
      .min(1, "Συμπληρώστε όνομα έργου.")
      .max(200, "Το όνομα έργου είναι πολύ μεγάλο."),
    clientName: optionalText,
    location: optionalText,
    status: z.enum(projectStatuses, {
      message: "Η κατάσταση έργου δεν είναι έγκυρη.",
    }),
    budgetAmount: optionalBudget,
    offerDate: optionalDate,
    startDate: optionalDate,
    endDate: optionalDate,
    cancellationDate: optionalDate,
    notes: optionalText,
  })
  .superRefine((input, context) => {
    if (input.status === "in_progress" && !input.startDate) {
      context.addIssue({
        code: "custom",
        message: "Η ημερομηνία έναρξης είναι υποχρεωτική.",
        path: ["startDate"],
      });
    }

    if (input.status === "completed") {
      if (!input.startDate) {
        context.addIssue({
          code: "custom",
          message: "Η ημερομηνία έναρξης είναι υποχρεωτική.",
          path: ["startDate"],
        });
      }

      if (!input.endDate) {
        context.addIssue({
          code: "custom",
          message: "Η ημερομηνία λήξης είναι υποχρεωτική.",
          path: ["endDate"],
        });
      }
    }

    if (input.status === "cancelled" && !input.cancellationDate) {
      context.addIssue({
        code: "custom",
        message: "Η ημερομηνία ακύρωσης είναι υποχρεωτική.",
        path: ["cancellationDate"],
      });
    }
  })
  .refine(
    (input) =>
      !input.startDate ||
      !input.endDate ||
      new Date(input.endDate) >= new Date(input.startDate),
    {
      message: "Η ημερομηνία λήξης δεν μπορεί να είναι πριν την έναρξη.",
      path: ["endDate"],
    },
  );

export const projectIdSchema = z.string().uuid("Το έργο δεν είναι έγκυρο.");

export type ProjectInput = z.infer<typeof projectInputSchema>;

export function normalizeProjectDates(input: ProjectInput) {
  if (input.status === "offer") {
    return {
      offerDate: input.offerDate,
      startDate: null,
      endDate: null,
      cancellationDate: null,
    };
  }

  if (input.status === "in_progress") {
    return {
      offerDate: null,
      startDate: input.startDate,
      endDate: input.endDate,
      cancellationDate: null,
    };
  }

  if (input.status === "completed") {
    return {
      offerDate: null,
      startDate: input.startDate,
      endDate: input.endDate,
      cancellationDate: null,
    };
  }

  return {
    offerDate: null,
    startDate: null,
    endDate: null,
    cancellationDate: input.cancellationDate,
  };
}
