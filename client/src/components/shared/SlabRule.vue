<template>
  <hr :class="ruleClass" />
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  const props = withDefaults(
    defineProps<{
      /** Rule weight: 1px (in-section), 2px (masthead frame), 3px (page/footer top). */
      size?: 1 | 2 | 3;
    }>(),
    { size: 1 }
  );

  const ruleClass = computed(() =>
    props.size === 2 ? 'slab-rule-2' : props.size === 3 ? 'slab-rule-3' : 'slab-rule'
  );
</script>
