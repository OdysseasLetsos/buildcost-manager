# BuildCost Manager

BuildCost Manager is an ongoing B2B SaaS project designed to help small and medium-sized construction companies organize projects, employees, daily work, materials, expenses and related operational data.

The project is being developed with **Next.js, TypeScript, PostgreSQL and Supabase**, with input from MEP Construction to better understand real construction workflows and practical business requirements.

> **Project status:** Active development. Some features are still experimental or incomplete.

## What the application does

BuildCost Manager provides a central workspace for managing construction operations, including:

* Projects
* Employees and user roles
* Daily work
* Materials
* Expenses and revenues
* Monthly periods
* Project summaries and reporting
* AI-assisted invoice processing *(currently in development)*

The application follows a **multi-tenant SaaS architecture**, where company data is separated and users have different permissions depending on their role.

Authentication, authorization and data access are handled using Supabase and PostgreSQL, including **Row Level Security (RLS)**.

## AI-assisted invoice workflow

One of the features currently under development is an AI-assisted workflow for processing supplier invoices.

The intended flow is:

**Upload Invoice → Extract Information → Review / Correct → Approve → Save**

A key design decision is that extracted information is **not automatically treated as trusted application data**.

The user first reviews and, when necessary, corrects the extracted information. Only after approval can the data be stored in the relevant parts of the application, such as materials or expenses.

This keeps a human in control of the workflow and reduces the impact of incomplete or incorrect model output.

### Current AI status

The AI extraction functionality is currently running with **mock/development data**.

No production LLM or OCR provider is currently processing uploaded invoices.

The application includes an extraction adapter so that the extraction provider can be changed without redesigning the surrounding invoice workflow.

The next development stage is to connect the extraction endpoint to an **open-weight language model running on a dedicated server** and replace the current mock mechanism with real model inference.

For development testing, a fake provider is available at:

```text
/api/dev/invoice-extraction-test
```

It is development-only and is disabled in production.

## Architecture overview

```text
Construction Company
        │
        ▼
 BuildCost Manager
        │
        ├── Projects
        ├── Employees / Roles
        ├── Daily Work
        ├── Materials
        ├── Expenses / Revenues
        │
        └── Invoice Workflow
                │
                ▼
        Extraction Adapter
                │
          ┌─────┴─────┐
          ▼           ▼
     Mock Provider   External AI
       (current)      (planned)
                         │
                         ▼
                  Open-weight LLM
                         │
                         ▼
                  Review / Correct
                         │
                         ▼
                       Approve
                         │
                         ▼
                 Application Data
```

## Technology

* **Frontend / Application:** Next.js, React, TypeScript
* **Database:** PostgreSQL
* **Backend services:** Supabase
* **Authentication & Authorization:** Supabase Auth, role-based access
* **Data isolation:** Multi-tenant architecture and Row Level Security
* **AI integration:** Provider-independent extraction adapter *(mock provider currently)*
* **Deployment:** Vercel
* **Development:** Git / GitHub

## Language support

The current user interface is primarily available in **Greek**.

English localization is **not yet implemented** and is planned for a future development stage.

## Running locally

Install dependencies:

```bash
npm install
```

Create your `.env.local` file with the required Supabase configuration and start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Testing the invoice extraction adapter

Mock mode is the default and does not call an external OCR or AI provider:

```env
INVOICE_EXTRACTION_MODE=mock
INVOICE_EXTRACTION_API_URL=
INVOICE_EXTRACTION_API_KEY=
```

For local adapter testing, the application includes the development-only fake provider:

```env
INVOICE_EXTRACTION_MODE=external
INVOICE_EXTRACTION_API_URL=http://localhost:3000/api/dev/invoice-extraction-test
INVOICE_EXTRACTION_API_KEY=dev-test-key
```

Restart the development server after changing the environment variables.

## Roadmap

Current and upcoming development work includes:

* Connecting the invoice extraction endpoint to a real AI model
* Running an open-weight LLM on a dedicated server
* Improving invoice extraction and validation
* Expanding worker and administrator workflows
* English localization
* Performance and usability improvements
* Further reporting and project-management functionality

Live Demo

A deployed development version of BuildCost Manager is available here:

Live application: https://buildcost-manager.vercel.app/

The application is currently hosted on Vercel using the free tier and should be considered a development/demo environment rather than a production deployment.

Please note:

The current interface is primarily in Greek. English localization is planned.
The AI invoice extraction currently uses mock/development data and is not connected to a production LLM or OCR provider.
Some features are still under active development.
Deployment

The current development version is deployed on Vercel:

https://buildcost-manager.vercel.app/

The deployment is primarily used for testing and demonstrating the application's current functionality. As the project develops, the hosting and infrastructure can be adapted to the application's production requirements.
The AI functionality shown in the current repository should therefore be understood as an **integration architecture and development workflow**, rather than a completed production AI system.
