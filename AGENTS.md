# BuildCost Manager — Codex Instructions

## Project goal

BuildCost Manager is a SaaS web application for construction company project costing.

The app tracks:
- projects
- employees
- monthly periods
- daily work entries
- employee payments
- IKA/social insurance
- materials
- company expenses
- office expenses
- revenues
- project summary
- reports
- AI invoice review queue

## Architecture

Use a Modular Monolith architecture.

Folder rules:
- src/app: Next.js routes and page entry points
- src/features: feature-specific UI, actions, services, validators and types
- src/core: cross-cutting business logic such as auth, tenants, roles, entitlements, audit
- src/shared: reusable UI components, hooks, utils
- src/integrations: external services such as Supabase, email, AI

Import direction:
app -> features -> core -> shared

Never import from features into core.

## Stack

Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- Zod
- React Hook Form
- TanStack Table where useful

## Coding rules

- Do not refactor unrelated files.
- Do not rewrite the whole app.
- Keep every change scoped to the requested task.
- Prefer simple, readable code.
- Use TypeScript types.
- Use Zod validation for forms/server actions.
- Use Greek labels in the UI.
- Keep business logic out of UI components when possible.
- Server-side authorization is required for every mutation.
- Feature checks must not be frontend-only.
- Do not add new production dependencies unless explicitly asked.
- Do not remove existing functionality without instruction.

## Security rules

- Every tenant-owned business table must include company_id.
- Never trust client-side company_id.
- Always check authenticated user and company membership server-side.
- Use Supabase RLS for tenant isolation.
- Use role checks for mutations.
- Write audit logs for create/update/delete actions.
- Locked months must not be mutated.

## Feature flags / entitlements

Use feature flags and entitlements internally.

Features include:
- projects
- employees
- monthly_periods
- daily_work
- payments
- ika
- materials
- expenses
- revenues
- project_summary
- reports_pdf
- reports_excel
- ai_invoice_import
- email_invoice_import
- advanced_analytics

## UI direction

The UI should be:
- clean
- friendly
- professional
- desktop-first
- suitable for non-technical office staff
- light theme
- deep blue sidebar
- rounded cards
- clear Greek labels

## Testing / quality

After changes:
- run typecheck if available
- run lint if available
- run build if available
- report what changed
- report any errors honestly