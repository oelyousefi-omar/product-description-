# Overview

This is an AI-powered product description and order management system designed for confirmation agents. The application allows users to upload product images, which are then analyzed by AI (OpenAI's GPT-5) to automatically generate product descriptions in three languages: Arabic, English, and French. The system also includes order management capabilities with confirmation script generation for customer interactions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18+ with TypeScript using Vite as the build tool

**UI Component System**: 
- Shadcn/ui component library built on Radix UI primitives
- Material Design 3 with Fluent Design influences following the design guidelines
- Tailwind CSS for styling with custom theme configuration supporting light/dark modes
- Component library using "New York" style variant

**State Management**:
- TanStack Query (React Query) for server state management and data fetching
- React Context API for global state (Language, Theme)
- No traditional state management library (Redux, Zustand, etc.)

**Routing**: Wouter for lightweight client-side routing

**Key Features**:
- Multilingual support (Arabic, English, French) with RTL layout support for Arabic
- Theme switching (light/dark mode)
- Responsive design with mobile-first approach
- File upload with drag-and-drop interface
- Real-time upload progress tracking

**Directory Structure**:
- `/client/src/pages` - Page components (Dashboard, Upload, Products, Orders)
- `/client/src/components` - Reusable components including UI primitives
- `/client/src/contexts` - React context providers (Language, Theme)
- `/client/src/lib` - Utility functions and query client configuration
- `/client/src/hooks` - Custom React hooks

## Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful API architecture with JSON responses

**File Upload**: Multer middleware for handling multipart/form-data
- Maximum file size: 10MB
- Accepted formats: Images only
- Storage: Local filesystem in `/uploads` directory

**Server Organization**:
- `/server/index.ts` - Main server entry point with Express setup
- `/server/routes.ts` - API route definitions and handlers
- `/server/storage.ts` - Data access layer abstraction
- `/server/static.ts` - Static file serving for production builds
- `/server/vite.ts` - Vite development server integration

**API Endpoints** (inferred from client usage):
- `GET /api/products` - List all products
- `POST /api/products` - Create product with AI-generated descriptions
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id` - Update order status

**Build Strategy**:
- Client bundled with Vite
- Server bundled with esbuild
- Selected dependencies bundled to reduce cold start times
- Production artifacts in `/dist` directory

## Data Storage

**Database**: PostgreSQL with Drizzle ORM

**Database Provider**: Neon Database (serverless PostgreSQL)

**Schema Design** (`/shared/schema.ts`):

**Products Table**:
- `id` (UUID, primary key)
- `name` (text)
- `imageUrl` (text) - URL/path to uploaded image
- `descriptions` (JSONB) - Multi-language descriptions object `{ar, en, fr}`
- `price` (text, optional)
- `category` (text, optional)
- `createdAt` (timestamp)

**Orders Table**:
- `id` (UUID, primary key)
- `productId` (varchar) - Reference to product
- `customerName` (text)
- `customerPhone` (text)
- `customerAddress` (text, optional)
- `customerCity` (text, optional)
- `notes` (text, optional)
- `quantity` (integer, default: 1)
- `status` (text) - enum: pending, confirmed, cancelled, delivered
- `confirmationScript` (text, optional) - AI-generated confirmation script
- `language` (text, default: 'ar')
- `createdAt` (timestamp)

**Data Access Pattern**: 
- In-memory storage implementation (`MemStorage`) for development/testing
- Database abstraction interface (`IStorage`) allows swapping implementations
- Drizzle ORM configured but storage implementation needs to be integrated

**Type Safety**: 
- Zod schemas for runtime validation
- TypeScript types inferred from Drizzle schema
- Shared types between client and server via `/shared` directory

## External Dependencies

**AI Service**: OpenAI GPT-5 API
- Purpose: Analyze product images and generate multilingual descriptions
- Configuration: API key via `OPENAI_API_KEY` environment variable
- Lazy initialization: Only instantiated when needed
- Model: `gpt-5` (latest as of August 2025)

**Database Service**: Neon Database
- Serverless PostgreSQL provider
- Connection: `@neondatabase/serverless` package
- Configuration: `DATABASE_URL` environment variable required

**Third-Party Libraries**:
- **UI Components**: Radix UI primitives (@radix-ui/*)
- **Styling**: Tailwind CSS with class-variance-authority for variants
- **Forms**: React Hook Form with Zod resolvers
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **File Upload**: Multer (server-side)
- **Session Management**: express-session with connect-pg-simple store

**Development Tools**:
- Replit-specific plugins for development (cartographer, dev-banner, runtime-error-modal)
- TypeScript for type safety across the stack
- ESBuild and Vite for building and bundling

**Font Resources**:
- Google Fonts: Inter (primary), Noto Sans Arabic (Arabic language support)

**Build Process**:
- Custom build script (`/script/build.ts`) orchestrates both client and server builds
- Server dependencies selectively bundled vs. externalized based on allowlist
- Source maps supported for debugging