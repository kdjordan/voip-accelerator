import { defineStore } from 'pinia';
import { type DBNameType } from '@/types/app-types';
import Dexie from 'dexie';

export const useDBStore = defineStore('db', {
  state: () => ({
    activeConnections: {} as Record<DBNameType, Dexie>,
    isProcessing: false,
  }),

  actions: {
    registerConnection(dbName: DBNameType, connection: Dexie) {
      console.log(`Registering connection for ${dbName}`);
      this.activeConnections[dbName] = connection;
    },

    async closeConnection(dbName: DBNameType) {
      const connection = this.activeConnections[dbName];
      if (connection) {
        await connection.close();
        delete this.activeConnections[dbName];
        console.log(`Closed connection for ${dbName}`);
      }
    },

    setProcessing(isProcessing: boolean) {
      this.isProcessing = isProcessing;
    },
  },
});
