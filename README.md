# Overview

KrishiSetu is a blockchain-powered supply chain traceability application that enables farmers, distributors, and consumers to track agricultural products from farm to table. The platform provides product registration, QR code generation, scanning capabilities, and comprehensive supply chain visualization with blockchain verification.

The application uses a modern full-stack architecture with React frontend, Express.js backend, MongoDB database, and Firebase authentication. It's designed to provide transparency and trust in agricultural supply chains through immutable blockchain records and user-friendly interfaces.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and component-based architecture
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Typography**: PT Sans font family for clean, modern appearance

## Backend Architecture
- **Framework**: Express.js with TypeScript for RESTful API design
- **Database**: MongoDB for document-based storage (e.g., product ownership, hashing, and block data)
- **Storage Pattern**: MongoStorage class for database operations with singleton connection
- **API Structure**: RESTful endpoints for users, products, transactions, quality checks, and scans
- **Error Handling**: Centralized error middleware with structured error responses

## Database Schema
- **Users**: Firebase UID integration, role-based access (farmer, distributor, etc.)
- **Products**: Comprehensive product metadata with batch tracking and QR codes
- **Transactions**: Supply chain movement tracking with location and environmental data
- **Quality Checks**: Certification and quality assurance records
- **Scans**: QR code scan tracking for analytics and verification

## Authentication & Authorization
- **Firebase Authentication**: Google OAuth integration for user management
- **Session Management**: Firebase ID tokens for secure API access
- **User Profiles**: Automatic user creation with Firebase UID linking
- **Role-based Access**: User roles (farmer, distributor, retailer) for feature access control

## Key Features Architecture
- **QR Code System**: Dynamic QR code generation and scanning with batch ID linking
- **Supply Chain Tracking**: Multi-stage product journey with location and timestamp data
- **Blockchain Integration**: Prepared infrastructure for blockchain transaction recording
- **Real-time Updates**: TanStack Query for automatic data synchronization
- **Responsive Design**: Mobile-first approach with touch-friendly interfaces

# External Dependencies

## Database & Infrastructure
- **MongoDB**: Document database for flexible storage (hosted on Render or similar)
- **Render**: Deployment platform for web services and databases

## Authentication & User Management
- **Firebase**: Authentication, user management, and Google OAuth provider
- **Firebase Admin**: Server-side user verification and token validation

## Frontend UI & Interaction
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms, etc.)
- **Lucide React**: Icon library for consistent visual elements
- **React Hook Form**: Form management with validation
- **Zod**: Schema validation for forms and API data
- **date-fns**: Date formatting and manipulation utilities

## Development & Build Tools
- **TanStack Query**: Server state management and data fetching
- **Wouter**: Lightweight routing library
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional className utilities

## Blockchain & QR Integration
- **@zxing/library**: QR code scanning capabilities
- **QR Code Generation**: Built-in QR code creation for product tracking

## Development Environment
- **Replit Integration**: Development environment optimization and runtime error handling
- **ESBuild**: Fast JavaScript bundling for production
- **PostCSS**: CSS processing with Tailwind and Autoprefixer