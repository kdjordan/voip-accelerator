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

            <!-- US-specific help text -->
            <div v-if="isUSFile" class="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-md">
              <p class="text-sm text-accent">
                <span class="font-medium">US File Requirements:</span> 
                Either select NPANXX column <strong>or</strong> both NPA and NXX columns. 
                Interstate and Intrastate rates are required.
                <br>
                For Indeterminate rates, either select a column <strong>or</strong> choose to use Interstate or Intrastate rate.
              </p>
            </div>

            <!-- US-specific Indeterminate Rate Definition -->
            <div v-if="isUSFile" class="mb-6">
              <label class="block text-sm font-medium text-fbWhite/70 mb-2">
                Indeterminate Rate defined by:
              </label>
              <select
                v-model="indeterminateRateDefinition"
                class="select-custom block w-64 bg-fbHover text-fbWhite rounded-md py-2 pl-3 focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
                :class="{
                  'border-red-500': shouldShowIndeterminateError && showValidationErrors
                }"
                @change="handleIndeterminateRateChange"
              >
                <option value="column">Column Role</option>
                <option value="intrastate">Use Intrastate Rate</option>
                <option value="interstate">Use Interstate Rate</option>
              </select>
              <p v-if="shouldShowIndeterminateError && showValidationErrors" class="mt-1 text-xs text-red-500">
                Select an Indeterminate Rate column or choose how to calculate it
              </p>
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
                              mappings[index] === '' && allColumnsMapped && !props.validateRequired && !(isUSFile && indeterminateRateDefinition.value === 'column'),
                          }"
                          @change="handleMappingChange"
                          :disabled="mappings[index] === '' && allColumnsMapped && !props.validateRequired && !(isUSFile && indeterminateRateDefinition.value === 'column')"
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
  import { USColumnRole } from '@/types/domains/us-types';

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
  const indeterminateRateDefinition = ref('column');
  const showValidationErrors = ref(false);

  // Detect if this is a US file by checking for NPA or NPANXX in column options
  const isUSFile = computed(() => {
    return props.columnOptions.some(option => 
      option.value === USColumnRole.NPA || 
      option.value === USColumnRole.NPANXX
    );
  });

  // Check if indeterminate rate column is selected
  const hasIndeterminateColumn = computed(() => {
    const mappedRoles = new Set(Object.values(mappings.value).filter(value => value !== ''));
    return mappedRoles.has(USColumnRole.INDETERMINATE);
  });

  // Determine if we should show indeterminate error
  const shouldShowIndeterminateError = computed(() => {
    return indeterminateRateDefinition.value === 'column' && !hasIndeterminateColumn.value;
  });

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
    'update:indeterminate-definition': [definition: string];
    confirm: [mappings: Record<string, string>, indeterminateDefinition?: string];
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

  function handleIndeterminateRateChange() {
    emit('update:indeterminate-definition', indeterminateRateDefinition.value);
    
    // Reset validation errors when the selection changes
    showValidationErrors.value = false;
    
    // Update validation
    emit('update:valid', isValid.value);
  }

  function availableOptions(currentIndex: number) {
    // Create a set of used roles excluding the current column's role
    const usedRoles = new Set(
      Object.entries(mappings.value)
        .filter(([index, role]) => parseInt(index) !== currentIndex && role !== '')
        .map(([_, role]) => role)
    );

    // For US files, handle special constraints
    if (isUSFile.value) {
      const currentValue = mappings.value[currentIndex];
      const hasNPA = usedRoles.has(USColumnRole.NPA) || currentValue === USColumnRole.NPA;
      const hasNXX = usedRoles.has(USColumnRole.NXX) || currentValue === USColumnRole.NXX;
      const hasNPANXX = usedRoles.has(USColumnRole.NPANXX) || currentValue === USColumnRole.NPANXX;

      return props.columnOptions.filter(option => {
        // If this is the current column's value, always include it
        if (option.value === currentValue) return true;

        // If the option is already used elsewhere, exclude it
        if (usedRoles.has(option.value)) return false;

        // Apply US-specific constraints
        if (option.value === USColumnRole.NPANXX && (hasNPA || hasNXX)) return false;
        if ((option.value === USColumnRole.NPA || option.value === USColumnRole.NXX) && hasNPANXX) return false;

        // Only show Indeterminate column option when "Column Role" is selected
        if (option.value === USColumnRole.INDETERMINATE) {
          return indeterminateRateDefinition.value === 'column';
        }

        return true;
      });
    }

    // For non-US files, just filter out used roles
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
      // For US files, ensure valid column combinations
      if (isUSFile.value) {
        const mappedRoles = new Set(Object.values(mappings.value).filter(value => value !== ''));
        const hasNPANXX = mappedRoles.has(USColumnRole.NPANXX);
        const hasNPA = mappedRoles.has(USColumnRole.NPA);
        const hasNXX = mappedRoles.has(USColumnRole.NXX);
        const hasInterstate = mappedRoles.has(USColumnRole.INTERSTATE);
        const hasIntrastate = mappedRoles.has(USColumnRole.INTRASTATE);
        
        // Base requirements
        const hasValidNPANXXCombination = hasNPANXX || (hasNPA && hasNXX);
        const hasRequiredRates = hasInterstate && hasIntrastate;
        
        // If using column for indeterminate, don't consider it mapped until selected
        if (indeterminateRateDefinition.value === 'column') {
          const hasIndeterminate = mappedRoles.has(USColumnRole.INDETERMINATE);
          return hasValidNPANXXCombination && hasRequiredRates && hasIndeterminate;
        }
        
        return hasValidNPANXXCombination && hasRequiredRates;
      }
      
      // Original behavior for non-US files
      const selectedCount = Object.values(mappings.value).filter(value => value !== '').length;
      return selectedCount === props.columnOptions.length;
    }
  });

  // Add validation for US files
  const isValid = computed(() => {
    if (isUSFile.value) {
      const mappedRoles = new Set(Object.values(mappings.value).filter(value => value !== ''));
      
      // Check if NPA/NXX or NPANXX are correctly selected
      const hasNPANXX = mappedRoles.has(USColumnRole.NPANXX);
      const hasNPA = mappedRoles.has(USColumnRole.NPA);
      const hasNXX = mappedRoles.has(USColumnRole.NXX);
      
      // Either NPANXX must be selected, or both NPA and NXX must be selected
      const hasValidNPANXXCombination = hasNPANXX || (hasNPA && hasNXX);
      
      // Check if all rate columns are selected
      const hasInterstate = mappedRoles.has(USColumnRole.INTERSTATE);
      const hasIntrastate = mappedRoles.has(USColumnRole.INTRASTATE);
      
      // Base validation for required columns (NPA/NXX/NPANXX + Interstate/Intrastate)
      const baseValid = hasValidNPANXXCombination && hasInterstate && hasIntrastate;

      // When "Column Role" is selected (default), require an Indeterminate column
      if (indeterminateRateDefinition.value === 'column') {
        const hasIndeterminate = mappedRoles.has(USColumnRole.INDETERMINATE);
        return baseValid && hasIndeterminate;
      }
      
      // When using Interstate/Intrastate rates, don't require Indeterminate column
      return baseValid;
    }
    
    // Non-US file validation (default behavior)
    return allColumnsMapped.value;
  });

  function handleConfirm() {
    if (!isValid.value) {
      showValidationErrors.value = true;
      return;
    }
    
    if (isUSFile.value) {
      const mappedRoles = new Set(Object.values(mappings.value).filter(value => value !== ''));
      const hasIndeterminate = mappedRoles.has(USColumnRole.INDETERMINATE);
      
      // Only pass the indeterminate definition if we're not using a column
      if (indeterminateRateDefinition.value !== 'column') {
        emit('confirm', mappings.value, indeterminateRateDefinition.value);
      } else {
        // When using a column, don't pass a definition
        emit('confirm', mappings.value);
      }
    } else {
      emit('confirm', mappings.value);
    }
  }

  function handleCancel() {
    emit('cancel');
  }

  function handleMappingChange() {
    emit('update:mappings', mappings.value);
    emit('update:valid', isValid.value);
  }

  // Add a watcher to update validation when mappings change
  watch(
    mappings,
    () => {
      handleMappingChange();
    },
    { deep: true }
  );
</script>
