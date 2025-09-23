# Overview

This is a cryptocurrency trading platform built as a full-stack web application. The system allows users to trade cryptocurrency binary options with "up" or "down" predictions over short time periods (60s, 120s, 300s). The platform includes user authentication, wallet management, bank account integration, and comprehensive admin controls for managing users, transactions, and trades.

The application is designed as a mobile-first trading platform with a responsive design that works on both mobile and desktop devices. It features real-time cryptocurrency price data, trading functionality with predetermined profit percentages, and a complete transaction management system.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theming support (light/dark modes)
- **State Management**: TanStack Query (React Query) for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Mobile-First Design**: Responsive layout with dedicated mobile container components

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Password Hashing**: bcryptjs for secure password storage
- **Session Management**: Express sessions with memory store
- **API Design**: RESTful API endpoints with JSON responses
- **File Upload**: Multer for handling payment proof uploads

## Data Storage Solutions
- **Primary Storage**: File-based JSON storage system as fallback
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Management**: Shared TypeScript schemas between client and server
- **Session Storage**: In-memory session store with cleanup mechanisms
- **File Storage**: Local file system for transaction receipts and user uploads

The application uses a dual storage approach - it's configured to use PostgreSQL with Drizzle ORM but falls back to a file-based storage system using JSON files for development and situations where database connectivity is unavailable.

## Authentication and Authorization
- **Strategy**: Session-based authentication using Passport.js
- **User Roles**: Role-based access control (admin/user)
- **Protected Routes**: Client-side route protection with authentication checks
- **Password Security**: bcrypt hashing with salt rounds
- **Session Security**: Secure session configuration with appropriate timeouts

## External Dependencies

### Cryptocurrency Data
- **CoinGecko API**: Real-time cryptocurrency market data and pricing
- **Rate Limiting**: Exponential backoff retry mechanism for API calls
- **Data Caching**: Client-side caching to reduce API requests
- **Supported Currencies**: Top 20 cryptocurrencies by market cap

### Payment Processing
- **Stripe Integration**: Payment processing capabilities (configured but not actively used)
- **Bank Transfer Support**: Manual bank transfer verification system
- **PromptPay Integration**: Thai digital payment system support

### Development Tools
- **Neon Database**: PostgreSQL serverless database provider
- **Replit Integration**: Development environment optimizations
- **TypeScript**: Full type safety across the application
- **ESLint/Prettier**: Code quality and formatting tools

### UI and UX Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Framer Motion**: Animation library for enhanced UX
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation

The system is designed to be production-ready with proper error handling, input validation, and security measures while maintaining a simple and intuitive user experience.