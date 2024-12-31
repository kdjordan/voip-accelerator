# VoIP Accelerator Features

## Architecture Overview

### Client (Vue.js + TypeScript)

- Framework: Vue 3 with Composition API
- Bundler: Vite
- State Management: Pinia
- Styling: Tailwind CSS with custom theme
- Router: Vue Router
- HTTP Client: Native fetch with typed responses

### Server (Node.js + TypeScript)

- Framework: Express.js
- Database: PostgreSQL
- Type Safety: TypeScript
- Domain-Driven Structure

## Domain Organization

### Client Domains

- `/domains/lerg/`
  - components/
  - services/
  - store/
  - types/
  - utils/
- `/domains/shared/`
  - components/
  - services/
  - types/
  - utils/
- `/domains/az/`
  - components/
  - store
  - services/
  - types/
  - utils/
- `/domains/us/`
  - components/
  - store/
  - services/
  - types/
  - utils/
- we are using /pages to handle routing and navigation  
- we are using /composables for shared logic
- we have individual Pinia stores for /az and /us and /shared
- our shared components are in /components/shared : footer, header, and sidebar

### Server Domains

- `/domains/lerg/`
  - routes/
  - services/
  - types/
  - migrations/
- `/domains/shared/`
  - services/
  - types/
  - utils/

## Features by Domain

### LERG Domain

- File Upload and Processing
- Data Management
- Statistics
- Search and Filtering (planned)

### Future Domains

- Rate Deck Management

## Testing Practices
- Once we get the project updated and stable we will revisit this


