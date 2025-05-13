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
      this.activeConnections[dbName] = connection;
    },

    async closeConnection(dbName: DBNameType) {
      const connection = this.activeConnections[dbName];
      if (connection) {
        await connection.close();
        delete this.activeConnections[dbName];
      }
    },

    setProcessing(isProcessing: boolean) {
      this.isProcessing = isProcessing;
    },
  },
});
