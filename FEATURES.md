# VoIP Accelerator Features

## Feautures

This application is a tool for analyzing and comparing VoIP pricing and code data between different carriers.
It has 3 primary types of CSV files that will be uploaded and processed and stored in IndexDb using Dexie JS https://dexie.org/docs/.

CSV file types:
- AZ - International Rate Deck
- US - Domestic Rate Deck
- LERG - https://en.wikipedia.org/wiki/LERG_Routing_Guide : This will be used to generate the US code reports.


A user can drag and drop or select a CSV file from their computer to upload it.
Since these CSVs will have different formats and different columns, we will have a preview modal that will allow the user to select the columns that are relevant to them and will allow them to map the columns to the correct data.

We then standardize the data and store it in IndexDb using Dexie JS https://dexie.org/docs/.

We will ulitmately being allow for the storage of this data in a postgres database.
So we will be synching the data between IndexDb and Postgres using Dexie JS https://dexie.org/docs/.

We are using a local first approach to the application. So we are storing their progress in managing the files seperate Pinia stores for az, us, and shared. This allows the UI to be reactive and update the data as the user interacts with the application.

We have will have admin routes so that an admin can manage the LERG data, as well as a special codes DB that will be used to generate the US code reports.


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

### Code Architecture

- we are using /pages to handle routing and navigation  
- we are using /composables for shared logic
- we have individual Pinia stores for az, us, and shared
- our shared components are in /components/shared : footer, header, and sidebar



