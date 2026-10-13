<script setup lang="ts">
import PublicationFilter from '~/components/PublicationFilter.vue'

// this object will grow with more filter fields
const filter = ref({
  searchTerm: '',
  // yearFrom: null,
  // yearTo: null,
  authors: [],
  // organizations: [],
  // publicationTypes: [],
  // ...
})

const { data: publicationsData, pending, error } = usePublications(filter)

// Extract publications and range from the response
const publications = computed(() => publicationsData.value?.publications || [])
const range = computed(() => publicationsData.value?.range || null)
const total = computed(() => publicationsData.value?.total ?? 0)

useHead({
  title: 'Gup - Publications',
  htmlAttrs: {
    lang: 'sv'
  },
  link: [
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com'
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossorigin: true
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap'
    }
  ]
})
</script>

<template>
  <div>
    <h1>Filtrera publikationer</h1>

    <!-- the filter component updates the whole object -->
    <PublicationFilter v-model="filter" :year-range="range" />

    <div v-if="pending">Loading publications...</div>
    <div v-else-if="error">
      Error loading publications: {{ error.message }}
    </div>
    <div v-else>
      <!-- Display range information if available -->
      <div v-if="range" class="range-info">
        <p>Publication range: {{ range.minYear }} - {{ range.maxYear }} Total: {{ total }}</p>
      </div>
      
      <publication-card
        v-for="publication in publications"
        :key="publication.id"
        :publication="publication"
      />
    </div>
  </div>
</template>

<style scoped>
.range-info {
  background-color: #f0f8ff;
  border: 1px solid #b0e0e6;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 20px;
  font-family: 'Open Sans', sans-serif;
}

.range-info p {
  margin: 0;
  font-weight: 500;
}
</style>