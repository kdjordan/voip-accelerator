# Supabase Edge Functions for VOIP Accelerator

This directory contains Supabase Edge Functions that replace the previous Express.js backend for VOIP Accelerator.

## Functions

### `get-lerg-data`

Retrieves LERG data from the Supabase database.

- **Method**: GET
- **Authentication**: Required (any authenticated user)
- **Response**: JSON containing LERG records and stats

### `ping-status`

Tests the connection to the Supabase database and checks if the LERG table exists.

- **Method**: GET
- **Authentication**: Required (any authenticated user)
- **Response**: JSON with connection status

### `upload-lerg`

Handles LERG file uploads, processes the file, and inserts records into the database.

- **Method**: POST
- **Authentication**: Required (superadmin only)
- **Request Body**: FormData with file, mappings, and startLine
- **Response**: JSON with upload statistics

## Local Development

To run these functions locally:

```bash
supabase start
supabase functions serve
```

## Deployment

To deploy these functions to Supabase:

```bash
supabase functions deploy get-lerg-data --no-verify-jwt
supabase functions deploy ping-status --no-verify-jwt
supabase functions deploy upload-lerg
```

Note: The `--no-verify-jwt` flag is used for functions that should be callable without a valid JWT (if applicable). For secure endpoints like `upload-lerg`, omit this flag.

## Required Database Tables

- `lerg_codes`: Stores LERG data
- `user_roles`: Maps users to roles for authorization checks
