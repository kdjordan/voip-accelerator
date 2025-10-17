<template>
  <div class="relative">
    <Listbox
      :value="currentRole"
      @update:model-value="handleRoleChange"
      :disabled="isLoading"
    >
      <div class="relative">
        <ListboxButton
          class="relative w-full cursor-default rounded bg-gray-700 py-1 pl-3 pr-8 text-left text-sm text-white shadow-sm ring-1 ring-inset ring-gray-600 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
          :class="getRoleColorClass(currentRole)"
        >
          <span class="flex items-center">
            <span class="block truncate">{{ getRoleDisplayName(currentRole) }}</span>
          </span>
          <span class="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
            <ArrowPathIcon v-if="isLoading" class="h-4 w-4 animate-spin text-gray-400" />
            <ChevronUpDownIcon v-else class="h-4 w-4 text-gray-400" aria-hidden="true" />
          </span>
        </ListboxButton>

        <transition
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-gray-800 py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <ListboxOption
              v-for="role in roles"
              :key="role.value"
              :value="role.value"
              as="template"
              v-slot="{ active, selected }"
            >
              <li
                :class="[
                  active ? 'bg-accent/20 text-white' : 'text-gray-300',
                  'relative cursor-default select-none py-2 pl-3 pr-9'
                ]"
              >
                <div class="flex items-center">
                  <span
                    :class="[
                      selected ? 'font-semibold' : 'font-normal',
                      'block truncate'
                    ]"
                  >
                    {{ role.name }}
                  </span>
                </div>

                <span
                  v-if="selected"
                  :class="[
                    active ? 'text-white' : 'text-accent',
                    'absolute inset-y-0 right-0 flex items-center pr-4'
                  ]"
                >
                  <CheckIcon class="h-4 w-4" aria-hidden="true" />
                </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </div>
    </Listbox>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowPathIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'

// Props
interface Props {
  currentRole: string
  userId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'role-changed': [role: 'user' | 'admin']
}>()

// Local state
const isLoading = ref(false)

// Role options
const roles = [
  { value: 'user', name: 'User' },
  { value: 'admin', name: 'Admin' }
]

// Methods
async function handleRoleChange(newRole: 'user' | 'admin') {
  if (newRole === props.currentRole) {
    return
  }

  // Confirm role change
  const confirmMessage = getConfirmMessage(props.currentRole, newRole)
  if (!confirm(confirmMessage)) {
    return
  }

  try {
    isLoading.value = true
    emit('role-changed', newRole)
  } catch (error) {
    console.error('Failed to change role:', error)
  } finally {
    isLoading.value = false
  }
}

function getConfirmMessage(currentRole: string, newRole: string): string {
  if (newRole === 'admin') {
    return `Are you sure you want to grant Admin privileges? This allows the user to manage other users.`
  } else if (currentRole === 'admin') {
    return `Are you sure you want to remove admin privileges and make this user a regular User?`
  }
  return `Are you sure you want to change this user's role to ${newRole}?`
}

function getRoleDisplayName(role: string): string {
  const roleObj = roles.find(r => r.value === role)
  return roleObj?.name || role
}

function getRoleColorClass(role: string): string {
  switch (role) {
    case 'admin':
      return 'text-yellow-400 ring-yellow-500/30'
    case 'user':
    default:
      return 'text-green-400 ring-green-500/30'
  }
}
</script>