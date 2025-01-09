# Refactoring to Dexie in a Vue 3 Application

## Table of Contents
1. [Introduction](#introduction)  
2. [Why Dexie?](#why-dexie)  
3. [Basic Setup](#basic-setup)  
4. [Versioning and Schema Migrations](#versioning-and-schema-migrations)  
5. [Multiple Databases and Object Stores](#multiple-databases-and-object-stores)  
6. [Common Patterns and Examples](#common-patterns-and-examples)  
7. [Vue 3 Integration Patterns](#vue-3-integration-patterns)  
8. [Performance Considerations](#performance-considerations)  
9. [Error Handling and Debugging](#error-handling-and-debugging)  
10. [Additional Tips and Resources](#additional-tips-and-resources)

---

## 1. Introduction

When migrating from a custom IndexedDB setup to using Dexie, you’ll benefit from:

- A concise API for data operations (CRUD).  
- Built-in schema versioning and migrations.  
- An async/await approach that simplifies asynchronous operations.  
- Clearer error handling compared to the native IndexedDB approach.

This guide highlights important points to be aware of when refactoring a Vue 3 application to use [Dexie](https://dexie.org/) for IndexedDB. It provides conceptual and practical tips for structuring and implementing your database layer in a clean, maintainable way.

---

## 2. Why Dexie?

Dexie provides a simpler, more intuitive interface over IndexedDB:

- **Easy CRUD**: Rather than writing verbose IndexedDB boilerplate, you can use short, promise-based methods (e.g., db.tableName.put(), db.tableName.get(), etc.).  
- **Observables / Live Queries**: Dexie supports reactive queries (with add-ons) that can simplify updating the UI in Vue.  
- **Transactions**: Simplified transactions allow multiple operations to run atomically, reducing complexity.

---

## 3. Basic Setup

### 3.1 Installation

    npm install dexie

### 3.2 Create Database

Create a file, e.g., db.js or useDB.js, to instantiate your Dexie database. For example:

    import Dexie from 'dexie';

    export const db = new Dexie('MyDatabase');

    // Define your schema
    db.version(1).stores({
      // 'stores': 'commaSeparatedListOfIndexes'
      products: '++id, name, price',
      users: '++id, username, email',
    });

    // If needed, define additional versions
    // db.version(2).stores({ ... });

### 3.3 Use Database in Components / Services

Import db wherever you want to interact with it:

    import { db } from '@/db';

    async function addProduct(product) {
      const id = await db.products.add(product);
      console.log('Inserted product with id:', id);
    }

---

## 4. Versioning and Schema Migrations

### 4.1 Versioning

Each time you change the schema (adding/removing stores or indexes), you need to increment the version number:

    db.version(2).stores({
      products: '++id, name, price, category',
    }).upgrade(tx => {
      // Perform migrations if needed
    });

### 4.2 Migrations

When incrementing the version, define an upgrade function to transform existing data. For example, if you add a new field or rename a property, do it in the upgrade callback using transactions on the existing tables.

---

## 5. Multiple Databases and Object Stores

### 5.1 When to Split Into Multiple Databases

- **Logical Separation**: If you have fundamentally different domains of data that rarely overlap, consider separate databases.  
- **Different Lifecycles**: If some data changes frequently and some rarely, separating them can simplify versioning.

### 5.2 Considerations

- **Overhead**: Each database manages its own connection and versioning, so don’t over-split without a clear reason.  
- **Management**: Each database needs its own versioning strategy.

### 5.3 Example of Multiple Databases

    // db1.js
    import Dexie from 'dexie';

    export const dbMain = new Dexie('MainDB');
    dbMain.version(1).stores({
      products: '++id, name, price',
      users: '++id, username, email',
    });

    // db2.js
    export const dbLogs = new Dexie('LogsDB');
    dbLogs.version(1).stores({
      logs: '++id, timestamp, message',
    });

---

## 6. Common Patterns and Examples

### 6.1 CRUD Operations

    // Create
    const addUser = async (user) => {
      await db.users.add(user);
    };

    // Read
    const getUser = async (id) => {
      return await db.users.get(id);
    };

    // Update
    const updateUser = async (id, updates) => {
      await db.users.update(id, updates);
    };

    // Delete
    const deleteUser = async (id) => {
      await db.users.delete(id);
    };

### 6.2 Transactions

    await db.transaction('rw', db.users, db.products, async () => {
      const userId = await db.users.add({ username: 'Alice' });
      await db.products.add({ name: 'Product A', ownerId: userId });
    });

Use transactions to ensure atomicity when multiple writes must succeed or fail together.

### 6.3 Indices

Define secondary indexes in your schema to speed up queries:

    db.version(1).stores({
      products: '++id, name, price, category',
    });

Here, category is now indexed for faster queries on that field.

### 6.4 Hooks

Dexie supports hooks (e.g., db.tableName.hook('creating', …)) that can manage side effects such as logging or auto-incrementing certain fields. Use them carefully to avoid overly complex side effects.

---

## 7. Vue 3 Integration Patterns

### 7.1 Composable Functions

Use Vue 3’s Composition API to create reusable database interactions:

    import { ref } from 'vue';
    import { db } from '@/db';

    export function useProducts() {
      const products = ref([]);

      const fetchProducts = async () => {
        products.value = await db.products.toArray();
      };

      return { products, fetchProducts };
    }

### 7.2 Reactive Queries (liveQuery)

Dexie offers Observable and Live Query features. You can integrate them with Vue’s reactivity system:

    import { ref, onBeforeUnmount } from 'vue';
    import { db } from '@/db';
    import { liveQuery } from 'dexie';

    export function useLiveProducts() {
      const products = ref([]);

      const subscription = liveQuery(() => db.products.toArray())
        .subscribe({
          next(value) {
            products.value = value;
          },
          error(err) {
            console.error(err);
          }
        });

      onBeforeUnmount(() => {
        subscription.unsubscribe();
      });

      return { products };
    }

### 7.3 Store / State Management

If using Vuex or Pinia, dispatch actions or define store methods that interact with Dexie. This centralizes data access logic and keeps components clean.

---

## 8. Performance Considerations

1. **Batch Operations**  
    Instead of adding or updating records one by one in a loop, consider using bulk operations:
    
        await db.products.bulkAdd([
          { name: 'A' },
          { name: 'B' },
          { name: 'C' },
        ]);

2. **Indexing**  
    Carefully define indexes for frequently queried fields. Over-indexing can slow down writes.

3. **Opening Databases**  
    Dexie automatically opens the DB on the first operation. Reuse the same db instance to avoid overhead of multiple connections.

4. **Memory Usage**  
    Large reads (e.g., toArray()) can be memory-heavy for big datasets. Use Dexie’s query methods (where, filter, offset, limit) to paginate or filter at the DB level.

---

## 9. Error Handling and Debugging

- **Try/Catch**  
  Since Dexie methods return promises, use try/catch or .catch() to handle errors:
  
      try {
        await db.users.put({ id: 1, username: 'Bob' });
      } catch (error) {
        console.error('Failed to save user:', error);
      }

- **DevTools**  
  Use your browser’s IndexedDB inspector (Chrome DevTools, Firefox Developer Tools, etc.) to examine tables and records directly.

- **Dexie Debugging**  
  Dexie offers built-in debugging info in the console if you enable debug mode:
  
      import Dexie from 'dexie';
      Dexie.debug = true;

---

## 10. Additional Tips and Resources

- **Atomic Updates**: Remember that IndexedDB operations are asynchronous. If changes must remain consistent, wrap them in a single transaction.  
- **Version Collisions**: If multiple parts of your app (or multiple apps) open the same DB with different version definitions, it can lead to conflicts. Plan your version migrations carefully.  
- **Testing**: Write tests for your database interactions. Dexie can be mocked, or you can use a real IndexedDB environment in most test runners.  
- **Dexie Docs**: [Dexie Documentation](https://dexie.org/docs) – Official site with in-depth explanations and additional examples.  
- **Vue 3 Docs**: [Vue 3 Documentation](https://vuejs.org/) – Learn more about the Composition API, reactivity, and state management patterns.

---

