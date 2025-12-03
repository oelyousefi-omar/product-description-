# Design Guidelines: AI Product Description & Order Management System

## Design Approach
**Selected System:** Material Design 3 with Fluent Design influences
**Rationale:** This is a productivity tool for confirmation agents requiring efficient workflows, data management, and multilingual support. Material Design provides clear hierarchy, familiar patterns, and robust form components ideal for data-heavy applications.

## Typography System

**Primary Font:** Inter (Google Fonts)
**Secondary Font:** Noto Sans Arabic (for Arabic language support)

**Hierarchy:**
- Page Titles: 2xl (24px), semibold
- Section Headers: xl (20px), semibold
- Card Titles/Labels: base (16px), medium
- Body Text: sm (14px), regular
- Helper Text: xs (12px), regular
- Buttons: sm (14px), medium

## Layout System

**Spacing Units:** Consistent use of Tailwind units: 2, 4, 6, 8, 12, 16, 24
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Page margins: p-6 on mobile, p-8 on desktop
- Card spacing: p-6

**Grid Structure:**
- Main dashboard: 12-column responsive grid
- Two-column layout for desktop (sidebar + main content)
- Single column stack on mobile

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with app logo/title on left
- Language switcher (AR/EN/FR) as dropdown in top-right
- User profile menu in far right
- Height: h-16, shadow-sm

**Sidebar (Desktop only):**
- Width: w-64, collapsible to w-16
- Navigation items with icons and labels
- Sections: Upload, Products, Orders, Reports
- Active state: background treatment with left border accent

### Upload Interface
**Drag-and-Drop Zone:**
- Large centered area (min-h-64)
- Dashed border (border-2 border-dashed)
- Upload icon (large, 48px)
- Primary text: "Drag photos here or click to browse"
- Secondary text: "Supports JPG, PNG up to 10MB"
- Rounded corners: rounded-lg

**Upload Preview Grid:**
- Grid layout: grid-cols-2 md:grid-cols-4 gap-4
- Thumbnail cards with aspect-ratio-square
- Loading spinner overlay during AI analysis
- Progress indicator during upload

### Product Display Cards
**Generated Description Card:**
- Full-width card with rounded-lg and shadow
- Header section with product thumbnail (left) and title (right)
- Three-tab system for languages (Arabic/English/French)
- Description text area with max-w-prose
- Action buttons at bottom: Edit, Copy, Generate PDF
- Spacing: p-6, gap-4 between sections

### Order/Registration Form
**Multi-Step Form Layout:**
- Step indicator at top (1. Product → 2. Customer → 3. Confirmation)
- Form sections with clear labels and helper text
- Input fields: h-10, rounded-md, border with focus states
- Required field indicators (*)
- Spacing between fields: space-y-4

**Form Fields:**
- Text inputs: Full width with label above
- Dropdowns: Chevron icon on right
- Phone/email: Icon prefix on left
- Textarea for notes: min-h-32

### Confirmation Script Display
**Script Card:**
- Bordered container with rounded-lg
- Header: "Confirmation Script" with copy button
- Script text in readable format with line breaks
- Placeholder areas highlighted (e.g., [CUSTOMER_NAME])
- Footer with language toggle if needed
- Background: subtle contrast from page background

### Data Tables (Orders List)
**Table Structure:**
- Responsive table with sticky header
- Columns: Order ID, Product, Customer, Date, Status, Actions
- Row height: h-12
- Hover state on rows
- Status badges with rounded-full
- Action buttons (icon-only) aligned right
- Mobile: Transform to stacked cards

### PDF Export Preview
**Preview Modal:**
- Centered overlay with backdrop
- Max width: max-w-4xl
- Header with title and close button
- Preview area with white background simulating PDF
- Footer with Download and Cancel buttons
- Padding: p-8

## Page Layouts

### Dashboard/Home
- Welcome header with user name and quick stats (cards in grid-cols-3)
- Recent uploads section (grid of product cards)
- Quick actions: Upload New, View Orders

### Upload & Analysis Page
- Prominent upload zone at top
- Processing queue below showing analysis status
- Completed analyses in expandable cards

### Product Library
- Search bar and filters at top (category, date, language)
- Grid view of product cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Each card shows thumbnail, truncated description, actions

### Order Management
- Filters sidebar (status, date range, search)
- Main area with data table
- Click row to expand order details inline
- Bulk actions toolbar when items selected

### Order Creation/Detail
- Two-column layout: Form (left, 2/3 width) + Summary (right, 1/3 width)
- Sticky summary card that follows scroll
- Summary shows: Product image, description snippet, total
- Form validation messages inline

## Interactive Elements

**Buttons:**
- Primary: h-10, px-6, rounded-md, medium weight
- Secondary: Same size, outlined variant
- Icon buttons: h-10 w-10, rounded-md for consistency
- Loading state: Spinner replaces text/icon

**Cards:**
- All cards use rounded-lg and shadow-sm
- Hover: slight shadow increase (shadow-md)
- Clickable cards: cursor-pointer with transition

**Modals/Dialogs:**
- Centered with backdrop (backdrop-blur-sm)
- Max widths: sm (max-w-md), md (max-w-2xl), lg (max-w-4xl)
- Header with title and close icon
- Footer with action buttons aligned right

## Multilingual Considerations
- RTL support for Arabic: Full layout flip
- Adequate spacing for longer text in different languages
- Icons remain universal across languages
- Date/number formatting localized

## Responsive Breakpoints
- Mobile: < 768px (stack all columns)
- Tablet: 768px - 1024px (2-column where applicable)
- Desktop: > 1024px (full sidebar + multi-column grids)

## Accessibility
- All interactive elements: h-10 minimum touch target
- Form labels always visible (no placeholder-only)
- Focus states: outline with 2px offset
- Skip navigation link for keyboard users
- High contrast maintained throughout

This design creates an efficient, professional workspace for confirmation agents with clear workflows from photo upload through AI analysis to order completion and PDF generation.