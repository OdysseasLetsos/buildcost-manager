import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const requiredText = (message: string) => z.string().trim().min(1, message);

export const supplierInputSchema = z.object({
  name: requiredText("Η επωνυμία προμηθευτή είναι υποχρεωτική."),
  taxId: requiredText("Το ΑΦΜ είναι υποχρεωτικό."),
  address: optionalText,
  phone: optionalText,
  email: optionalText,
  notes: optionalText,
});

export type SupplierInput = z.infer<typeof supplierInputSchema>;
