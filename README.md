This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## AI Invoice Extraction Local Test

Mock mode is the default and does not call any external OCR or AI provider:

```env
INVOICE_EXTRACTION_MODE=mock
INVOICE_EXTRACTION_API_URL=
INVOICE_EXTRACTION_API_KEY=
```

For local adapter testing only, the app includes a development-only fake provider at
`/api/dev/invoice-extraction-test`. It is disabled in production and is not real
OCR. Configure `.env.local` like this, restart `npm run dev`, then use the Materials
invoice upload flow:

```env
INVOICE_EXTRACTION_MODE=external
INVOICE_EXTRACTION_API_URL=http://localhost:3000/api/dev/invoice-extraction-test
INVOICE_EXTRACTION_API_KEY=dev-test-key
```

Phase 3B will connect the real external AI/OCR endpoint and define the final
request contract.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
