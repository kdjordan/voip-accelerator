<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="text-sizeXl tracking-wide text-accent uppercase mb-8 font-secondary">Admin Dashboard</h1>

    <!-- Stats Dashboard -->
    <div class="flex flex-col gap-6 bg-gray-800 pb-6">
      <!-- LERG Details Section -->
      <div class="bg-gray-900/50">
        <div 
          @click="toggleLergDetails" 
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">LERG Details</h2>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': showLergDetails }"
              class="w-5 h-5 transition-transform text-gray-400"
            />
          </div>
        </div>
        
        <!-- LERG Stats Grid -->
        <div v-if="showLergDetails" class="border-t border-gray-700/50 p-6 space-y-6">
          <div class="grid grid-cols-1 gap-3 border-b border-gray-700/50 pb-4 mb-6">
            <!-- Last Updated -->
            <div>
              <div class="flex justify-between items-center">
                <h3 class="text-gray-400">Last Updated</h3>
                <div class="text-lg">{{ formatDate(lergStats.lastUpdated) }}</div>
              </div>
            </div>
            <!-- Total Records -->
            <div>
              <div class="flex justify-between items-center">
                <h3 class="text-gray-400">Total NPA Records</h3>
                <div class="text-2xl font-bold">{{ formatNumber(lergStats.totalRecords) }}</div>
              </div>
            </div>
            <!-- Total Countries -->
            <div>
              <div class="flex justify-between items-center">
                <h3 class="text-gray-400">Total Countries</h3>
                <div class="text-2xl font-bold">{{ store.getCountryCount }}</div>
              </div>
            </div>
            <!-- Database Connection Status -->
            <div>
              <div class="flex justify-between items-center">
                <h3 class="text-gray-400">Database Status</h3>
                <div class="flex items-center space-x-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="
                      dbStatus.connected
                        ? 'bg-accent animate-status-pulse-success'
                        : 'bg-destructive animate-status-pulse-error'
                    "
                  ></div>
                  <span
                    v-if="!dbStatus.connected"
                    class="text-red-400 text-sm"
                  >
                    {{ dbStatus.error }}
                    <span v-if="dbStatus.details" class="block text-xs mt-1 text-red-300">{{ dbStatus.details }}</span>
                  </span>
                  <span v-else class="text-green-400 text-sm">Connected</span>
                </div>
              </div>
            </div>
            <div class="text-xs text-gray-500 mt-1 text-right">
              Last checked: {{ formatTime(dbStatus.lastChecked) }}
            </div>
            <!-- Storage Status -->
            <div>
              <div class="flex justify-between items-center">
                <h3 class="text-gray-400">Storage Status</h3>
                <div class="flex items-center space-x-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="[
                      isLergLocallyStored
                        ? 'bg-accent animate-status-pulse-success'
                        : 'bg-destructive animate-status-pulse-error',
                    ]"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Breakdown Sections -->
          <div class="space-y-6">
            <!-- US States Section -->
            <div class="bg-gray-900/50">
              <div
                @click="toggleStateDetails"
                class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
              >
                <div class="flex justify-between items-center">
                  <span class="font-medium text-lg">US States</span>
                  <ChevronDownIcon
                    :class="{ 'transform rotate-180': showStateDetails }"
                    class="w-5 h-5 transition-transform text-gray-400"
                  />
                </div>
              </div>
              
              <!-- US States Content -->
              <div
                v-if="showStateDetails"
                class="border-t border-gray-700/50 p-6 space-y-4"
              >
                <!-- Full width rows for multi-NPA states -->
                <div class="space-y-2">
                  <div
                    v-for="state in store.sortedStatesWithNPAs.filter(s => s.npas.length > 1)"
                    :key="state.code"
                    @click="toggleExpandState(state.code)"
                    class="bg-gray-900/80 p-4 rounded-lg w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-medium text-lg">{{ getStateName(state.code, 'US') }}</span>
                      <div class="flex items-center space-x-3">
                        <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {{ state.npas.length }} NPAs
                        </span>
                        <ChevronDownIcon
                          :class="{ 'transform rotate-180': expandedStates.includes(state.code) }"
                          class="w-5 h-5 transition-transform"
                        />
                      </div>
                    </div>

                    <!-- Expanded NPAs list -->
                    <div
                      v-if="expandedStates.includes(state.code)"
                      class="mt-3 pl-4"
                    >
                      <div class="flex flex-wrap gap-2">
                        <div
                          v-for="npa in state.npas"
                          :key="npa"
                          class="text-gray-300 bg-gray-800/50 px-3 py-1 rounded"
                        >
                          {{ npa }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Grid for single NPA states -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    v-for="state in store.sortedStatesWithNPAs.filter(s => s.npas.length === 1)"
                    :key="state.code"
                    class="bg-gray-900/50 p-4 rounded-lg"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-medium">{{ getStateName(state.code, 'US') }}</span>
                      <span class="text-gray-300">{{ state.npas[0] }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Non-US States Section -->
            <div class="bg-gray-900/30 rounded-lg overflow-hidden">
              <div
                @click="toggleCountryDetails"
                class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
              >
                <div class="flex justify-between items-center">
                  <span class="font-medium text-lg">Non-US States</span>
                  <ChevronDownIcon
                    :class="{ 'transform rotate-180': showCountryDetails }"
                    class="w-5 h-5 transition-transform"
                  />
                </div>
              </div>
              <!-- Non-US States Content -->
              <div
                v-if="showCountryDetails"
                class="p-4 space-y-4"
              >
                <!-- Full width rows for multi-NPA countries -->
                <div class="space-y-2">
                  <div
                    v-for="country in store.getCountryData.filter(
                      c => c.country !== 'US' && !(c.country === 'CA' && !c.provinces) && c.npaCount > 1
                    )"
                    :key="country.country"
                    @click="toggleExpandCountry(country.country)"
                    class="bg-gray-900/80 p-4 rounded-lg w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-medium text-lg">{{ getCountryName(country.country) }}</span>
                      <div class="flex items-center space-x-3">
                        <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {{ country.npaCount }} NPAs
                        </span>
                        <ChevronDownIcon
                          :class="{ 'transform rotate-180': expandedCountries.includes(country.country) }"
                          class="w-5 h-5 transition-transform"
                        />
                      </div>
                    </div>

                    <!-- Expanded NPAs list -->
                    <div
                      v-if="expandedCountries.includes(country.country)"
                      class="mt-3 pl-4"
                    >
                      <!-- Show provinces for Canada -->
                      <div
                        v-if="country.country === 'CA'"
                        class="space-y-3"
                      >
                        <!-- Multi-NPA provinces -->
                        <div
                          v-for="province in country.provinces?.filter(p => p.npas.length > 1)"
                          :key="province.code"
                          class="bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-600/40 transition-colors"
                          @click.stop="toggleExpandProvince(province.code)"
                        >
                          <div class="flex justify-between items-center">
                            <span class="font-medium text-lg">{{ getStateName(province.code, 'CA') }}</span>
                            <div class="flex items-center space-x-3">
                              <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
                                {{ province.npas.length }} NPAs
                              </span>
                              <ChevronDownIcon
                                :class="{ 'transform rotate-180': expandedProvinces.includes(province.code) }"
                                class="w-5 h-5 transition-transform"
                              />
                            </div>
                          </div>
                          <!-- Expanded NPAs list for provinces -->
                          <div
                            v-if="expandedProvinces.includes(province.code)"
                            class="mt-3"
                          >
                            <div class="flex flex-wrap gap-2">
                              <div
                                v-for="npa in province.npas"
                                :key="npa"
                                class="text-gray-300 bg-gray-700/50 px-3 py-1 rounded"
                              >
                                {{ npa }}
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Single-NPA provinces grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div
                            v-for="province in country.provinces?.filter(p => p.npas.length === 1)"
                            :key="province.code"
                            class="bg-gray-800/50 p-4 rounded-lg"
                          >
                            <div class="flex justify-between items-center">
                              <span class="font-medium text-lg">{{ getStateName(province.code, 'CA') }}</span>
                              <span class="text-gray-300">{{ province.npas[0] }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <!-- Show regular NPA list for other countries -->
                      <div
                        v-else
                        class="flex flex-wrap gap-2"
                      >
                        <div
                          v-for="npa in country.npas"
                          :key="npa"
                          class="text-gray-300 bg-gray-800/50 px-3 py-1 rounded"
                        >
                          {{ npa }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Grid for single NPA countries -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    v-for="country in store.getCountryData.filter(
                      c => c.country !== 'US' && !(c.country === 'CA' && !c.provinces) && c.npaCount === 1
                    )"
                    :key="country.country"
                    class="bg-gray-900/50 p-4 rounded-lg"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-medium">{{ getCountryName(country.country) }}</span>
                      <span class="text-gray-300">{{ country.npas[0] }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- LERG Management Section -->
      <div class="bg-gray-900/50">
        <div 
          @click="toggleLergSection" 
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">LERG File Management</h2>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': showLergSection }"
              class="w-5 h-5 transition-transform text-gray-400"
            />
          </div>
        </div>
        
        <!-- Expandable content -->
        <div v-if="showLergSection" class="border-t border-gray-700/50 p-6 space-y-6">
          <!-- LERG Upload -->
          <div>
            <h3 class="text-lg font-medium mb-4">Upload LERG File</h3>
            <div
              class="relative border-2 rounded-lg p-8 h-[160px] flex items-center justify-center"
              :class="[
                isDragging
                  ? 'border-accent bg-fbWhite/10'
                  : 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600',
                isLergUploading ? 'animate-upload-pulse cursor-not-allowed' : 'cursor-pointer',
                lergUploadStatus?.type === 'error' ? 'border-red-500' : '',
              ]"
              @dragenter.prevent="() => (isDragging = true)"
              @dragleave.prevent="() => (isDragging = false)"
              @dragover.prevent
              @drop.prevent="handleLergFileDrop"
            >
              <input
                type="file"
                ref="lergFileInput"
                class="absolute inset-0 opacity-0 cursor-pointer"
                :class="{ 'pointer-events-none': isLergUploading }"
                accept=".csv"
                @change="handleLergFileChange"
              />

              <!-- Empty State -->
              <div
                v-if="!isLergUploading && !lergUploadStatus"
                class="text-center"
              >
                <ArrowUpTrayIcon
                  class="w-12 h-12 text-accent mx-auto border border-accent/50 rounded-full p-2 bg-accent/10"
                />
                <p class="mt-2 text-base text-foreground text-accent">DRAG & DROP to upload or CLICK to select file</p>
                <p class="text-xs text-gray-500 mt-1">Supports CSV files (max 500MB)</p>
              </div>

              <!-- Processing/Uploading State -->
              <div
                v-else-if="isLergUploading"
                class="text-center"
              >
                <DocumentIcon class="w-12 h-12 text-accent mx-auto border border-accent/50 rounded-full p-2 bg-accent/10 animate-pulse" />
                <p class="mt-2 text-base text-accent">Processing your file...</p>
                <div class="w-full mt-2 h-2 rounded-full bg-gray-700">
                  <div class="h-full bg-accent rounded-full animate-pulse-width"></div>
                </div>
              </div>

              <!-- Error State -->
              <div
                v-else-if="lergUploadStatus?.type === 'error'"
                class="text-center"
              >
                <div class="bg-red-500/10 p-4 rounded-lg">
                  <p class="text-red-400 font-medium">{{ lergUploadStatus.message }}</p>
                  <p v-if="lergUploadStatus.source" class="text-xs text-red-300 mt-1">Source: {{ lergUploadStatus.source }}</p>
                  <p v-if="lergUploadStatus.details" class="text-xs text-red-300 mt-1">{{ lergUploadStatus.details }}</p>
                  <p class="text-xs text-red-400 mt-2">Please try again or contact support if the issue persists</p>
                </div>
              </div>

              <!-- Warning State -->
              <div
                v-else-if="lergUploadStatus?.type === 'warning'"
                class="text-center"
              >
                <div class="bg-yellow-500/10 p-4 rounded-lg">
                  <p class="text-yellow-400 font-medium">{{ lergUploadStatus.message }}</p>
                  <p v-if="lergUploadStatus.details" class="text-xs text-yellow-300 mt-1">{{ lergUploadStatus.details }}</p>
                  <div class="w-full mt-3 h-2 rounded-full bg-gray-700">
                    <div class="h-full bg-yellow-500 rounded-full animate-pulse-width"></div>
                  </div>
                </div>
              </div>

              <!-- Success State -->
              <div
                v-else-if="lergUploadStatus?.type === 'success'"
                class="text-center"
              >
                <div class="bg-green-500/10 p-4 rounded-lg">
                  <DocumentIcon class="w-12 h-12 text-accent mx-auto border border-accent/50 rounded-full p-2 bg-accent/10" />
                  <p class="mt-2 text-xl text-accent">{{ lergUploadStatus.message }}</p>
                  <p v-if="lergUploadStatus.details" class="text-sm text-accent/80 mt-1">{{ lergUploadStatus.details }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="bg-destructive/10 border border-destructive/50 rounded-lg p-6 mt-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-destructive">Danger Zone</h3>
              <button
                @click="confirmClearLergData"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm border border-destructive/50 bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all rounded-md"
              >
                <TrashIcon class="w-3.5 h-3.5" />
                Clear All LERG Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Storage Management Section -->
      <div class="bg-gray-900/50">
        <div 
          @click="toggleStorageSection" 
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">Storage Management</h2>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': showStorageSection }"
              class="w-5 h-5 transition-transform text-gray-400"
            />
          </div>
        </div>
        
        <!-- Storage Statistics Dashboard -->
        <div v-if="showStorageSection" class="border-t border-gray-700/50 p-6 flex flex-col gap-6">
          <!-- Combined Stats Box -->
          <div class="bg-gray-900/30 rounded-lg p-6">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-lg font-semibold">Storage Statistics</h3>
            </div>
            
            <div class="grid grid-cols-1 gap-3 border-b border-gray-700/50 pb-4 mb-6">
              <div>
                <div class="flex justify-between items-center">
                  <h3 class="text-gray-400">Current Storage Strategy</h3>
                  <div class="text-lg">
                    <span class="text-sm font-medium px-2 py-1 rounded" 
                          :class="currentStrategy === 'memory' ? 'bg-violet-900 text-violet-300' : 'bg-blue-900 text-blue-300'">
                      {{ currentStrategy === 'memory' ? 'Memory (Pinia)' : 'IndexedDB' }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between items-center">
                  <h3 class="text-gray-400">JavaScript Heap Memory</h3>
                  <div class="text-lg" 
                       :class="{'text-red-400': memoryPercentage > 80, 'text-yellow-400': memoryPercentage > 50, 'text-green-400': memoryPercentage <= 50}">
                    {{ memoryUsage.toFixed(1) }} MB ({{ memoryPercentage.toFixed(0) }}% of heap limit)
                  </div>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    class="h-2 rounded-full" 
                    :class="{
                      'bg-red-500': memoryPercentage > 80,
                      'bg-yellow-500': memoryPercentage > 50 && memoryPercentage <= 80,
                      'bg-green-500': memoryPercentage <= 50
                    }"
                    :style="{ width: `${Math.min(memoryPercentage, 100)}%` }"
                  ></div>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  Note: This shows JavaScript heap memory only, not total browser memory.
                </div>
              </div>
              
              <div>
                <div class="flex justify-between items-center">
                  <h3 class="text-gray-400">Auto-Fallback Status</h3>
                  <div class="flex items-center space-x-2">
                    <button 
                      @click="autoFallback = !autoFallback" 
                      class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
                      :class="autoFallback ? 'bg-accent' : 'bg-gray-600'"
                    >
                      <span 
                        class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform"
                        :class="autoFallback ? 'translate-x-6' : 'translate-x-1'"
                      />
                    </button>
                    <span class="text-sm" :class="autoFallback ? 'text-accent' : 'text-gray-400'" id="autoFallbackStatus">
                      {{ autoFallback ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Storage Control Section -->
            <div class="space-y-4">
              <div class="flex gap-4">
                <button 
                  @click="switchToMemory"
                  class="flex-1 py-2 px-4 rounded transition-colors"
                  :class="currentStrategy === 'memory' ? 'bg-violet-600 hover:bg-violet-500' : 'bg-violet-900/60 hover:bg-violet-800'"
                >
                  Use Memory Storage
                </button>
                
                <button 
                  @click="switchToIndexedDB"
                  class="flex-1 py-2 px-4 rounded transition-colors"
                  :class="currentStrategy === 'indexeddb' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-900/60 hover:bg-blue-800'"
                >
                  Use IndexedDB Storage
                </button>
                
                <button 
                  @click="refreshStorageState" 
                  class="px-4 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
                  title="Refresh strategy status"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              
              <div class="text-xs text-gray-400 grid grid-cols-2 gap-4 border-t border-gray-700/50 pt-4">
                <div>
                  <div class="flex justify-between mb-1">
                    <span>Memory Threshold:</span>
                    <span>{{ memoryThreshold }} MB</span>
                  </div>
                  
                  <div class="flex justify-between">
                    <span>Update Interval:</span>
                    <span>{{ updateIntervalSeconds }}s</span>
                  </div>
                </div>
                
                <div>
                  <div class="flex justify-between mb-1">
                    <span>Current Strategy:</span>
                    <span class="font-semibold" :class="{
                      'text-green-400': currentStrategy === 'memory',
                      'text-blue-400': currentStrategy === 'indexeddb'
                    }">
                      {{ currentStrategy === 'memory' ? 'Memory (Pinia)' : 'IndexedDB' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Performance Metrics Section -->
          <div class="bg-gray-900/30 rounded-lg overflow-hidden">
            <div
              @click="togglePerformanceSection"
              class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
            >
              <div class="flex justify-between items-center">
                <span class="font-medium text-lg">Performance Metrics</span>
                <ChevronDownIcon
                  :class="{ 'transform rotate-180': showPerformanceSection }"
                  class="w-5 h-5 transition-transform"
                />
              </div>
            </div>
            
            <div v-if="showPerformanceSection" class="p-4">
              <div v-if="metrics.length > 0" class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-gray-400 border-b border-gray-700">
                      <th class="pb-2">Operation</th>
                      <th class="pb-2">Records</th>
                      <th class="pb-2">Memory</th>
                      <th class="pb-2">IndexedDB</th>
                      <th class="pb-2">Speedup</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(group, i) in groupedMetrics" :key="i" class="border-b border-gray-700/30">
                      <td class="py-3">{{ group.operation }}</td>
                      <td class="py-3">{{ group.recordCount }}</td>
                      <td class="py-3" :class="{'text-green-400': group.speedup > 1, 'text-red-400': group.speedup < 1}">
                        {{ group.memoryTime.toFixed(0) }}ms
                      </td>
                      <td class="py-3" :class="{'text-green-400': group.speedup < 1, 'text-red-400': group.speedup > 1}">
                        {{ group.indexeddbTime.toFixed(0) }}ms
                      </td>
                      <td class="py-3" :class="{'text-green-400': group.speedup > 1, 'text-red-400': group.speedup < 1}">
                        {{ group.speedup.toFixed(1) }}x
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div v-else class="text-gray-500 text-center py-8">
                No metrics available yet. Run tests to see performance data.
              </div>
              
              <div class="mt-4 flex justify-end">
                <button 
                  @click="runPerformanceTests"
                  class="py-2 px-4 rounded bg-accent/10 hover:bg-accent/20 text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="isRunningTests"
                >
                  {{ isRunningTests ? 'Running Tests...' : 'Run Performance Tests' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Preview Modal -->
    <PreviewModal2
      v-if="showPreviewModal"
      :showModal="showPreviewModal"
      :columns="columns"
      :preview-data="previewData"
      :start-line="startLine"
      :column-options="LERG_COLUMN_ROLE_OPTIONS"
      :source="'LERG'"
      @update:mappings="handleMappingUpdate"
      @update:valid="isValid => (isModalValid = isValid)"
      @update:start-line="newStartLine => (startLine = newStartLine)"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import { useLergStore } from '@/stores/lerg-store';
  import { lergFacadeService, OperationStatus, ErrorSource, type ErrorInfo } from '@/services/lerg-facade.service';
  import { ChevronDownIcon, TrashIcon, ArrowUpTrayIcon, DocumentIcon } from '@heroicons/vue/24/outline';
  import { getCountryName } from '@/types/constants/country-codes';
  import { getStateName } from '@/types/constants/state-codes';
  import { LERG_COLUMN_ROLE_OPTIONS } from '@/types/domains/lerg-types';
  import PreviewModal2 from '@/components/shared/PreviewModal2.vue';
  import Papa from 'papaparse';
  import type { ParseResult } from 'papaparse';
  // Added imports for storage management functionality
  import { storageConfig, updateStorageConfig } from '@/config/storage-config';
  import { forceRefreshStrategies } from '@/services/storage/storage-factory';
  import { runPerformanceTest, type PerformanceMetric } from '@/services/storage/storage-test-utils';
  import { DBName } from '@/types/app-types';


  const store = useLergStore();
  const lergFileInput = ref<HTMLInputElement>();
  const lergStats = computed(() => store.stats);
  const expandedCountries = ref<string[]>([]);
  const showStateDetails = ref(false);
  const expandedStates = ref<string[]>([]);
  const expandedProvinces = ref<string[]>([]);
  const showCountryDetails = ref(false);
  const showLergSection = ref(false);
  const showLergDetails = ref(true);
  const showStorageSection = ref(false);

  const isLergLocallyStored = computed(() => {
    return store.$state.isLocallyStored;
  });

  // Define interfaces for status objects
  interface UploadStatus {
    type: 'success' | 'error' | 'warning';
    message: string;
    details?: string;
    source?: string;
  }

  interface DbStatus {
    connected: boolean;
    error: string;
    details: string;
    lastChecked: Date;
  }

  const isDragging = ref(false);
  const lergUploadStatus = ref<UploadStatus | null>(null);
  const isLergUploading = ref(false);
  const dbStatus = ref<DbStatus>({
    connected: false,
    error: '',
    details: '',
    lastChecked: new Date()
  });

  // Preview state
  const showPreviewModal = ref(false);
  const columns = ref<string[]>([]);
  const previewData = ref<string[][]>([]);
  const columnRoles = ref<string[]>([]);
  const startLine = ref(0);
  const isModalValid = ref(false);
  const columnMappings = ref<Record<string, string>>({});
  const selectedFile = ref<File | null>(null);

  // Added state for Storage Statistics and Performance Metrics
  interface MetricGroup {
    operation: string;
    recordCount: number;
    memoryTime: number;
    indexeddbTime: number;
    speedup: number;
  }

  // Component state for storage management
  const memoryUsage = ref(0);
  const memoryPercentage = ref(0);
  const updateInterval = ref<number | null>(null);
  const metrics = ref<PerformanceMetric[]>([]);
  const isRunningTests = ref(false);
  const showPerformanceSection = ref(false);

  // Computed properties for storage management
  const currentStrategy = computed(() => {
    // Force refresh from the storageConfig
    return storageConfig.storageType;
  });
  const autoFallback = computed({
    get: () => storageConfig.autoFallbackOnMemoryPressure,
    set: (value) => {
      updateStorageConfig({
        autoFallbackOnMemoryPressure: value
      });
    }
  });
  const memoryThreshold = computed(() => storageConfig.memoryThresholdMB);
  const updateIntervalSeconds = computed(() => 5);

  // Group metrics by operation and record count
  const groupedMetrics = computed(() => {
    const groups: Record<string, MetricGroup> = {};
    
    metrics.value.forEach(metric => {
      const key = `${metric.operation}_${metric.recordCount}`;
      
      if (!groups[key]) {
        groups[key] = {
          operation: metric.operation,
          recordCount: metric.recordCount,
          memoryTime: 0,
          indexeddbTime: 0,
          speedup: 0
        };
      }
      
      if (metric.strategy === 'memory') {
        groups[key].memoryTime = metric.durationMs;
      } else {
        groups[key].indexeddbTime = metric.durationMs;
      }
    });
    
    // Calculate speedup ratio
    Object.values(groups).forEach(group => {
      if (group.indexeddbTime > 0 && group.memoryTime > 0) {
        group.speedup = group.indexeddbTime / group.memoryTime;
      }
    });
    
    return Object.values(groups);
  });

  /**
   * Format error message based on error source and details
   */
  function formatErrorMessage(error: Error, source?: ErrorSource, details?: Record<string, any>): {
    message: string;
    details?: string;
    source?: string;
  } {
    let message = error.message || 'An unknown error occurred';
    let detailsMessage = '';
    let sourceLabel = '';
    
    // Add source-specific context
    if (source) {
      switch (source) {
        case ErrorSource.API:
          sourceLabel = 'API Error';
          message = `Server communication error: ${message}`;
          break;
        case ErrorSource.DATABASE:
          sourceLabel = 'Database Error';
          message = `Database error: ${message}`;
          break;
        case ErrorSource.NETWORK:
          sourceLabel = 'Network Error';
          message = `Network error: ${message}`;
          break;
        default:
          sourceLabel = 'System Error';
      }
    }
    
    // Add details if available
    if (details) {
      const detailsArray = [];
      
      if (details.errorType) {
        detailsArray.push(`Type: ${details.errorType}`);
      }
      
      if (details.errorMessage && details.errorMessage !== message) {
        detailsArray.push(`Details: ${details.errorMessage}`);
      }
      
      detailsMessage = detailsArray.join(' | ');
    }
    
    return {
      message,
      details: detailsMessage,
      source: sourceLabel
    };
  }

  async function checkConnection() {
    try {
      dbStatus.value.lastChecked = new Date();
      const result = await lergFacadeService.checkDataExists();
      dbStatus.value = {
        connected: result.onServer,
        error: '',
        details: '',
        lastChecked: new Date()
      };
    } catch (error) {
      console.error('Connection check failed:', error);
      
      // Get error details if available
      let errorInfo: Partial<ErrorInfo> | undefined;
      if (error && typeof error === 'object' && 'errorInfo' in error) {
        errorInfo = error.errorInfo as Partial<ErrorInfo>;
      }
      
      const formattedError = formatErrorMessage(
        error instanceof Error ? error : new Error('Connection failed'),
        errorInfo?.source,
        errorInfo?.details
      );
      
      dbStatus.value = {
        connected: false,
        error: formattedError.message,
        details: formattedError.details || '',
        lastChecked: new Date()
      };
    }
  }

  onMounted(async () => {
    await checkConnection();
    console.log('Checking LERG service status...');
    
    try {
      // First check if we already have LERG data in the store
      if (store.stats?.totalRecords > 0) {
        console.log('LERG data already loaded in store, skipping initialization');
        dbStatus.value = {
          connected: true,
          error: '',
          details: '',
          lastChecked: new Date()
        };
      } else {
        // Check if data exists before initializing
        const dataStatus = await lergFacadeService.checkDataExists();
        
        if (dataStatus.exists) {
          console.log(`LERG data already exists with ${dataStatus.stats.totalRecords} records`);
          
          // Initialize the service to load data
          const result = await lergFacadeService.initialize(false);
          
          if (result.status === OperationStatus.ERROR) {
            const error = result.error || new Error('Failed to initialize LERG data');
            const formattedError = formatErrorMessage(
              error,
              result.errorInfo?.source,
              result.errorInfo?.details
            );
            
            throw new Error(formattedError.message);
          }
        } else {
          console.log('No LERG data found, initializing with fresh data');
          const result = await lergFacadeService.initialize(true);
          
          if (result.status === OperationStatus.ERROR) {
            const error = result.error || new Error('Failed to initialize LERG data');
            const formattedError = formatErrorMessage(
              error,
              result.errorInfo?.source,
              result.errorInfo?.details
            );
            
            throw new Error(formattedError.message);
          }
        }
      }
      
      // Update connection status
      dbStatus.value = {
        connected: true,
        error: '',
        details: '',
        lastChecked: new Date()
      };
    } catch (error) {
      console.error('Failed to initialize LERG service:', error);
      
      // Get error details if available
      let errorInfo: Partial<ErrorInfo> | undefined;
      if (error && typeof error === 'object' && 'errorInfo' in error) {
        errorInfo = error.errorInfo as Partial<ErrorInfo>;
      }
      
      const formattedError = formatErrorMessage(
        error instanceof Error ? error : new Error('Initialization failed'),
        errorInfo?.source,
        errorInfo?.details
      );
      
      // Update UI to show error state
      dbStatus.value = {
        connected: false,
        error: formattedError.message,
        details: formattedError.details || '',
        lastChecked: new Date()
      };
      
      // Also show error in upload status for visibility
      lergUploadStatus.value = {
        type: 'error',
        message: 'LERG service initialization failed',
        details: formattedError.details,
        source: formattedError.source
      };
    }
    
    // Added initialization for storage monitoring
    updateMemoryUsage();
    
    // Setup periodic updates for memory usage
    updateInterval.value = window.setInterval(() => {
      updateMemoryUsage();
    }, updateIntervalSeconds.value * 1000);
    
    // Listen for storage strategy changes
    window.addEventListener('storage-strategy-changed', handleStorageStrategyChanged);
  });
  
  onUnmounted(() => {
    // Clear interval on component unmount
    if (updateInterval.value) {
      clearInterval(updateInterval.value);
    }
    
    // Remove event listeners
    window.removeEventListener('storage-strategy-changed', handleStorageStrategyChanged);
  });

  function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }

  function formatDate(date: string | null): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatTime(date: Date): string {
    if (!date) return 'Never';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Added methods for storage management
  function updateMemoryUsage() {
    if (!('performance' in window) || !('memory' in (performance as any))) {
      memoryUsage.value = 0;
      memoryPercentage.value = 0;
      return;
    }
    
    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      const usedJSHeapSize = memoryInfo.usedJSHeapSize;
      const jsHeapSizeLimit = memoryInfo.jsHeapSizeLimit;
      
      memoryUsage.value = usedJSHeapSize / (1024 * 1024);
      memoryPercentage.value = (usedJSHeapSize / jsHeapSizeLimit) * 100;
    }
  }

  function switchToMemory() {
    updateStorageConfig({
      storageType: 'memory',
      autoFallbackOnMemoryPressure: autoFallback.value
    });
    
    console.log('Switched to memory storage');
    
    // Force refresh all strategy instances to ensure they use the new storage type
    forceRefreshStrategies();
  }

  function switchToIndexedDB() {
    updateStorageConfig({
      storageType: 'indexeddb',
      autoFallbackOnMemoryPressure: autoFallback.value
    });
    
    console.log('Switched to IndexedDB storage');
    
    // Force refresh all strategy instances to ensure they use the new storage type
    forceRefreshStrategies();
  }

  function refreshStorageState() {
    updateMemoryUsage();
    
    // Force refresh all strategy instances to ensure configuration is applied
    forceRefreshStrategies();
    
    console.log('Storage state refreshed');
    console.log('Current strategy:', currentStrategy.value);
    console.log('Auto-fallback enabled:', autoFallback.value);
  }

  async function runPerformanceTests() {
    if (isRunningTests.value) return;
    
    isRunningTests.value = true;
    
    try {
      // Generate test data
      const generateTestData = (count: number) => {
        return Array.from({ length: count }, (_, i) => ({
          id: i,
          name: `Test ${i}`,
          value: Math.random() * 1000,
          timestamp: Date.now()
        }));
      };
      
      // Run tests for both AZ and US databases
      const azMetrics = await runPerformanceTest(
        DBName.AZ,
        generateTestData,
        [100, 1000, 5000]
      );
      
      metrics.value = azMetrics;
    } catch (error) {
      console.error('Error running performance tests', error);
    } finally {
      isRunningTests.value = false;
    }
  }
  
  // Toggle performance section visibility
  function togglePerformanceSection() {
    showPerformanceSection.value = !showPerformanceSection.value;
  }

  async function handleLergFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    selectedFile.value = file;

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results: ParseResult<string[]>) => {
        columns.value = results.data[0].map(h => h.trim());
        previewData.value = results.data
          .slice(0, 10)
          .map(row => (Array.isArray(row) ? row.map(cell => cell?.trim() || '') : []));
        startLine.value = 1;
        showPreviewModal.value = true;
      },
    });
  }

  async function handleModalConfirm(mappings: Record<string, string>) {
    console.log('Modal confirmed with mappings:', mappings);
    showPreviewModal.value = false;
    columnMappings.value = mappings;

    // Continue with file upload using mapped columns
    const file = selectedFile.value;
    console.log('File to upload:', file);
    if (!file) {
      lergUploadStatus.value = {
        type: 'error',
        message: 'No file selected for upload',
        details: 'Please select a file and try again'
      };
      return;
    }

    console.log('Upload parameters:', {
      mappings: columnMappings.value,
      startLine: startLine.value,
    });

    try {
      isLergUploading.value = true;
      lergUploadStatus.value = {
        type: 'warning',
        message: 'Uploading LERG file...',
        details: 'This may take a few minutes for large files'
      };
      
      // Use the facade service to upload the file with the mappings and startLine
      const result = await lergFacadeService.uploadFile(file, {
        mappings: columnMappings.value,
        startLine: startLine.value
      });
      
      isLergUploading.value = false; // Set to false before showing status
      
      if (result.status === OperationStatus.SUCCESS) {
        lergUploadStatus.value = { 
          type: 'success', 
          message: 'LERG file uploaded successfully',
          details: `Processed ${result.data?.count || 0} records${
            result.data?.totalRecords ? ` out of ${result.data.totalRecords} total records` : ''
          }`
        };
        
        // Clear the selected file after successful upload
        selectedFile.value = null;
        if (lergFileInput.value) {
          lergFileInput.value.value = '';
        }
      } else {
        const error = result.error || new Error('Upload failed');
        const formattedError = formatErrorMessage(
          error,
          result.errorInfo?.source,
          result.errorInfo?.details
        );
        
        throw new Error(formattedError.message);
      }
    } catch (error) {
      console.error('Failed to upload LERG file:', error);
      
      // Get error details if available
      let errorInfo: Partial<ErrorInfo> | undefined;
      if (error && typeof error === 'object' && 'errorInfo' in error) {
        errorInfo = error.errorInfo as Partial<ErrorInfo>;
      }
      
      const formattedError = formatErrorMessage(
        error instanceof Error ? error : new Error('Upload failed'),
        errorInfo?.source,
        errorInfo?.details
      );
      
      isLergUploading.value = false; // Set to false before showing error
      lergUploadStatus.value = {
        type: 'error',
        message: formattedError.message,
        details: formattedError.details,
        source: formattedError.source
      };
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    if (lergFileInput.value) {
      lergFileInput.value.value = '';
    }
    
    // Clear any previous upload status
    lergUploadStatus.value = null;
  }

  async function confirmClearLergData() {
    if (!confirm('Are you sure you want to clear all LERG codes? This action cannot be undone.')) {
      return;
    }

    try {
      isLergUploading.value = true;
      lergUploadStatus.value = {
        type: 'warning',
        message: 'Clearing LERG data...',
        details: 'This may take a moment'
      };
      
      // Use the facade service to clear all data
      const result = await lergFacadeService.clearAllData();
      
      isLergUploading.value = false;
      
      if (result.status === OperationStatus.SUCCESS) {
        lergUploadStatus.value = { 
          type: 'success', 
          message: 'LERG data cleared successfully' 
        };
        
        // Refresh connection status
        await checkConnection();
      } else {
        const error = result.error || new Error('Failed to clear LERG data');
        const formattedError = formatErrorMessage(
          error,
          result.errorInfo?.source,
          result.errorInfo?.details
        );
        
        throw new Error(formattedError.message);
      }
    } catch (error) {
      console.error('Failed to clear LERG data:', error);
      
      // Get error details if available
      let errorInfo: Partial<ErrorInfo> | undefined;
      if (error && typeof error === 'object' && 'errorInfo' in error) {
        errorInfo = error.errorInfo as Partial<ErrorInfo>;
      }
      
      const formattedError = formatErrorMessage(
        error instanceof Error ? error : new Error('Failed to clear data'),
        errorInfo?.source,
        errorInfo?.details
      );
      
      isLergUploading.value = false;
      lergUploadStatus.value = {
        type: 'error',
        message: formattedError.message,
        details: formattedError.details,
        source: formattedError.source
      };
    }
  }

  async function handleLergFileDrop(event: DragEvent) {
    event.preventDefault();
    isDragging.value = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      await handleLergFileChange({ target: { files: [file] } } as unknown as Event);
    }
  }

  function toggleExpandState(stateCode: string) {
    const index = expandedStates.value.indexOf(stateCode);
    if (index === -1) {
      expandedStates.value.push(stateCode);
    } else {
      expandedStates.value.splice(index, 1);
    }
  }

  function toggleStateDetails() {
    showStateDetails.value = !showStateDetails.value;
  }

  function toggleCountryDetails() {
    showCountryDetails.value = !showCountryDetails.value;
  }

  function toggleExpandCountry(countryCode: string) {
    const index = expandedCountries.value.indexOf(countryCode);
    if (index === -1) {
      expandedCountries.value.push(countryCode);
    } else {
      expandedCountries.value.splice(index, 1);
    }
  }

  function toggleExpandProvince(code: string) {
    const index = expandedProvinces.value.indexOf(code);
    if (index === -1) {
      expandedProvinces.value.push(code);
    } else {
      expandedProvinces.value.splice(index, 1);
    }
  }

  function toggleLergSection() {
    showLergSection.value = !showLergSection.value;
  }

  function toggleLergDetails() {
    showLergDetails.value = !showLergDetails.value;
  }

  function toggleStorageSection() {
    showStorageSection.value = !showStorageSection.value;
  }

  function handleMappingUpdate(newMappings: Record<string, string>) {
    columnMappings.value = newMappings;
  }

  // Add a watch to monitor autoFallback changes
  watch(autoFallback, (newVal, oldVal) => {
    console.log(`[AdminLergView] autoFallback changed: ${oldVal} -> ${newVal}`);
  }, { immediate: true });

  function handleStorageStrategyChanged(event: Event) {
    console.log('[AdminLergView] Storage strategy changed event received');
    
    // Force UI update
    updateMemoryUsage();
  }
</script>

<style>
@keyframes pulse-width {
  0% { width: 5%; }
  50% { width: 75%; }
  100% { width: 5%; }
}

.animate-pulse-width {
  animation: pulse-width 2s infinite ease-in-out;
}

.animate-status-pulse-success {
  animation: pulse 2s infinite;
  box-shadow: 0 0 12px rgba(76, 175, 80, 0.5);
}

.animate-status-pulse-error {
  animation: pulse 2s infinite;
  box-shadow: 0 0 12px rgba(244, 67, 54, 0.5);
}

@keyframes pulse {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}
</style>
