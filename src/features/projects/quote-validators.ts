import { z } from "zod";
import { projectQuoteStatuses } from "./types";

const moneyValue = z
  .string()
  .trim()
  .transform((value) => Number(value.replace(",", ".")))
  .refine((value) => Number.isFinite(value) && value >= 0, {
    message: "Το ποσό πρέπει να είναι έγκυρος μη αρνητικός αριθμός.",
  });

export const projectQuoteInputSchema = z
  .object({
    projectId: z.string().uuid("Το έργο δεν είναι έγκυρο."),
    title: z
      .string()
      .trim()
      .min(1, "Συμπληρώστε τίτλο προσφοράς.")
      .max(200, "Ο τίτλος της προσφοράς είναι πολύ μεγάλος."),
    description: z
      .string()
      .trim()
      .min(1, "Συμπληρώστε περιγραφή εργασιών.")
      .max(5000, "Η περιγραφή εργασιών είναι πολύ μεγάλη."),
    amount: moneyValue.refine((value) => value > 0, {
      message: "Το ποσό προσφοράς πρέπει να είναι μεγαλύτερο από μηδέν.",
    }),
    vatAmount: moneyValue,
    totalAmount: moneyValue.refine((value) => value > 0, {
      message: "Το συνολικό ποσό πρέπει να είναι μεγαλύτερο από μηδέν.",
    }),
    quoteDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Η ημερομηνία προσφοράς δεν είναι έγκυρη."),
    status: z.enum(projectQuoteStatuses, {
      message: "Η κατάσταση προσφοράς δεν είναι έγκυρη.",
    }),
    rejectionReason: z
      .string()
      .trim()
      .transform((value) => (value.length > 0 ? value : null)),
  })
  .superRefine((input, context) => {
    if (input.status === "rejected" && !input.rejectionReason) {
      context.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Συμπληρώστε τον λόγο απόρριψης.",
      });
    }

    if (Math.abs(input.totalAmount - (input.amount + input.vatAmount)) > 0.01) {
      context.addIssue({
        code: "custom",
        path: ["totalAmount"],
        message: "Το συνολικό ποσό πρέπει να ισούται με ποσό προσφοράς και ΦΠΑ.",
      });
    }
  });

export type ProjectQuoteInput = z.infer<typeof projectQuoteInputSchema>;

export const projectQuoteIdSchema = z
  .string()
  .uuid("Η προσφορά δεν είναι έγκυρη.");
