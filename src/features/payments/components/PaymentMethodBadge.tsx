const methodLabels: Record<string, string> = {
  cash: "Μετρητά",
  bank: "Τράπεζα",
  other: "Άλλο",
};

export function PaymentMethodBadge({ method }: Readonly<{ method: string }>) {
  return (
    <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
      {methodLabels[method] ?? method}
    </span>
  );
}

export { methodLabels as paymentMethodLabels };
