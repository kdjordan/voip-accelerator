# VoIP Accelerator

A modern web application for managing and analyzing VoIP (Voice over Internet Protocol) data, including LERG (Local Exchange Routing Guide) information, US and AZ rate centers, and related telecommunications data.

## Project Structure

## Features

- LERG data management and analysis
- Rate center lookup and validation
- Database-backed persistence with PostgreSQL
- Modern React frontend with TypeScript
- RESTful API backend with Express

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn



```
voip-accelerator
├─ .cursorrules
├─ CURRENT.md
├─ FEATURES.md
├─ LERG_PROCESS.md
├─ README.md
├─ client
│  ├─ .cursor
│  │  └─ rules
│  │     └─ rule-claude-sonnet-37.mdc
│  ├─ components.json
│  ├─ env.d.ts
│  ├─ index.html
│  ├─ package-lock 2.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ pricing-tool@0.0.0
│  ├─ public
│  │  ├─ assets
│  │  │  └─ az-code-report.png
│  │  └─ favicon.ico
│  ├─ shims-vue.d.ts
│  ├─ src
│  │  ├─ App.vue
│  │  ├─ assets
│  │  │  ├─ bolt.svg
│  │  │  ├─ index.css
│  │  │  ├─ logo.svg
│  │  │  └─ main.css
│  │  ├─ components
│  │  │  ├─ az
│  │  │  │  ├─ AZCodeReport.vue
│  │  │  │  ├─ AZContentHeader.vue
│  │  │  │  ├─ AZFileUploads.vue
│  │  │  │  ├─ AZPricingReport.vue
│  │  │  │  └─ AzCodeSummary.vue
│  │  │  ├─ common
│  │  │  │  ├─ MemoryMonitor.vue
│  │  │  │  └─ StorageNotification.vue
│  │  │  ├─ home
│  │  │  │  └─ FeatureCards.vue
│  │  │  ├─ rate-sheet
│  │  │  │  └─ RateSheetTable.vue
│  │  │  ├─ shared
│  │  │  │  ├─ PreviewModal2.vue
│  │  │  │  ├─ ReportTable.vue
│  │  │  │  ├─ SideNav.vue
│  │  │  │  ├─ TheFooter.vue
│  │  │  │  ├─ TheHeader.vue
│  │  │  │  ├─ TopNav.vue
│  │  │  │  └─ icons
│  │  │  │     └─ UploadIcon.vue
│  │  │  └─ us
│  │  │     ├─ USCodeReport.vue
│  │  │     ├─ USContentHeader.vue
│  │  │     ├─ USFileUploads.vue
│  │  │     └─ USPricingReport.vue
│  │  ├─ composables
│  │  │  └─ useDexieDB.ts
│  │  ├─ config
│  │  │  └─ storage-config.ts
│  │  ├─ data
│  │  │  ├─ lerg.csv
│  │  │  └─ sample
│  │  │     ├─ AZ-Test1.csv
│  │  │     ├─ AZ-Test2.csv
│  │  │     ├─ UStest.csv
│  │  │     └─ UStest1.csv
│  │  ├─ main.ts
│  │  ├─ pages
│  │  │  ├─ AdminView.vue
│  │  │  ├─ AzView.vue
│  │  │  ├─ DashBoard.vue
│  │  │  ├─ HomeView.vue
│  │  │  ├─ RateSheetView.vue
│  │  │  └─ UsView.vue
│  │  ├─ router
│  │  │  ├─ admin-routes.ts
│  │  │  └─ index.ts
│  │  ├─ services
│  │  │  ├─ az.service.ts
│  │  │  ├─ lerg-api.service.ts
│  │  │  ├─ lerg-facade.service.ts
│  │  │  ├─ lerg.service.ts
│  │  │  ├─ rate-sheet.service.ts
│  │  │  ├─ storage
│  │  │  │  ├─ dexie-strategy.ts
│  │  │  │  ├─ storage-factory.ts
│  │  │  │  ├─ storage-strategy.ts
│  │  │  │  ├─ storage-test-utils.ts
│  │  │  │  ├─ storage.service.ts
│  │  │  │  └─ store-strategy.ts
│  │  │  └─ us.service.ts
│  │  ├─ stores
│  │  │  ├─ az-store.ts
│  │  │  ├─ db-store.ts
│  │  │  ├─ lerg-store.ts
│  │  │  ├─ rate-sheet-store.ts
│  │  │  ├─ shared-store.ts
│  │  │  └─ us-store.ts
│  │  ├─ types
│  │  │  ├─ app-types.ts
│  │  │  ├─ constants
│  │  │  │  ├─ country-codes.ts
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ messages.ts
│  │  │  │  ├─ province-codes.ts
│  │  │  │  ├─ state-codes.ts
│  │  │  │  └─ world.ts
│  │  │  ├─ domains
│  │  │  │  ├─ az-types.ts
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ lerg-types.ts
│  │  │  │  ├─ rate-sheet-types.ts
│  │  │  │  └─ us-types.ts
│  │  │  ├─ index.ts
│  │  │  └─ user-types.ts
│  │  ├─ utils
│  │  │  ├─ cleanup.ts
│  │  │  ├─ load-sample-data.ts
│  │  │  └─ utils.ts
│  │  └─ workers
│  │     ├─ az-code-report.worker.ts
│  │     ├─ az-comparison.worker.ts
│  │     ├─ effective-date-updater.worker.ts
│  │     └─ generate-reports.ts
│  ├─ tailwind.config.js
│  ├─ tests
│  │  ├─ az-comparison.worker.edge.test.ts
│  │  ├─ az-comparison.worker.perf.test.ts
│  │  └─ az-comparison.worker.test.ts
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  ├─ vite
│  ├─ vite.config.ts
│  └─ vitest.config.ts
├─ docs
│  └─ STORAGE_STRATEGY.md
├─ prompts.txt
├─ screenshots
│  └─ shot-1.png
├─ server
│  ├─ .npmrc
│  ├─ data
│  ├─ logs
│  ├─ migrations
│  │  ├─ 001_create_lerg_table.sql
│  │  └─ index.ts
│  ├─ package-lock 2.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  ├─ db
│  │  │  └─ migrations
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  └─ admin-auth.middleware.ts
│  │  ├─ routes
│  │  │  ├─ admin.routes.ts
│  │  │  ├─ auth.routes.ts
│  │  │  └─ lerg.routes.ts
│  │  ├─ services
│  │  │  ├─ database.service.ts
│  │  │  ├─ lerg-file.processor.ts
│  │  │  └─ lerg.service.ts
│  │  └─ types
│  │     └─ lerg.types.ts
│  └─ tsconfig.json
└─ tests
   ├─ az-comparison.test.ts
   ├─ integration
   │  └─ az-workflow.test.ts
   └─ performance
      └─ az-comparison.test.ts

```