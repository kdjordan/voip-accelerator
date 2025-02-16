## what we are doing - focus on the AZ file upload, parsing and storing using Dexie

- we are using dexie to create a database for each of the files we are uploading
- we are using the createDatabase function to create a new database instance
- we are using the getDatabase function to get an existing database instance
- we are using the useAZFileHandler composable to handle the AZ file upload
- we are using the AZService to process the AZ file

1. Update database.ts:

   - [ ] Separate AZ and US configs
   - [ ] Rename databases to follow pattern
   - [ ] Update schema definitions

2. Update AZService:

   - [ ] Use dedicated az_rate_deck_db
   - [ ] Clean up file processing
   - [ ] Add proper error handling

3. Create USService:
   - [ ] Mirror AZ pattern
   - [ ] Implement US-specific processing
   - [ ] Add US validation
