# VOIP Accelerator

A modern web application for managing and analyzing telecommunications pricing data, including LERG (Local Exchange Routing Guide) information, US and AZ rate centers, and related telecommunications data.

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
├─ .cursor
│  └─ rules
│     ├─ api-design.mdc
│     ├─ auth.mdc
│     ├─ backend-rafactor.mdc
│     ├─ coding-rules.mdc
│     ├─ lerg-data-process.mdc
│     ├─ lerg-edge-approach.mdc.mdc
│     ├─ overview.mdc
│     ├─ refactor-lerg-facade.mdc
│     ├─ roadmap.mdc
│     └─ supabase.mdc
├─ .cursorrules
├─ LERG_PROCESS.md
├─ README.md
├─ client
│  ├─ .cursor
│  │  └─ rules
│  │     ├─ data-sync-strategy.mdc
│  │     ├─ lerg-management.mdc
│  │     ├─ performance-optimization.mdc
│  │     └─ rule-claude-sonnet-37.mdc
│  ├─ .prettierrc
│  ├─ components.json
│  ├─ env.d.ts
│  ├─ eslint.config.js
│  ├─ index.html
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
│  │  │  ├─ home
│  │  │  │  └─ FeatureCards.vue
│  │  │  ├─ rate-sheet
│  │  │  │  └─ RateSheetTable.vue
│  │  │  ├─ shared
│  │  │  │  ├─ PreviewModal.vue
│  │  │  │  ├─ ReportTable.vue
│  │  │  │  ├─ SideNav.vue
│  │  │  │  ├─ TheFooter.vue
│  │  │  │  ├─ TheHeader.vue
│  │  │  │  ├─ TopNav.vue
│  │  │  │  └─ icons
│  │  │  │     └─ UploadIcon.vue
│  │  │  └─ us
│  │  │     ├─ USCodeReport.vue
│  │  │     ├─ USCodeSummary.vue
│  │  │     ├─ USContentHeader.vue
│  │  │     ├─ USEnhancedCodeReport.vue
│  │  │     ├─ USFileUploads.vue
│  │  │     └─ USPricingReport.vue
│  │  ├─ composables
│  │  │  ├─ useDexieDB.ts
│  │  │  ├─ useDragDrop.ts
│  │  │  ├─ useLergData.ts
│  │  │  └─ usePingStatus.ts
│  │  ├─ config
│  │  │  ├─ sample-data-config.ts
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
│  │  │  ├─ lerg.service.ts
│  │  │  ├─ rate-sheet.service.ts
│  │  │  ├─ storage
│  │  │  │  ├─ dexie-strategy.ts
│  │  │  │  ├─ storage-factory.ts
│  │  │  │  ├─ storage-strategy.ts
│  │  │  │  ├─ storage.service.ts
│  │  │  │  └─ store-strategy.ts
│  │  │  └─ us.service.ts
│  │  ├─ shims-vue.d.ts
│  │  ├─ stores
│  │  │  ├─ az-store.ts
│  │  │  ├─ db-store.ts
│  │  │  ├─ lerg-store.ts
│  │  │  ├─ rate-sheet-store.ts
│  │  │  ├─ shared-store.ts
│  │  │  └─ us-store.ts
│  │  ├─ types
│  │  │  ├─ app-types.ts
│  │  │  ├─ components
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
│  │  │  ├─ supabase-types.ts
│  │  │  └─ user-types.ts
│  │  ├─ utils
│  │  │  ├─ cleanup.ts
│  │  │  ├─ load-sample-data.ts
│  │  │  ├─ prepare-worker-data.ts
│  │  │  ├─ supabase.ts
│  │  │  └─ utils.ts
│  │  └─ workers
│  │     ├─ az-code-report.worker.ts
│  │     ├─ az-comparison.worker.ts
│  │     ├─ effective-date-updater.worker.ts
│  │     ├─ generate-reports.ts
│  │     ├─ us-code-report.worker.ts
│  │     └─ us-comparison.worker.ts
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
├─ lerg-data-process.mdc
├─ prompts.txt
├─ supabase
│  ├─ .branches
│  │  └─ _current_branch
│  ├─ .temp
│  │  ├─ cli-latest
│  │  ├─ gotrue-version
│  │  ├─ pooler-url
│  │  ├─ postgres-version
│  │  └─ rest-version
│  ├─ config.toml
│  └─ functions
│     ├─ README.md
│     ├─ get-lerg-data
│     │  └─ index.ts
│     ├─ import_map.json
│     ├─ ping-status
│     │  └─ index.ts
│     └─ upload-lerg
│        └─ index.ts
├─ test-ping-status.sh
└─ tests
   ├─ az-comparison.test.ts
   ├─ integration
   │  └─ az-workflow.test.ts
   └─ performance
      └─ az-comparison.test.ts

```

