import { NextRequest, NextResponse } from "next/server";

const devTestApiKey = "dev-test-key";

function disabledInProduction() {
  return process.env.NODE_ENV === "production";
}

function methodNotAllowed() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export function GET() {
  return disabledInProduction() ? new NextResponse(null, { status: 404 }) : methodNotAllowed();
}

export function PUT() {
  return disabledInProduction() ? new NextResponse(null, { status: 404 }) : methodNotAllowed();
}

export function PATCH() {
  return disabledInProduction() ? new NextResponse(null, { status: 404 }) : methodNotAllowed();
}

export function DELETE() {
  return disabledInProduction() ? new NextResponse(null, { status: 404 }) : methodNotAllowed();
}

export async function POST(request: NextRequest) {
  // Development-only fake invoice extraction provider. It must not be used in production.
  if (disabledInProduction()) {
    return new NextResponse(null, { status: 404 });
  }

  if (request.headers.get("x-api-key") !== devTestApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await request.json().catch(() => null);

  return NextResponse.json({
    supplier_name: "Παπαδόπουλος Δομικά Υλικά",
    supplier_vat: "123456789",
    invoice_number: "TEST-INV-001",
    invoice_date: "2026-09-02",
    net_amount: 100,
    vat_amount: 24,
    total_amount: 124,
    currency: "EUR",
    description: "Δοκιμαστικό τιμολόγιο από dev test provider",
    line_items: [
      {
        description: "Τσιμέντο",
        quantity: 10,
        unit_price: 10,
        net_amount: 100,
        vat_rate: 24,
        total_amount: 124,
      },
    ],
  });
}
