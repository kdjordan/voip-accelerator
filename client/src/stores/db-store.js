import { defineStore } from 'pinia';
export const useDBStore = defineStore('db', {
    state: () => ({
        activeConnections: {},
        isProcessing: false,
    }),
    actions: {
        registerConnection(dbName, connection) {
            console.log(`Registering connection for ${dbName}`);
            this.activeConnections[dbName] = connection;
        },
        async closeConnection(dbName) {
            const connection = this.activeConnections[dbName];
            if (connection) {
                await connection.close();
                delete this.activeConnections[dbName];
                console.log(`Closed connection for ${dbName}`);
            }
        },
        setProcessing(isProcessing) {
            this.isProcessing = isProcessing;
        },
    },
});
