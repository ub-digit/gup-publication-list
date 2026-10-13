<!-- <script setup lang="ts">
  import PublicationFilter from '~/components/PublicationFilter.vue'
//   import { usePublications } from '~/composables/usePublications'

  const searchTerm = ref('')

const { data: publications, pending, error, status } = usePublications()


  useHead({
    title: 'Gup - Publications',
  });
</script>
<template>
  <div>
    <h1>Filtrera publikationslistan</h1>

    <PublicationFilter v-model="searchTerm" />

    <div v-if="pending">Loading publications...</div>
    <div v-else-if="error">Error loading publications: {{ error.message }}</div>
    <div v-else>
      <publication-card
        v-for="publication in publications"
        :key="publication.id"
        :publication="publication"
      />
    </div>
  </div>
</template> -->

<script setup lang="ts">
import PublicationFilter from '~/components/PublicationFilter.vue'

// this object will grow with more filter fields
const filter = ref({
  searchTerm: '',
  // yearFrom: null,
  // yearTo: null,
  // authors: [],
  // organizations: [],
  // publicationTypes: [],
  // ...
})

const { data: publications, pending, error } = usePublications(filter)

useHead({
  title: 'Gup - Publications',
})
</script>

<template>
  <div>
    <h1>Filtrera publikationslistan</h1>

    <!-- the filter component updates the whole object -->
    <PublicationFilter v-model="filter" />

    <div v-if="pending">Loading publications...</div>
    <div v-else-if="error">
      Error loading publications: {{ error.message }}
    </div>
    <div v-else>
      <publication-card
        v-for="publication in publications"
        :key="publication.id"
        :publication="publication"
      />
    </div>
  </div>
</template>