<template>
 <publication-card-details v-if="!pending" :publication="data" />
  
</template>

<script lang="ts" setup>

  const id = useRoute().params.id;
  const { data, pending } = await useFetch(`/api/publications/${id}`, {});    
  useHead({
    title: `Gup - Publication ${id}`,
  });   


</script>