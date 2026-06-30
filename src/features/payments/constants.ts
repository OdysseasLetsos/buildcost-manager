export const employeeBenefitTypes = [
  "allowance",
  "christmas_gift",
  "easter_gift",
  "vacation_allowance",
  "other",
] as const;

export const employeeBenefitTypeLabels: Record<
  (typeof employeeBenefitTypes)[number],
  string
> = {
  allowance: "Επίδομα",
  christmas_gift: "Δώρο Χριστουγέννων",
  easter_gift: "Δώρο Πάσχα",
  vacation_allowance: "Επίδομα άδειας",
  other: "Άλλο",
};
