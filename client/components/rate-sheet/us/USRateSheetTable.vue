  <p v-else class="text-lg font-semibold text-white font-mono">
    {{ formatRate(currentDisplayAverages.indeterm) }}
  </p>
</div>
</div>
// ... existing code ...
      <th scope="col" class="px-6 py-3 text-right">Intra</th>
      <th scope="col" class="px-6 py-3 text-right">Indeterm</th>
      <th scope="col" class="px-6 py-3">Effective</th>
    </tr>
// ... existing code ...
          <td class="px-6 py-4 font-mono text-right text-gray-300">
            {{ formatRate(entry.indetermRate) }}
          </td>
          <td class="px-6 py-4 text-gray-400">
            {{ entry.effectiveDate ?? 'N/A' }}
          </td>
 