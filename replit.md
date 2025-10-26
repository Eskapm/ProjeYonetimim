# Eska Yapı İnşaat Proje Yönetim Sistemi

## Overview

This is a construction project management system for Eska Yapı Mühendislik İnşaat Emlak Turizm ve Ticaret Limited Şirketi. The application is designed to manage construction projects, track financial transactions, maintain site diaries, manage subcontractors and customers, and calculate Turkish tax obligations. The interface is entirely in Turkish and follows Material Design principles adapted for enterprise construction management.

## Recent Changes (October 26, 2025)

**Reports Module Completed**:
- Comprehensive financial analytics dashboard with real-time data
- Date filtering system (Tüm Zamanlar, Bu Ay, Bu Yıl, Özel Tarih Aralığı)
- Financial summary cards displaying total income, expenses, and net profit
- Tax summary card showing KDV, corporate tax, net profit after tax, and total tax burden
- Monthly income/expense trend chart (LineChart) with chronological ordering
- Category analysis with pie charts for İş Grubu and Rayiç Grubu expense breakdowns
- Project-wise financial analysis table with profit/loss indicators
- All date filters use inclusive end-of-day timestamps (23:59:59.999) for accurate reporting
- Monthly trends sorted by YYYY-MM keys for proper chronological display
- Tax calculations use per-transaction arrays for accurate KDV computation
- E2E tested and verified working correctly

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript using Vite as the build tool

**UI Component Library**: shadcn/ui components built on Radix UI primitives with custom styling

**Design System**: 
- Material Design principles adapted for enterprise construction management
- Custom theme system supporting light/dark modes via Tailwind CSS
- Typography: Inter or Roboto font family with comprehensive type scale
- Color system: HSL-based with CSS variables for dynamic theming
- Spacing: Tailwind units (2, 4, 6, 8, 12, 16, 24) for consistent layout

**State Management**:
- TanStack Query (React Query) for server state management and data fetching
- React Context for authentication state (AuthContext)
- Local component state for UI interactions

**Routing**: Wouter for client-side routing with protected route implementation

**Key Design Decisions**:
- Information-dense layouts prioritizing efficiency over decoration
- Professional corporate identity with scannable layouts for quick decision-making
- All content in Turkish language
- Monospaced fonts for financial figures to ensure alignment
- Print-friendly layouts with dedicated print components

### Backend Architecture

**Runtime**: Node.js with Express.js server

**Language**: TypeScript with ES modules

**API Pattern**: RESTful API with `/api` prefix for all routes

**Session Management**:
- Express sessions with configurable store (currently MemoryStore for development)
- Passport.js for authentication with LocalStrategy
- Secure password hashing using scrypt with salt

**Authentication Flow**:
- Registration endpoint: `/api/register`
- Login endpoint: `/api/login`
- Logout endpoint: `/api/logout`
- User session endpoint: `/api/user`
- 401 responses handled gracefully in frontend

**Storage Interface**:
- Abstraction layer (IStorage interface) supports both in-memory and database storage
- **Currently using DatabaseStorage with PostgreSQL/Neon** for persistent data
- Drizzle ORM for type-safe database operations

**Key Design Decisions**:
- Storage abstraction pattern enables easy migration between storage implementations
- Middleware pattern for request logging and JSON response capture
- Session secret configuration with environment variable support
- Credential-based authentication suitable for enterprise internal tools
- Registration endpoint restricted to development environment only for security

### Data Schema

**Database ORM**: Drizzle ORM configured for PostgreSQL dialect

**Core Entities**:
- **Projects**: Construction projects with location, area, dates, status, customer relationship
- **Transactions**: Financial income/expense tracking with project linkage and categorization
- **Tasks**: Project tasks with status, dates, and responsible parties
- **Subcontractors**: Vendor management with contact details and specialties
- **Customers**: Client management with contact information
- **Site Diary Entries**: Daily construction logs with weather, work done, materials, workers
- **Budget Items**: Detailed cost estimation with quantity, unit pricing, and categorization
- **Timesheets**: Worker hour tracking by work group
- **Invoices**: Sales (Satış) and purchase (Alış) invoice management with automatic KDV calculation, payment tracking, customer/subcontractor linking, and optional project association

**Categorization System**:
- İş Grubu (Work Groups): Kaba İmalat, İnce İmalat, Mekanik Tesisat, Elektrik Tesisat, Çevre Düzenlemesi ve Altyapı, Genel Giderler ve Endirekt Giderler
- Rayiç Grubu (Cost Groups): Malzeme, İşçilik, Makine Ekipman, Paket, Genel Giderler ve Endirekt Giderler

**Key Design Decisions**:
- Enum-based categorization for standardized work and cost classification
- Decimal precision for financial amounts and measurements
- UUID primary keys for distributed system compatibility
- Schema validation with Drizzle-Zod integration

### Business Logic Layer

**Turkish Tax Calculations** (`shared/taxCalculations.ts`):
- KDV (VAT) calculation at 20% standard rate
- 2025 Income Tax with progressive brackets (15%, 20%, 27%, 35%, 40%)
- Corporate Tax computation
- Comprehensive tax summary with effective rate calculation
- Supports both individual and company tax scenarios

**Key Design Decisions**:
- Tax logic isolated in shared module accessible to both frontend and backend
- Year-specific tax brackets with detailed bracket breakdown
- Calculations return both tax amount and effective rate for transparency

### Development Environment

**Build System**: Vite with React plugin and TypeScript support

**Code Quality**:
- TypeScript strict mode enabled
- Path aliases for clean imports (`@/`, `@shared/`, `@assets/`)
- ESM module system throughout

**Development Features**:
- Replit-specific plugins for runtime error overlay and development banner
- Hot module replacement (HMR) via Vite
- Request logging middleware for API debugging
- Custom logger with formatted timestamps

**Production Build**:
- Vite bundles frontend to `dist/public`
- esbuild bundles backend to `dist/index.js`
- Separate build steps for client and server code

## External Dependencies

### Database

**Provider**: Neon (Serverless PostgreSQL)
- Connection via `@neondatabase/serverless` with WebSocket support
- Connection string from `DATABASE_URL` environment variable
- Drizzle ORM for type-safe database operations
- Migration support via drizzle-kit

### UI Component Libraries

**Core**: Radix UI primitives for accessible, unstyled components
- Comprehensive set including dialogs, dropdowns, tooltips, tabs, forms, etc.
- Full keyboard navigation and ARIA support

**Styling**: Tailwind CSS with custom design tokens
- CSS variables for theme customization
- PostCSS for processing
- Class variance authority (CVA) for component variants

### Utility Libraries

- **date-fns**: Date manipulation and formatting (Turkish locale support expected)
- **wouter**: Lightweight routing library
- **zod**: Schema validation
- **nanoid**: Secure random ID generation
- **cmdk**: Command palette component

### Session Storage

- **connect-pg-simple**: PostgreSQL session store for production
- **memorystore**: In-memory session store for development

### Development Tools

- **Replit plugins**: Development experience enhancements (cartographer, dev banner, error overlay)
- **tsx**: TypeScript execution for development server
- **esbuild**: Fast JavaScript bundler for production builds

### Key Integration Decisions

- WebSocket constructor override for Neon serverless compatibility
- Session store abstraction allows switching between memory and PostgreSQL based on environment
- Radix UI chosen for accessibility compliance and headless architecture
- All external services configured via environment variables for 12-factor app compliance