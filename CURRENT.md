# Current Implementation Task

## Description 
The LERG data is a large file that managed in the /admin/lerg route. It should be stored in a postgresDB in it's own table and be able to be updated from the admin route. 
The LERG is supplied as a .txt file and is processed by a worker, since it can be very large.
It contains many duplicate NPA NXX codes that need to be filtered so only unique ones are kept.
We also need to be able to upload a CSV file of Special Area Codes and have them be added to the postgresDB. 
This is the foundation of how we will be doing our us-code reports.

## Task: LERG Data Management

### Completed ✅

1. File Processing:

   - Fixed file size limits (500MB)
   - Added proper error handling
   - Improved database schema
   - Fixed record processing

2. Special Area Codes:
   - Created special_area_codes table
   - Implemented CSV seeder
   - Added data migration
   - Successfully seeded reference data

### Next Steps 🔄

1. LERG Processing Enhancements:

   - Add special area code validation during LERG processing
   - Cross-reference LERG NPAs with special_area_codes
   - Add country/province info to LERG records where applicable

2. API Endpoints:

   - Add endpoint to query special area codes
   - Add filtering by country/province
   - Include special area code info in LERG queries

3. UI Improvements:
   - Show country/province in LERG data display
   - Add special area code filtering options
   - Improve upload progress feedback

Would you like to work on any of these next steps? I'd suggest starting with the special area code validation during LERG processing since we now have the reference data available.
