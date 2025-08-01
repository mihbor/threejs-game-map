# Overview

This is a full-stack web application featuring a 3D interactive octahedron experience built with React Three Fiber. The project combines a modern frontend with React and TypeScript, an Express.js backend, and PostgreSQL database integration using Drizzle ORM. The application showcases 3D graphics capabilities with an animated octahedron that users can interact with through mouse controls and visual feedback.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **3D Graphics**: React Three Fiber (@react-three/fiber) with Three.js for 3D rendering
- **3D Utilities**: React Three Drei (@react-three/drei) for common 3D components like OrbitControls
- **Post-processing**: React Three Postprocessing for visual effects
- **UI Components**: Radix UI primitives for accessible, headless components
- **Styling**: Tailwind CSS with custom design tokens and Shadcn/ui component library
- **State Management**: Zustand for lightweight, simple state management (game state and audio)
- **Data Fetching**: TanStack Query (React Query) for server state management and caching
- **Build Tool**: Vite for fast development and optimized builds

## Backend Architecture
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js for REST API server
- **Language**: TypeScript for type safety across the entire stack
- **Development**: tsx for TypeScript execution in development
- **Production Build**: esbuild for fast, optimized server bundling

## Data Storage
- **Database**: PostgreSQL with Neon Database serverless driver
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Management**: Drizzle Kit for database migrations and schema generation
- **Session Storage**: In-memory storage with fallback to database (connect-pg-simple for sessions)

## Development Setup
- **Monorepo Structure**: Shared TypeScript types and schemas between client/server
- **Path Aliases**: Configured for clean imports (@/ for client, @shared/ for shared code)
- **Hot Reloading**: Vite HMR for frontend, tsx watch mode for backend
- **Error Handling**: Runtime error overlay in development

## 3D Scene Architecture
- **Main Scene**: OctahedronScene component managing lighting, camera, and controls
- **Interactive Object**: Octahedron component with hover/click states and animations
- **Responsive Design**: Dynamic canvas sizing and camera aspect ratio handling
- **Performance**: Suspense-based loading and optimized render loops

## Asset Support
- **3D Models**: GLTF/GLB file support for complex 3D assets
- **Shaders**: GLSL shader support via vite-plugin-glsl
- **Audio**: MP3, OGG, WAV file support for game audio
- **Fonts**: Web font loading via Fontsource (Inter font family)

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Environment Variables**: DATABASE_URL required for database connectivity

## Frontend Libraries
- **Three.js Ecosystem**: Core 3D rendering with React Three Fiber wrapper
- **Radix UI**: Comprehensive accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **TanStack Query**: Server state management with caching and synchronization
- **Zustand**: Minimal state management for client-side state

## Development Tools
- **TypeScript**: Static type checking across the entire stack
- **Vite**: Fast build tool with HMR and optimized production builds
- **ESBuild**: Fast JavaScript bundler for production server builds
- **Drizzle Kit**: Database migration and schema management tools

## Runtime Dependencies
- **Express.js**: Web application framework for the backend API
- **Neon Serverless**: PostgreSQL driver optimized for serverless environments
- **Class Variance Authority**: Utility for creating component variant APIs
- **Date-fns**: Modern date utility library for JavaScript

The application is designed as a modern, type-safe full-stack web application with a focus on 3D graphics and interactive experiences while maintaining clean architecture patterns and developer experience.