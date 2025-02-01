# LERG Data Flow Process

## Overview

A detailed trace of the LERG data initialization, storage, and retrieval process across both client and server.

## Current Issues

- Special codes data is being stored in Pinia state but not in IndexDB:
  - Data is successfully fetched from PostgreSQL
  - countryBreakdown shows 20 items in state
  - totalCodes shows 70 in state
  - `isLocallyStored` is true but data isn't actually in IndexDB
- Need to track down where the IndexDB storage step is being skipped in the initialization process

## Data Flow

### 1. Initial Application Load

**File:** `client/src/App.vue`

- Function: `onMounted()`
- Purpose: Triggers LERG initialization
- Calls: `lergApiService.initialize()`

### 2. API Service Initialization

**File:** `client/src/services/lerg-api.service.ts`

- Function: `initialize()`
- Purpose: Orchestrates the entire LERG data initialization process
- Parameters: None
- Returns: Promise<void>
- Process:
  1. Tests database connection
  2. Fetches LERG and special codes data
  3. Initializes local IndexDB storage
  4. Updates store state
- Calls: `LergService.initializeWithData()`

### 3. Local Storage Initialization

**File:** `client/src/services/lerg.service.ts`

- Function: `initializeWithData()`
- Purpose: Stores fetched data in IndexDB
- Parameters:
  - lergData: LERGRecord[]
  - specialCodes: SpecialAreaCode[]
- Returns: Promise<void>
- Current Issue: Only storing LERG data, missing special codes storage

### 4. Server Routes

**File:** `server/src/domains/lerg/routes/admin.routes.ts`

- Endpoint: `GET /api/admin/lerg/special-codes/all`
- Purpose: Retrieves special codes from PostgreSQL
- Returns: Array<{ npa: string; country: string; province: string }>

[... continuing with all relevant functions and their interactions ...]

## Data Storage Flow

[Details about how data moves from PostgreSQL to IndexDB]

## State Management Flow

[Details about store updates and state management]
