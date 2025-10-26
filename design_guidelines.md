# Eska Yapı İnşaat Proje Yönetim Sistemi - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Material Design principles adapted for enterprise construction management

**Justification:** This is a utility-focused, information-dense productivity application requiring efficiency, clear data hierarchy, and professional credibility. Material Design provides robust patterns for complex data tables, forms, and navigation while maintaining visual clarity.

**Key Design Principles:**
1. Information clarity over decoration
2. Efficient data entry and retrieval
3. Professional corporate identity
4. Scannable layouts for quick decision-making
5. Consistent patterns across modules

---

## Core Design Elements

### A. Typography

**Font System:** 
- Primary: 'Inter' or 'Roboto' from Google Fonts
- Fallback: -apple-system, system-ui, sans-serif

**Type Scale:**
- Hero/Dashboard Headers: text-4xl (36px) font-bold
- Section Headers: text-2xl (24px) font-semibold
- Card/Module Titles: text-xl (20px) font-semibold
- Body Text: text-base (16px) font-normal
- Table Headers: text-sm (14px) font-semibold uppercase tracking-wide
- Table Data/Labels: text-sm (14px) font-normal
- Captions/Meta: text-xs (12px) font-normal
- Numbers/Financial Data: font-mono for alignment

**Hierarchy Rules:**
- Turkish language throughout
- All financial figures right-aligned with consistent decimal formatting
- Status indicators use bold weights
- Form labels use text-sm font-medium

---

### B. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-4, p-6, p-8
- Section margins: mb-8, mb-12, mb-16
- Form field spacing: space-y-4, gap-6
- Card spacing: p-6 or p-8
- Table cell padding: px-4 py-3

**Grid System:**
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Dashboard: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Two-column forms: grid grid-cols-1 md:grid-cols-2 gap-6
- Three-column data displays: grid grid-cols-1 md:grid-cols-3 gap-4
- Financial summary cards: grid grid-cols-2 lg:grid-cols-4 gap-4

**Breakpoints:**
- Mobile-first approach
- sm: 640px (tablet portrait)
- md: 768px (tablet landscape)
- lg: 1024px (desktop)
- xl: 1280px (large desktop)

---

### C. Component Library

#### Navigation Structure

**Top Header Bar:**
- Fixed top navigation with Eska logo (left), h-16
- Logo: max-h-8 w-auto
- Company name: text-lg font-semibold next to logo
- Right side: User profile, notifications icon, settings dropdown
- Shadow: shadow-sm for subtle elevation

**Sidebar Navigation (Desktop lg:+):**
- Fixed left sidebar, w-64
- Menu items with icons (from Heroicons):
  - Ana Sayfa (Dashboard)
  - Projeler (Projects)
  - Gelir/Gider (Income/Expense)
  - Faturalar (Invoices)
  - Taşeronlar (Subcontractors)
  - Müşteriler (Customers)
  - Raporlar (Reports)
- Active state: font-semibold with subtle background treatment
- Padding: py-2 px-4 for menu items

**Mobile Navigation:**
- Hamburger menu icon in header
- Slide-out drawer with same menu structure
- Overlay backdrop when open

#### Dashboard Components

**Project Summary Cards:**
- Grid of 4 metric cards (Toplam Proje, Aktif Projeler, Toplam Gelir, Toplam Gider)
- Each card: rounded-lg shadow-sm p-6
- Icon + Label + Large Number + Trend indicator
- min-h-32

**Recent Activity List:**
- Table-based layout with striped rows
- Columns: Tarih, Proje, İşlem Tipi, Tutar, Durum
- Row height: py-3
- Pagination at bottom

**Quick Stats Chart Area:**
- İş Grubu and Rayiç Grubu breakdown
- Bar charts or pie charts (using Chart.js library)
- Container: rounded-lg shadow-sm p-6 min-h-80

#### Project Management

**Project List View:**
- Data table with sortable columns
- Columns: Proje Adı, Alan (m²), Başlangıç, Bitiş, Durum, m²/TL Maliyet, İşlemler
- Search bar: mb-6 with icon
- Filter dropdowns: Durum, Tarih Aralığı
- Action buttons: Yeni Proje (primary), Dışa Aktar

**Project Detail Page:**
- Breadcrumb navigation: mb-4
- Project header section with:
  - Title: text-3xl font-bold
  - Status badge, dates, location
  - Key metrics in 4-column grid (Alan, Toplam Maliyet, m²/TL, İlerleme %)
  - Tabs: Özet, Gelir/Gider, İş Programı, Bütçe, Notlar
- Tab content area: mt-8

#### Forms

**Project Creation/Edit Form:**
- Two-column grid layout (md:+)
- Field groups with subtle borders and spacing
- Input fields: rounded-md p-3 border
- Required field indicators: Asterisk in label
- Textarea for Açıklama/Not: rows-4
- Dual categorization selects prominently displayed
- Action buttons: Kaydet (primary), İptal (secondary), right-aligned

**Transaction Entry Form:**
- Compact single-column on mobile, two-column on desktop
- Date picker, amount (TL), project select (searchable dropdown)
- İş Grubu and Rayiç Grubu cascading selects
- Invoice number field (optional pattern)
- File upload for invoice attachment
- Real-time m²/TL calculation display

#### Data Display

**Financial Tables:**
- Striped rows for readability
- Sticky header on scroll
- Right-aligned number columns with consistent formatting (###,###.## TL)
- Action column (right): icon buttons for Edit, Delete, View Details
- Footer row for totals: font-semibold
- Responsive: horizontal scroll on mobile with fixed first column

**Budget Builder:**
- Editable table interface
- Columns: Kalem, Miktar, Birim, Birim Fiyat, Toplam, İş Grubu, Rayiç Grubu, İşlemler
- Inline editing capabilities
- Add new row button: + Yeni Kalem
- Auto-calculation of totals
- Summary panel: sticky right sidebar showing totals by categories

**Work Schedule (İş Programı):**
- Gantt chart visualization (using library like DHTMLX Gantt)
- Task list on left (w-80), timeline on right
- Task rows: py-2 with expand/collapse for subtasks
- Date range selector: mb-4
- Progress indicators on timeline bars

#### Reports & Analytics

**Report Dashboard:**
- Filter panel at top: Date range, Project select, İş Grubu/Rayiç Grubu filters
- Multiple chart types: Bar (comparisons), Line (trends), Pie (distributions)
- Data cards grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Export buttons: PDF, Excel (top-right)

**Comparison Views:**
- Side-by-side project comparison table
- Budget vs. Actual variance with percentage indicators
- Visual variance bars (progress-like indicators)

#### Supporting Components

**Modal Dialogs:**
- Overlay backdrop with opacity
- Centered modal: max-w-2xl for forms, max-w-4xl for tables
- Header: text-xl font-semibold p-6 with close button
- Content: p-6
- Footer: p-6 with action buttons right-aligned

**Toast Notifications:**
- Fixed top-right positioning
- Success/Error/Warning/Info variants
- Auto-dismiss after 5 seconds
- Slide-in animation from right

**Empty States:**
- Centered content with icon (from Heroicons)
- Descriptive text: text-lg
- Primary action button
- Examples: "Henüz proje eklenmemiş", "Bu ay fatura kaydı yok"

**Loading States:**
- Skeleton screens for tables and cards
- Spinner for button actions
- Shimmer animation on placeholder content

#### Specialized Components

**Subcontractor/Customer Cards:**
- Grid view option: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Card: rounded-lg shadow-sm p-6
- Avatar/Logo placeholder (circular, w-12 h-12)
- Name: text-lg font-semibold
- Contact details: text-sm with icons
- Quick actions: buttons at bottom

**Notes Section:**
- Timeline-style layout for multiple notes
- Each note: rounded-lg p-4 mb-4 with subtle border
- Note header: Date, Author
- Note content: Expandable if long
- Add note: Textarea with Kaydet button

---

### D. Responsive Behavior

**Mobile Optimizations (< 768px):**
- Stack all grids to single column
- Hamburger menu for navigation
- Horizontal scroll for wide tables with sticky first column
- Bottom sheet for filters and actions
- Larger touch targets (min h-12)
- Simplified charts (smaller legends)

**Tablet (768px - 1024px):**
- Two-column layouts
- Condensed sidebar (icon-only with tooltips)
- Side-by-side form fields

**Desktop (1024px+):**
- Full sidebar navigation
- Three+ column layouts
- Richer data visualizations
- Hover states active

---

### E. Interaction Patterns

**Buttons:**
- Primary: rounded-md px-6 py-3 font-medium
- Secondary: outline variant with border
- Icon buttons: p-2 rounded-full (hover state)
- Disabled state: reduced opacity

**Links:**
- Underline on hover for text links
- Icon + text combination in navigation

**Form Validation:**
- Inline error messages below fields (text-sm)
- Error state borders on invalid fields
- Success checkmarks for validated fields

**Micro-interactions:**
- Smooth transitions (transition-all duration-200)
- Scale on button hover (hover:scale-105 for cards)
- Fade transitions for modals/toasts
- Loading spinners for async actions

---

## Images

**Logo Integration:**
- Eska Logo.png in header: Clean placement in top-left, max-h-8, paired with company name
- Login/welcome screen: Centered logo, larger size (max-h-16)
- Reports: Watermark logo in PDF exports

**No Hero Images:** This is a business application focused on data and functionality, not marketing. Skip decorative hero sections.

**Icons:** Use Heroicons (outline and solid variants) for:
- Navigation menu items
- Action buttons
- Status indicators
- Empty state illustrations
- Form field prefixes