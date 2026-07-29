import { z } from "zod";

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

export const materialInputSchema = z
  .object({
    id: z.string().uuid("Το τιμολόγιο υλικών δεν είναι έγκυρο.").optional(),
    monthId: z.string().uuid("Επιλέξτε μήνα."),
    projectId: z.string().uuid("Επιλέξτε έργο."),
    invoiceDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Η ημερομηνία τιμολογίου δεν είναι έγκυρη."),
    supplierId: z
      .string()
      .trim()
      .uuid(
        "Πρέπει να επιλέξετε προμηθευτή πριν δημιουργήσετε τιμολόγιο υλικών.",
      ),
    supplierName: requiredText("Συμπληρώστε προμηθευτή."),
    supplierVat: optionalText,
    invoiceNumber: requiredText("Συμπληρώστε αριθμό τιμολογίου."),
    description: optionalText,
    netAmount: nonNegativeAmount("Η καθαρή αξία"),
    vatAmount: nonNegativeAmount("Το ΦΠΑ"),
    totalAmount: nonNegativeAmount("Το σύνολο"),
    paidAmount: nonNegativeAmount("Το πληρωμένο ποσό"),
    paymentStatus: z.enum(["pending", "partial", "paid"], {
      message: "Επιλέξτε κατάσταση πληρωμής.",
    }),
    notes: optionalText,
  })
  .refine(
    (input) => Math.abs(input.totalAmount - input.netAmount - input.vatAmount) <= 0.01,
    {
      message: "Το σύνολο πρέπει να ισούται με καθαρή αξία + ΦΠΑ.",
      path: ["totalAmount"],
    },
  );

export const materialIdSchema = z
  .string()
  .uuid("Το τιμολόγιο υλικών δεν είναι έγκυρο.");

export type MaterialInput = z.infer<typeof materialInputSchema>;
