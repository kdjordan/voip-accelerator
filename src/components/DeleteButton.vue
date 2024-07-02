<template>
  <button 
  class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
  >
    Remove
  </button>
</template>

<script setup lang="ts">
import { useIndexedDB } from '../composables/useIndexDB';
const { deleteObjectStore } = useIndexedDB();
// const props  = defineProps<{
//   storeName: string;
//   dbName: string;
// }>()
// console.log('in delete button ', props.storeName, props.dbName)

// async function removeDB() { 
//   await deleteObjectStore(props.dbName, props.storeName)
// }
</script>

<style scoped>
</style>