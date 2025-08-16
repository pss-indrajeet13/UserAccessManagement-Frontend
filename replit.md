# Overview

This is a mobile user management admin dashboard built with React, Express, and PostgreSQL. The application provides comprehensive tools for managing mobile app users, tracking their sessions, controlling access levels, sending push notifications, and generating analytics reports. It features a modern admin interface for monitoring user activity, managing permissions, and analyzing user engagement patterns.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and data fetching
- **Routing**: Wouter for client-side routing
- **Component Structure**: Modern component-based architecture with reusable UI components organized in `/components/ui/`

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Pattern**: RESTful API with JSON responses
- **Middleware**: Custom logging middleware for API request/response tracking
- **Error Handling**: Centralized error handling with status codes and JSON error responses
- **Development Tools**: Vite integration for hot module replacement in development

## Database Layer
- **ORM**: Drizzle ORM with Zod schema validation
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Design**: 
  - Users table for admin authentication
  - Mobile users table for app user management with status, access levels, and progression tracking
  - Sessions table for tracking user activity and completion rates
  - Notifications table for push notification history
  - Activities table for audit logging
- **Data Validation**: Schema validation using Drizzle-Zod integration

## Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL session store using connect-pg-simple
- **Access Control**: Role-based access with user status (active/inactive) and access levels (standard/premium/admin)
- **Security**: Session-based authentication with secure cookie configuration

## Component Architecture
- **Layout**: Sidebar navigation with header component for consistent admin interface
- **Modals**: Reusable modal components for user creation and editing
- **Data Display**: Card-based layout with tables, badges, and statistics widgets
- **Forms**: React Hook Form integration with Zod validation for user management

# External Dependencies

## Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **drizzle-orm**: Type-safe ORM for database operations
- **@neondatabase/serverless**: PostgreSQL serverless database connection

## UI Component Libraries
- **@radix-ui/***: Headless UI primitives for accessible components
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Utility for creating component variants
- **lucide-react**: Icon library for UI elements

## Development & Build Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for server development
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development plugins

## Database & Session Management
- **connect-pg-simple**: PostgreSQL session store for Express
- **drizzle-kit**: Database migration and schema management tools
- **zod**: Schema validation library

## Form & Data Handling
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **date-fns**: Date manipulation and formatting utilities