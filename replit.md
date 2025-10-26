# Eska Yapı İnşaat Proje Yönetim Sistemi

## Overview

This project is a comprehensive construction project management system developed for Eska Yapı Mühendislik İnşaat Emlak Turizm ve Ticaret Limited Şirketi. Its primary purpose is to streamline the management of construction projects, encompassing financial tracking, site diary maintenance, subcontractor and customer relationship management, and Turkish tax calculations. The system features a fully Turkish interface designed with Material Design principles adapted for enterprise construction management, aiming to provide an efficient and professional tool for the construction industry.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript (Vite).
**UI Component Library**: shadcn/ui built on Radix UI primitives with custom styling.
**Design System**: Material Design adapted for construction management, custom theme (light/dark modes via Tailwind CSS, HSL-based color system), Inter/Roboto fonts, Turkish language interface, print-friendly layouts, and monospaced fonts for financial figures.
**State Management**: TanStack Query for server state, React Context for authentication, local component state for UI.
**Routing**: Wouter for client-side routing with protected routes.

### Backend Architecture

**Runtime**: Node.js with Express.js.
**Language**: TypeScript with ES modules.
**API Pattern**: RESTful API (`/api` prefix).
**Session Management**: Express sessions (MemoryStore for dev, connect-pg-simple for prod), Passport.js with LocalStrategy, scrypt for password hashing.
**Storage Interface**: Abstracted `IStorage` layer; currently uses DatabaseStorage with PostgreSQL/Neon via Drizzle ORM.
**Key Design Decisions**: Storage abstraction, middleware for logging, environment variable-based session secrets, credential-based authentication, dev-only registration.

### Data Schema

**Database ORM**: Drizzle ORM for PostgreSQL.
**Core Entities**: Projects, Transactions (income/expense), Tasks, Subcontractors, Customers, Site Diary Entries, Budget Items, Timesheets, Invoices (sales/purchase).
**Categorization System**: İş Grubu (Work Groups) and Rayiç Grubu (Cost Groups) with predefined categories for standardization.
**Key Design Decisions**: Enum-based categorization, decimal precision for financial data, UUID primary keys, Drizzle-Zod for schema validation.

### Business Logic Layer

**Turkish Tax Calculations**: Isolated module (`shared/taxCalculations.ts`) for KDV (VAT), progressive income tax, and corporate tax calculations. Supports year-specific tax brackets and provides comprehensive tax summaries.

### Development Environment

**Build System**: Vite (frontend) and esbuild (backend).
**Code Quality**: TypeScript strict mode, path aliases, ESM.
**Development Features**: Replit-specific plugins (error overlay, dev banner), HMR via Vite, request logging middleware.

### Feature Specifications

*   **Hakediş Modülü (Progress Payment Module)**: Advanced features include an Avans Takip Sistemi (Advance Tracking System) for real-time advance calculation and deduction, and kurumsal yazdırma formatı (corporate printing format) for detailed progress payment reports. Redesigned with a transaction-based system allowing selection of expense transactions for payment calculation, with detailed view dialogs.
*   **İş Programı (Work Schedule) Module**: Complete implementation with tasks table (title, description, project linkage, dates, status, priority, progress, assignedTo, checklist). Features a summary dashboard, advanced filtering, sorting, task cards with progress bars, and a comprehensive task form dialog.
*   **Hakediş Module - Advanced Financial Calculations**: Integration of `contractorFeeRate`, `grossAmount`, `advanceDeductionRate`, `advanceDeduction`, and `netPayment` fields. Real-time auto-calculation of these values within the form.
*   **Reports Module**: Multi-level filtering system for Financial, Operational, Project, and Progress Payment Reports. Includes financial summary cards, tax calculations, trend charts, and detailed tables.
*   **Bütçe-Keşif (Budget-Exploration) Print Feature**: Print functionality for budget items with optimized table layouts.
*   **Project Detail Page**: Fetches and displays real project data from the API.

## External Dependencies

### Database

**Provider**: Neon (Serverless PostgreSQL)
**Integration**: `@neondatabase/serverless`, Drizzle ORM, `DATABASE_URL` environment variable.

### UI Component Libraries

**Core**: Radix UI primitives.
**Styling**: Tailwind CSS with custom design tokens, PostCSS, Class Variance Authority (CVA).

### Utility Libraries

*   **date-fns**: Date manipulation and formatting (Turkish locale support).
*   **wouter**: Lightweight routing.
*   **zod**: Schema validation.
*   **nanoid**: Secure random ID generation.
*   **cmdk**: Command palette component.

### Session Storage

*   **connect-pg-simple**: PostgreSQL session store (production).
*   **memorystore**: In-memory session store (development).

### Development Tools

*   **Replit plugins**: For development experience enhancements.
*   **tsx**: TypeScript execution for dev server.
*   **esbuild**: Fast JavaScript bundler.