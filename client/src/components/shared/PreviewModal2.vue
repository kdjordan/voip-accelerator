<template>
  <transition
    enter-active-class="ease-out duration-300"
    enter-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="ease-in duration-200"
    leave-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex min-h-screen items-center justify-center">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/80"
          @click="handleCancel"
        ></div>

        <!-- Modal Content -->
        <div
          class="relative transform rounded-lg bg-fbBlack text-left shadow-xl transition-all m-4 w-full max-w-7xl max-h-[90vh] flex flex-col"
        >
          <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 overflow-auto">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg leading-6 font-medium text-fbWhite">Select Column Roles</h3>
              <div class="flex flex-col items-center gap-2">
                <label
                  for="start-line"
                  class="block text-sm font-medium text-fbWhite/70"
                  >Data starts on line:</label
                >
                <select
                  id="start-line"
                  v-model="startLine"
                  class="select-custom mt-1 block w-32 bg-fbHover text-fbWhite rounded-md py-2 pl-3 focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
                >
                  <option
                    v-for="i in 15"
                    :key="i"
                    :value="i"
                  >
                    {{ i }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Column Mapping Section -->
            <div class="mb-8">
              <div class="mt-2 overflow-auto max-h-80">
                <table class="min-w-full rounded-lg overflow-hidden">
                  <thead class="bg-fbHover">
                    <tr>
                      <th class="min-w-[80px] p-1 text-left">
                        <div class="text-base text-fbWhite pl-3">ROW</div>
                      </th>
                      <th
                        v-for="(column, index) in columns"
                        :key="index"
                        class="px-6 py-3 text-left text-xs font-medium text-fbWhite/70 uppercase tracking-wider"
                      >
                        <select
                          v-model="mappings[index]"
                          class="select-custom min-w-[180px] block w-full rounded-md py-2 pl-3 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-accent"
                          :class="{
                            'bg-accent/20 text-accent border border-accent/50': mappings[index] !== '',
                            'bg-fbHover text-fbWhite border border-fbWhite/20':
                              mappings[index] === '' && (!allColumnsMapped || props.validateRequired),
                            'bg-fbHover/30 text-fbWhite/30 border border-fbWhite/10 cursor-not-allowed':
                              mappings[index] === '' && allColumnsMapped && !props.validateRequired,
                          }"
                          @change="handleMappingChange"
                          :disabled="mappings[index] === '' && allColumnsMapped && !props.validateRequired"
                        >
                          <option value="">Select Column Role</option>
                          <option
                            v-for="option in availableOptions(index)"
                            :key="option.value"
                            :value="option.value"
                          >
                            {{ option.label }}
                          </option>
                        </select>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in filteredPreviewData"
                      :key="row.rowNumber"
                      :class="['transition-colors', row.rowNumber % 2 === 0 ? 'bg-transparent' : 'bg-fbHover/30']"
                    >
                      <td class="px-4 py-2">{{ row.rowNumber }}</td>
                      <td
                        v-for="(cell, cellIndex) in row.data"
                        :key="cellIndex"
                        class="px-6 py-4 whitespace-nowrap"
                      >
                        {{ cell }}
                      </td>
                    </tr>
                    <tr
                      v-if="filteredPreviewData.length === 0"
                      class="text-center text-fbWhite/50"
                    >
                      <td
                        :colspan="columns.length + 1"
                        class="px-6 py-4"
                      >
                        No preview data available starting from line {{ startLine }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-4 bg-fbHover/30 border-t border-fbWhite/10">
            <slot
              name="footer"
              :is-valid="isValid"
              :handle-confirm="handleConfirm"
              :handle-cancel="handleCancel"
            >
              <button
                @click="handleConfirm"
                :disabled="!isValid"
                :class="[
                  'px-6 py-2 rounded-lg transition-colors',
                  isValid
                    ? 'bg-accent/20 border border-accent/50 hover:bg-accent/30 text-accent'
                    : 'bg-fbHover/50 text-fbWhite/50 border border-fbWhite/20 cursor-not-allowed',
                ]"
              >
                Confirm
              </button>
              <button
                @click="handleCancel"
                class="border border-destructive/50 bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all text-xl rounded-md px-2"
              >
                &times;
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';

  interface Props {
    showModal: boolean;
    columns: string[];
    startLine: number;
    previewData: string[][];
    columnOptions: Array<{ value: string; label: string; required?: boolean }>;
    validateRequired?: boolean;
  }

  const props = defineProps<Props>();
  const startLine = ref(props.startLine);

  // Filter preview data based on start line
  const filteredPreviewData = computed(() => {
    return props.previewData
      .map((row, index) => ({
        rowNumber: index + 1,
        data: row,
      }))
      .slice(startLine.value - 1);
  });

  // Watch for start line changes
  watch(startLine, newValue => {
    emit('update:start-line', newValue);
  });

  const emit = defineEmits<{
    'update:mappings': [mappings: Record<string, string>];
    'update:valid': [isValid: boolean];
    'update:start-line': [startLine: number];
    confirm: [mappings: Record<string, string>];
    cancel: [];
  }>();

  const mappings = ref<Record<string, string>>({});

  // Initialize all columns with empty values
  function initializeMappings() {
    props.columns.forEach((_, index) => {
      mappings.value[index] = '';
    });
  }

  // Call initialization when component is created
  initializeMappings();

  // Reset mappings when columns change
  watch(
    () => props.columns,
    () => {
      initializeMappings();
    }
  );

  function availableOptions(currentIndex: number) {
    // Create a set of used roles excluding the current column's role
    const usedRoles = new Set(
      Object.entries(mappings.value)
        .filter(([index, role]) => parseInt(index) !== currentIndex && role !== '')
        .map(([_, role]) => role)
    );

    // Return only options that aren't already used
    return props.columnOptions.filter(option => !usedRoles.has(option.value));
  }

  // Check if all required columns are mapped
  const allColumnsMapped = computed(() => {
    if (props.validateRequired) {
      // Only check required columns
      const requiredOptions = props.columnOptions.filter(option => option.required);
      const mappedRoles = new Set(Object.values(mappings.value));
      return requiredOptions.every(option => mappedRoles.has(option.value));
    } else {
      // Original behavior: check all columns
      const selectedCount = Object.values(mappings.value).filter(value => value !== '').length;
      return selectedCount === props.columnOptions.length;
    }
  });

  const shouldDisableSelects = computed(() => {
    if (props.validateRequired) {
      return false; // Never disable selects in validateRequired mode
    }
    return allColumnsMapped.value;
  });

  function handleMappingChange() {
    emit('update:mappings', mappings.value);
    // Emit the validation state whenever mappings change
    emit('update:valid', isValid.value);
  }

  function handleConfirm() {
    emit('confirm', mappings.value);
  }

  function handleCancel() {
    emit('cancel');
  }

  // Let parent component handle validation
  const isValid = computed(() => {
    return allColumnsMapped.value;
  });
</script>
