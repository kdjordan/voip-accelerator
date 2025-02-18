<template>
  <transition name="modal">
    <div
      v-if="showModal"
      class="fixed z-10 inset-0 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen px-4 text-center w-full">
        <div
          class="fixed inset-0 transition-opacity"
          aria-hidden="true"
        >
          <div class="absolute inset-0 bg-fbBlack opacity-75"></div>
        </div>
        <span
          class="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
          >&#8203;</span
        >
        <div
          class="inline-block align-bottom rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6 bg-fbBlack"
        >
          <div class="rounded-lg border border-fbWhite/20 overflow-hidden">
            <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <div class="flex items-center justify-between">
                    <h3
                      class="text-lg leading-6 font-medium text-fbWhite"
                      id="modal-title"
                    >
                      Select Column Roles {{ isNPANXXDeck ? '(US)' : '(AZ)' }}
                    </h3>
                    <div>
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
                          v-for="i in 10"
                          :key="i"
                          :value="i"
                        >
                          {{ i }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div
                    v-if="isNPANXXDeck"
                    class="my-4 w-1/3"
                  >
                    <label
                      for="indetermRateSelect"
                      class="block text-sm font-medium text-fbWhite/70"
                      >Define Indeterminate Rate:</label
                    >
                    <select
                      id="indetermRateSelect"
                      v-model="indetermRateSelection"
                      class="select-custom mt-1 block w-full bg-fbHover text-fbWhite rounded-md py-2 pl-3 focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
                    >
                      <option value="default">By selecting column</option>
                      <option value="inter">Using Interstate Rate</option>
                      <option value="intra">Using Intrastate Rate</option>
                    </select>
                  </div>
                  <div class="mt-2 overflow-auto max-h-80">
                    <table class="min-w-full rounded-lg overflow-hidden">
                      <thead class="bg-fbHover">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-fbWhite/70 uppercase tracking-wider">
                            Row
                          </th>
                          <th
                            v-for="(col, index) in columns"
                            :key="index"
                            class="px-6 py-3 text-left text-xs font-medium text-fbWhite/70 uppercase tracking-wider"
                          >
                            <select
                              v-model="columnRoles[index]"
                              class="select-custom min-w-[180px] block w-full rounded-md py-2 pl-3 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-accent"
                              :class="{
                                'bg-accent/20 text-accent border border-accent/50': columnRoles[index] !== '',
                                'bg-fbHover text-fbWhite border border-fbWhite/20': columnRoles[index] === '',
                              }"
                            >
                              <option value="">Select Column Role</option>
                              <option
                                v-for="role in availableRoles(index)"
                                :key="role.value"
                                :value="role.value"
                              >
                                {{ role.label }}
                              </option>
                            </select>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, rowIndex) in displayedData"
                          :key="rowIndex"
                          :class="['transition-colors', rowIndex % 2 === 0 ? 'bg-transparent' : 'bg-fbHover/30']"
                        >
                          <td class="px-4 py-2">
                            {{ rowIndex + 1 }}
                          </td>
                          <td
                            v-for="(cell, cellIndex) in row"
                            :key="cellIndex"
                            class="px-6 py-4 whitespace-nowrap"
                          >
                            {{ cell }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-4 bg-fbHover/30 border-t border-fbWhite/10">
              <button
                @click="confirmColumnRoles"
                :disabled="!allRequiredRolesSelected"
                :class="[
                  'px-6 py-2 rounded-lg transition-colors',
                  allRequiredRolesSelected
                    ? 'bg-accent/20 border border-accent/50 hover:bg-accent/30 text-accent'
                    : 'bg-fbHover/50 text-fbWhite/50 border border-fbWhite/20 cursor-not-allowed',
                ]"
              >
                Confirm
              </button>
              <button
                @click="cancelModal"
                type="button"
                class="border border-destructive/50 bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all text-xl rounded-md px-2"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { AZColumnRole } from '@/types/az-types';
  import { USColumnRole } from '@/types/us-types';
  import { DBName } from '@/types';
  import { type DBNameType, type ColumnRoleOption } from '@/types/app-types';

  const props = defineProps<{
    showModal: boolean;
    columns: string[];
    previewData: string[][];
    columnRoles: string[];
    startLine: number;
    columnRoleOptions: { value: string; label: string }[];
    deckType: (typeof DBName)[keyof typeof DBName];
  }>();

  const emit = defineEmits(['confirm', 'cancel']);

  const startLine = ref(props.startLine);

  // Initialize columnRoles based on the number of columns, if not already initialized
  const columnRoles = ref(props.columnRoles.length > 0 ? [...props.columnRoles] : props.columns.map(() => ''));

  // Watch for changes in props.columnRoles to update local state if necessary
  watch(
    () => props.columnRoles,
    newRoles => {
      columnRoles.value = newRoles.length > 0 ? [...newRoles] : props.columns.map(() => '');
    },
    { immediate: true }
  );

  const isNPANXXDeck = computed(() => {
    return props.deckType === DBName.US;
  });

  const availableRoles = (currentIndex: number) => {
    // Create a set of used roles including implicit roles from NPANXX and NPA/NXX
    const usedRoles = new Set(columnRoles.value.filter(role => role !== '' && role !== undefined));

    columnRoles.value.forEach((role, idx) => {
      if (idx !== currentIndex) {
        // When NPANXX is selected, block NPA and NXX
        if (role === USColumnRole.NPANXX) {
          usedRoles.add(USColumnRole.NPA);
          usedRoles.add(USColumnRole.NXX);
        }
        // When either NPA or NXX is selected, block NPANXX
        if (role === USColumnRole.NPA || role === USColumnRole.NXX) {
          usedRoles.add(USColumnRole.NPANXX);
        }
      }
    });

    return props.columnRoleOptions.filter(role => {
      if (isNPANXXDeck.value) {
        // Handle indeterminate rate selection
        if (indetermRateSelection.value !== 'default' && role.value === USColumnRole.INDETERMINATE) {
          return false;
        }
      }

      // Don't show already used roles (unless it's the current column's role)
      const isAvailable = !usedRoles.has(role.value) || role.value === columnRoles.value[currentIndex];
      return isAvailable;
    });
  };

  const displayedData = computed(() => {
    return props.previewData.slice(startLine.value - 1);
  });

  // Check if all required roles are selected
  const allRequiredRolesSelected = computed(() => {
    const selectedRoles = new Set(columnRoles.value.filter(role => role !== ''));

    if (isNPANXXDeck.value) {
      const hasNPANXX = selectedRoles.has('NPANXX');
      const hasNPAandNXX = selectedRoles.has('NPA') && selectedRoles.has('NXX');
      const hasRates = selectedRoles.has('inter') && selectedRoles.has('intra');
      const hasIndetermOrSelection = selectedRoles.has('indeterm') || indetermRateSelection.value !== 'default';

      return (hasNPANXX || hasNPAandNXX) && hasRates && hasIndetermOrSelection;
    } else {
      // For AZ deck - use the imported const values
      return [AZColumnRole.DESTINATION, AZColumnRole.DIALCODE, AZColumnRole.RATE].every(role =>
        selectedRoles.has(role)
      );
    }
  });

  const indetermRateSelection = ref('default');

  function confirmColumnRoles() {
    emit('confirm', {
      columnRoles: columnRoles.value,
      startLine: startLine.value,
      deckType: isNPANXXDeck.value ? 'us' : 'az',
      indetermRateType: indetermRateSelection.value,
    });
  }

  function cancelModal() {
    emit('cancel');
  }

  watch(indetermRateSelection, () => {
    // Reset the 'indeterm' column role if it was previously selected
    const indetermIndex = columnRoles.value.findIndex(role => role === 'indeterm');
    if (indetermIndex !== -1 && indetermRateSelection.value !== 'default') {
      columnRoles.value[indetermIndex] = '';
    }
  });
</script>
