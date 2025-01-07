# IndexedDB to Dexie.js Migration

## Context

We are migrating from raw IndexedDB to Dexie.js to improve our database layer by:

- Adding better TypeScript support and type safety
- Simplifying database operations and reducing boilerplate
- Improving performance with optimized queries and bulk operations
- Adding reactive queries with live() and liveQuery()
- Simplifying schema versioning and migrations
- Reducing code complexity and improving maintainability

## Branch: feat/indexdb-to-dexie-migration

### Initial Setup

- [x] Install Dexie.js and its dependencies
- [x] Create basic database schema and types
- [x] Set up database versioning strategy

### Core Implementation

- [x] Create base database configuration
- [x] Implement shared types and interfaces
- [ ] Create domain-specific table definitions
- [ ] Add database utilities and helpers

### Domain Migration (One at a time)

#### LERG Domain

- [ ] Migrate LERG database schema
- [ ] Update LERG processing service
- [ ] Update LERG store
- [ ] Test LERG functionality

#### AZ Domain

- [ ] Migrate AZ database schema
- [ ] Update AZ processing service
- [ ] Update AZ store
- [ ] Test AZ functionality

#### US/NPANXX Domain

- [ ] Migrate US database schema
- [ ] Update US processing service
- [ ] Update US store
- [ ] Test US functionality

### Composable Updates

- [ ] Create new useDatabase composable
- [ ] Update useFileHandler composable
- [ ] Update useCsvProcessing composable
- [ ] Remove old useIndexDB composable

### Testing & Validation

- [ ] Add unit tests for database operations
- [ ] Add integration tests for file processing
- [ ] Test performance improvements
- [ ] Validate type safety improvements

### Cleanup

- [ ] Remove old IndexedDB code
- [ ] Update documentation
- [ ] Clean up any deprecated code
- [ ] Final testing pass

### Documentation

- [ ] Update API documentation
- [ ] Add migration notes
- [ ] Update component documentation
- [ ] Document new database patterns

## Notes:

- Each step should be committed separately
- Follow existing code style and patterns
- Maintain backwards compatibility during migration
- Add console logging for debugging
- Test thoroughly before moving to next step
