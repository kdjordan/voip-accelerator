<template>
  <transition
    enter-active-class="ease-out duration-300"
    enter-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="ease-in duration-200"
    leave-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/60" @click="handleCancel"></div>

        <!-- Modal Content -->
        <div
          class="relative transform border border-line-strong bg-surface text-left transition-all m-4 w-full max-w-7xl max-h-[90vh] flex flex-col"
        >
          <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 overflow-auto">
            <div class="flex justify-between items-center mb-6">
              <h3 class="font-display text-lg leading-6 font-semibold uppercase tracking-wider text-fg">Select Column Roles</h3>
            </div>

            <!-- Informational note about auto-generated fields -->
            <!-- US-specific help text -->
            <!--
            <div
              v-if="isUSFile"
              class="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md"
            >
              <p class="text-sm text-accent">
                <span class="font-medium">US File Requirements:</span>
                Either select NPANXX column <strong>or</strong> both NPA and NXX columns. Interstate
                and Intrastate rates are required.
                <br />
                For Indeterminate rates, either select a column <strong>or</strong> choose to use
                Interstate or Intrastate rate.
              </p>
            </div>
-->
            <!-- US-specific Indeterminate Rate Definition -->

            <div v-if="isUSFile" class="mb-6">
              <Listbox v-model="indeterminateRateDefinition" as="div" class="w-64">
                <ListboxLabel class="block font-display text-[10px] uppercase tracking-wider font-medium text-fg-faint mb-2"
                  >Indeterminate Rate defined by:</ListboxLabel
                >
                <div class="relative mt-1">
                  <ListboxButton
                    class="relative w-full cursor-default bg-input py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent sm:text-sm border"
                    :class="[
                      shouldShowIndeterminateError && showValidationErrors
                        ? 'border-down'
                        : 'border-line-strong',
                    ]"
                    @click="handleIndeterminateListboxClick"
                  >
                    <span class="block truncate font-display text-fg">{{
                      selectedIndeterminateLabel
                    }}</span>
                    <span
                      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                    >
                      <ChevronUpDownIcon class="h-5 w-5 text-fg-faint" aria-hidden="true" />
                    </span>
                  </ListboxButton>

                  <transition
                    leave-active-class="transition duration-100 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <ListboxOptions
                      class="absolute z-10 mt-1 max-h-60 w-full overflow-auto border border-line-strong bg-surface py-1 text-base focus:outline-none sm:text-sm"
                    >
                      <ListboxOption
                        v-for="option in indeterminateOptions"
                        :key="option.value"
                        :value="option.value"
                        v-slot="{ active, selected }"
                        as="template"
                      >
                        <li
                          :class="[
                            active ? 'bg-accent-soft text-accent' : 'text-fg-dim',
                            'relative cursor-default select-none py-2 pl-10 pr-4 font-display',
                          ]"
                        >
                          <span
                            :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']"
                            >{{ option.label }}</span
                          >
                          <span
                            v-if="selected"
                            class="absolute inset-y-0 left-0 flex items-center pl-3 text-accent"
                          >
                            <CheckIcon class="h-5 w-5" aria-hidden="true" />
                          </span>
                        </li>
                      </ListboxOption>
                    </ListboxOptions>
                  </transition>
                </div>
              </Listbox>
              <p
                v-if="shouldShowIndeterminateError && showValidationErrors"
                class="mt-1 font-sans text-xs text-down"
              >
                Select an Indeterminate Rate column or choose how to calculate it
              </p>
            </div>

            <!-- Provider Name Input (Rate Gen only) -->
            <div v-if="requireProviderName" class="mb-6">
              <label class="block font-display text-[10px] uppercase tracking-wider font-medium text-fg-faint mb-2">
                Provider Name (Required)
              </label>
              <input
                v-model="localProviderName"
                type="text"
                maxlength="20"
                required
                class="w-full max-w-md px-3 py-2 bg-input border border-line-strong font-display text-fg
                       focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent
                       placeholder-fg-mute"
                placeholder="Enter provider name (max 20 chars)"
                @input="handleProviderNameChange"
              />
              <p class="mt-1 font-sans text-xs text-fg-mute">
                This name will be used to identify the provider in reports and analysis
              </p>
            </div>

            <!-- Column Mapping Section -->
            <div class="mb-8">
              <div class="mt-2 overflow-auto max-h-80 border border-line">
                <table class="min-w-full">
                  <thead class="sticky top-0 z-10 bg-row">
                    <tr>
                      <th class="min-w-[80px] p-1 text-left border-b border-line">
                        <div class="font-display text-[11px] uppercase tracking-wider text-fg-faint pl-3">ROW</div>
                      </th>
                      <th
                        v-for="(column, index) in columns"
                        :key="index"
                        class="px-6 py-3 text-left font-display text-[11px] font-medium text-fg-faint uppercase tracking-wider border-b border-line"
                      >
                        <Listbox v-model="mappings[index]" as="div" class="min-w-[200px]">
                          <div class="relative mt-1">
                            <ListboxButton
                              class="relative w-full cursor-default py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent sm:text-sm transition-colors duration-200 border font-display"
                              :class="{
                                'bg-accent-soft text-accent border-accent-ring': mappings[index] !== '',
                                'bg-input text-fg border-line-strong':
                                  mappings[index] === '' &&
                                  (!allColumnsMapped || props.validateRequired),
                                'bg-row text-fg-mute border-line cursor-not-allowed':
                                  mappings[index] === '' &&
                                  allColumnsMapped &&
                                  !props.validateRequired &&
                                  !(isUSFile && indeterminateRateDefinition === 'column'),
                              }"
                              :disabled="
                                mappings[index] === '' &&
                                allColumnsMapped &&
                                !props.validateRequired &&
                                !(isUSFile && indeterminateRateDefinition === 'column')
                              "
                            >
                              <span class="block truncate">{{
                                selectedColumnRoleLabel(index)
                              }}</span>
                              <span
                                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                              >
                                <ChevronUpDownIcon
                                  class="h-5 w-5 text-fg-faint"
                                  aria-hidden="true"
                                />
                              </span>
                            </ListboxButton>

                            <transition
                              leave-active-class="transition duration-100 ease-in"
                              leave-from-class="opacity-100"
                              leave-to-class="opacity-0"
                            >
                              <ListboxOptions
                                class="absolute z-10 mt-1 max-h-60 w-full overflow-auto border border-line-strong bg-surface py-1 text-base focus:outline-none sm:text-sm"
                              >
                                <ListboxOption value="" v-slot="{ active, selected }" as="template">
                                  <li
                                    :class="[
                                      active ? 'bg-accent-soft text-accent' : 'text-fg-dim',
                                      'relative cursor-default select-none py-2 pl-10 pr-4 font-display',
                                    ]"
                                  >
                                    <span
                                      :class="[
                                        selected ? 'font-medium' : 'font-normal',
                                        'block truncate',
                                      ]"
                                      >Select Column Role</span
                                    >
                                    <span
                                      v-if="selected"
                                      class="absolute inset-y-0 left-0 flex items-center pl-3 text-accent"
                                    >
                                      <CheckIcon class="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  </li>
                                </ListboxOption>
                                <ListboxOption
                                  v-for="option in availableOptions(index)"
                                  :key="option.value"
                                  :value="option.value"
                                  v-slot="{ active, selected }"
                                  as="template"
                                >
                                  <li
                                    :class="[
                                      active ? 'bg-accent-soft text-accent' : 'text-fg-dim',
                                      'relative cursor-default select-none py-2 pl-10 pr-4 font-display',
                                    ]"
                                  >
                                    <span
                                      :class="[
                                        selected ? 'font-medium' : 'font-normal',
                                        'block truncate',
                                      ]"
                                      >{{ option.label }}</span
                                    >
                                    <span
                                      v-if="selected"
                                      class="absolute inset-y-0 left-0 flex items-center pl-3 text-accent"
                                    >
                                      <CheckIcon class="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  </li>
                                </ListboxOption>
                              </ListboxOptions>
                            </transition>
                          </div>
                        </Listbox>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in filteredPreviewData"
                      :key="row.rowNumber"
                      :class="[
                        'transition-colors hover:bg-row-hover',
                        row.rowNumber % 2 === 0 ? 'bg-transparent' : 'bg-row',
                      ]"
                    >
                      <td class="px-4 py-2 font-display tabular-nums text-fg-faint">{{ row.rowNumber }}</td>
                      <td
                        v-for="(cell, cellIndex) in row.data"
                        :key="cellIndex"
                        class="px-6 py-4 whitespace-nowrap text-fg-dim"
                      >
                        {{ cell }}
                      </td>
                    </tr>
                    <tr v-if="filteredPreviewData.length === 0" class="text-center text-fg-mute">
                      <td :colspan="columns.length + 1" class="px-6 py-4">
                        No preview data available
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse items-center gap-4 bg-row border-t border-line"
          >
            <slot
              name="footer"
              :is-valid="isValid"
              :handle-confirm="handleConfirm"
              :handle-cancel="handleCancel"
            >
              <BaseButton
                :disabled="!isValid"
                size="standard"
                variant="primary"
                @click="handleConfirm"
              >
                Confirm
              </BaseButton>
              <BaseButton size="standard" variant="destructive" @click="handleCancel">
                &times;
              </BaseButton>
            </slot>

            <!-- Conditional Effective Date Input for US Rate Sheet -->
            <div
              v-if="props.source && props.source === 'US_RATE_DECK'"
              class="flex items-center gap-2 mr-auto"
            >
              <label
                for="effective-date"
                class="block font-display text-[10px] uppercase tracking-wider font-medium text-fg-faint whitespace-nowrap"
                >Effective Date:</label
              >
              <input
                type="date"
                id="effective-date"
                v-model="effectiveDate"
                class="input-custom bg-input border border-line-strong px-3 py-1.5 font-display text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent-ring focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue';
  import {
    Listbox,
    ListboxButton,
    ListboxLabel,
    ListboxOptions,
    ListboxOption,
  } from '@headlessui/vue';
  import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import { USColumnRole } from '@/types/domains/us-types';
  import {
    PREVIEW_MODAL_MESSAGES,
    PreviewModalSource,
    JourneyMessage,
  } from '@/types/constants/messages';
  import { BasePreviewModalProps, BasePreviewModalEmits } from '@/types/app-types';

  // Use the base types from app-types.ts
  const props = defineProps<BasePreviewModalProps & { source?: PreviewModalSource }>();

  // Update emits definition
  const emit = defineEmits<{
    'update:mappings': [mappings: Record<string, string>];
    'update:valid': [isValid: boolean];
    'update:start-line': [startLine: number];
    'update:indeterminate-definition': [definition: string];
    'update:provider-name': [providerName: string];
    // Add optional effectiveDate to confirm payload
    confirm: [
      mappings: Record<string, string>,
      indeterminateDefinition?: string,
      effectiveDate?: string,
      providerName?: string,
    ];
    cancel: [];
  }>();

  const startLine = ref(props.startLine);
  const indeterminateRateDefinition = ref('column');
  const showValidationErrors = ref(false);
  const effectiveDate = ref(''); // Add ref for effective date
  const localProviderName = ref(props.providerName || ''); // Add ref for provider name

  // Options for Indeterminate Rate Listbox
  const indeterminateOptions = [
    { value: 'column', label: 'Column Role' },
    { value: 'intrastate', label: 'Use Intrastate Rate' },
    { value: 'interstate', label: 'Use Interstate Rate' },
  ];

  // Computed property for selected indeterminate rate label
  const selectedIndeterminateLabel = computed(() => {
    return (
      indeterminateOptions.find((option) => option.value === indeterminateRateDefinition.value)
        ?.label || 'Column Role'
    );
  });

  // Add onMounted hook to set default date
  onMounted(() => {
    const today = new Date();
    effectiveDate.value = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
  });

  // Get the appropriate message based on the source prop
  const modalMessage = computed(() => {
    if (props.source && props.source in PREVIEW_MODAL_MESSAGES) {
      return PREVIEW_MODAL_MESSAGES[props.source as PreviewModalSource];
    }
    // Default to AZ_RATE_DECK if no source provided or invalid source
    return PREVIEW_MODAL_MESSAGES.AZ_RATE_DECK;
  });

  // Detect if this is a LERG file by checking the source prop
  const isLERGFile = computed(() => {
    return props.source === 'LERG';
  });

  // Detect if this is a US file by checking for NPA or NPANXX in column options
  const isUSFile = computed(() => {
    // LERG files should never be treated as US files even if they have NPA column
    if (isLERGFile.value) return false;
    
    return props.columnOptions.some(
      (option) => option.value === USColumnRole.NPA || option.value === USColumnRole.NPANXX
    );
  });

  // Check if indeterminate rate column is selected
  const hasIndeterminateColumn = computed(() => {
    const mappedRoles = new Set(Object.values(mappings.value).filter((value) => value !== ''));
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
  watch(startLine, (newValue) => {
    emit('update:start-line', newValue);
  });

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

  // Update watcher for indeterminate rate definition to handle Listbox v-model changes
  watch(indeterminateRateDefinition, (newValue) => {
    emit('update:indeterminate-definition', newValue);
    // Reset validation errors when the selection changes
    showValidationErrors.value = false;
    // Update overall validation status
    emit('update:valid', isValid.value);
  });

  // Computed property to get the label for the selected column role
  function selectedColumnRoleLabel(index: number): string {
    const selectedValue = mappings.value[index];
    if (selectedValue === '') {
      return 'Select Column Role';
    }
    // Find the option label in the full list (props.columnOptions)
    return (
      props.columnOptions.find((option) => option.value === selectedValue)?.label || selectedValue
    );
  }

  function handleIndeterminateListboxClick() {
    // This function can potentially be used to clear validation errors immediately on click
    // For now, the watcher handles it on selection change, which is generally sufficient
    // showValidationErrors.value = false;
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

      return props.columnOptions.filter((option) => {
        // If this is the current column's value, always include it
        if (option.value === currentValue) return true;

        // If the option is already used elsewhere, exclude it
        if (usedRoles.has(option.value)) return false;

        // Apply US-specific constraints
        if (option.value === USColumnRole.NPANXX && (hasNPA || hasNXX)) return false;
        if ((option.value === USColumnRole.NPA || option.value === USColumnRole.NXX) && hasNPANXX)
          return false;

        // Only show Indeterminate column option when "Column Role" is selected
        if (option.value === USColumnRole.INDETERMINATE) {
          return indeterminateRateDefinition.value === 'column';
        }

        return true;
      });
    }

    // For non-US files, just filter out used roles
    return props.columnOptions.filter((option) => !usedRoles.has(option.value));
  }

  // Check if all required columns are mapped
  const allColumnsMapped = computed(() => {
    if (props.validateRequired) {
      // Only check required columns
      const requiredOptions = props.columnOptions.filter((option) => option.required);
      const mappedRoles = new Set(Object.values(mappings.value));
      return requiredOptions.every((option) => mappedRoles.has(option.value));
    } else {
      // For US files, ensure valid column combinations
      if (isUSFile.value) {
        const mappedRoles = new Set(Object.values(mappings.value).filter((value) => value !== ''));
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
      const selectedCount = Object.values(mappings.value).filter((value) => value !== '').length;
      return selectedCount === props.columnOptions.length;
    }
  });

  // Add validation for US files
  const isValid = computed(() => {
    // LERG file validation - only requires NPA, State, and Country
    if (isLERGFile.value) {
      const mappedRoles = new Set(Object.values(mappings.value).filter((value) => value !== ''));
      const hasNPA = mappedRoles.has('npa');
      const hasState = mappedRoles.has('state');
      const hasCountry = mappedRoles.has('country');
      return hasNPA && hasState && hasCountry;
    }

    if (isUSFile.value) {
      const mappedRoles = new Set(Object.values(mappings.value).filter((value) => value !== ''));

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
      let baseValid = hasValidNPANXXCombination && hasInterstate && hasIntrastate;

      // Add provider name validation for Rate Gen US files
      if (props.requireProviderName) {
        baseValid = baseValid && localProviderName.value.trim().length > 0;
      }

      // When "Column Role" is selected (default), require an Indeterminate column
      if (indeterminateRateDefinition.value === 'column') {
        const hasIndeterminate = mappedRoles.has(USColumnRole.INDETERMINATE);
        return baseValid && hasIndeterminate;
      }

      // When using Interstate/Intrastate rates, don't require Indeterminate column
      return baseValid;
    }

    // Non-US file validation (default behavior)
    let baseValid = allColumnsMapped.value;
    
    // Add provider name validation for Rate Gen
    if (props.requireProviderName) {
      baseValid = baseValid && localProviderName.value.trim().length > 0;
    }
    
    return baseValid;
  });

  function handleConfirm() {
    // First ensure all required fields are mapped
    if (props.validateRequired) {
      const requiredMapped = props.columnOptions
        .filter((option) => option.required)
        .every((option) => Object.values(mappings.value).includes(option.value));

      // For US files with indeterminate rate, check if mapping is required but not mapped
      // and indeterminate strategy is 'column'
      const requiresIndeterminateMapping =
        isUSFile.value &&
        indeterminateRateDefinition.value === 'column' &&
        !hasIndeterminateColumn.value;

      if (!requiredMapped || requiresIndeterminateMapping) {
        showValidationErrors.value = true;
        return; // Don't proceed if validation fails
      }
    }

    // Emit all mappings, indeterminate definition, effective date, and provider name
    if (props.source && props.source === 'US_RATE_DECK') {
      emit('confirm', mappings.value, indeterminateRateDefinition.value, effectiveDate.value, localProviderName.value);
    } else if (props.requireProviderName) {
      // For Rate Gen, include provider name
      emit('confirm', mappings.value, indeterminateRateDefinition.value, undefined, localProviderName.value);
    } else {
      // For standard uploads, exclude extra parameters
      emit('confirm', mappings.value, indeterminateRateDefinition.value);
    }
  }

  function handleCancel() {
    emit('cancel');
  }

  function handleMappingChange() {
    emit('update:mappings', mappings.value);
    emit('update:valid', isValid.value);
  }
  
  function handleProviderNameChange() {
    emit('update:provider-name', localProviderName.value);
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

  // Add a watcher to update validation when provider name changes
  watch(
    localProviderName,
    () => {
      handleProviderNameChange();
    }
  );
</script>
