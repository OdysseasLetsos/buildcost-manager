export function generatePdfBuffer({
  title,
  monthLabel,
  companyName,
}: {
  title: string;
  monthLabel: string;
  companyName: string;
}): Buffer {
  const content = [
    title,
    companyName,
    monthLabel,
    "",
    "Η εξαγωγή PDF θα ενεργοποιηθεί σε επόμενη έκδοση.",
  ].join("\n");

  return Buffer.from(content, "utf8");
}
