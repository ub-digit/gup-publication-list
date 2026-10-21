<script setup lang="ts">
import PublicationFilter from '~/components/PublicationFilter.vue'
import type { Filter } from '#shared/types/filter'
import type { Person } from '#shared/types/person'

const route = useRoute()
const router = useRouter()

const queryValue = (value: string | string[] | null | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value ?? undefined

const queryValues = (value: string | string[] | null | undefined): string[] =>
  (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean)

const numberValues = (value: string | string[] | null | undefined): number[] =>
  queryValues(value).map(Number).filter(Number.isFinite)

const numberValue = (value: string | string[] | null | undefined): number | null => {
  const parsed = Number(queryValue(value))
  return Number.isFinite(parsed) ? parsed : null
}

const pageFromQuery = (query: typeof route.query): number => {
  const page = numberValue(query.page)
  return page && page >= 1 ? Math.floor(page) : 1
}

const values = <T>(value: T | T[] | null | undefined): T[] =>
  Array.isArray(value) ? value : value == null ? [] : [value]

const sameIds = (left: number[], right: number[]) => {
  if (left.length !== right.length) return false

  const sortedLeft = [...left].sort((a, b) => a - b)
  const sortedRight = [...right].sort((a, b) => a - b)
  return sortedLeft.every((id, index) => id === sortedRight[index])
}

const filterFromQuery = (query: typeof route.query, selectedPersons: Person[] = []): Filter => {
  const sortBy = queryValue(query.sortBy)
  const gupPersonIds = numberValues(query.gupPersonIds)
  const selectedPersonGupIds = selectedPersons.flatMap(person => person.gupPersonIds || [])
  const shouldPreserveSelectedPersons = sameIds(selectedPersonGupIds, gupPersonIds)

  return {
    searchTerm: queryValue(query.searchTerm) ?? '',
    selectedPersons: shouldPreserveSelectedPersons ? selectedPersons : [],
    startYear: numberValue(query.startYear),
    endYear: numberValue(query.endYear),
    publicationTypeIds: numberValues(query.publicationTypeIds),
    institutionIds: queryValues(query.institutionIds),
    facultyId: numberValue(query.facultyId),
    seriesIds: numberValues(query.seriesIds),
    projectIds: numberValues(query.projectIds),
    gupPersonIds,
    peerReviewed: queryValue(query.peerReviewed) === 'true',
    isOa: queryValue(query.isOa) === 'true',
    artisticWorkOnly: queryValue(query.artisticWorkOnly) === 'true',
    sortBy: sortBy === 'title' || sortBy === 'publication_type_id' ? sortBy : 'year'
  }
}

const filterToQuery = (value: Filter) => {
  const publicationTypeIds = values(value.publicationTypeIds).map(String)
  const institutionIds = values(value.institutionIds)
  const seriesIds = values(value.seriesIds).map(String)
  const projectIds = values(value.projectIds).map(String)
  const gupPersonIds = values(value.gupPersonIds).map(String)

  return {
    ...(value.searchTerm ? { searchTerm: value.searchTerm } : {}),
    ...(value.startYear ? { startYear: String(value.startYear) } : {}),
    ...(value.endYear ? { endYear: String(value.endYear) } : {}),
    ...(publicationTypeIds.length ? { publicationTypeIds } : {}),
    ...(institutionIds.length ? { institutionIds } : {}),
    ...(value.facultyId ? { facultyId: String(value.facultyId) } : {}),
    ...(seriesIds.length ? { seriesIds } : {}),
    ...(projectIds.length ? { projectIds } : {}),
    ...(gupPersonIds.length ? { gupPersonIds } : {}),
    ...(value.peerReviewed ? { peerReviewed: 'true' } : {}),
    ...(value.isOa ? { isOa: 'true' } : {}),
    ...(value.artisticWorkOnly ? { artisticWorkOnly: 'true' } : {}),
    ...(value.sortBy && value.sortBy !== 'year' ? { sortBy: value.sortBy } : {})
  }
}

const filter = ref<Filter>(filterFromQuery(route.query))
const currentPage = ref(pageFromQuery(route.query))
const pageSize = 20
let applyingRoute = false

watch(() => route.query, (query) => {
  applyingRoute = true
  const nextFilter = filterFromQuery(query, filter.value.selectedPersons)
  if (JSON.stringify(nextFilter) !== JSON.stringify(filter.value)) {
    filter.value = nextFilter
  }
  currentPage.value = pageFromQuery(query)
  void nextTick(() => {
    applyingRoute = false
  })
})

watch(filter, () => {
  if (!applyingRoute) {
    currentPage.value = 1
  }
}, { deep: true })

watch([filter, currentPage], ([value, page]) => {
  if (applyingRoute) return

  const query = {
    ...filterToQuery(value),
    ...(page > 1 ? { page: String(page) } : {})
  }
  if (JSON.stringify(query) !== JSON.stringify(route.query)) {
    void router.replace({ query })
  }
}, { deep: true })

const searchRequest = computed(() => ({
  ...filter.value,
  page: currentPage.value,
  pageSize
}))

const { data: publicationsData, pending, error } = usePublications(searchRequest)

// Extract publications and range from the response
const publications = computed(() => publicationsData.value?.publications || [])
const range = computed(() => publicationsData.value?.range || null)
const total = computed(() => publicationsData.value?.total ?? 0)
const totalPages = computed(() => publicationsData.value?.totalPages ?? 0)

watch(totalPages, (pages) => {
  if (pages > 0 && currentPage.value > pages) {
    currentPage.value = pages
  }
})

const pageNumbers = computed(() => {
  const firstPage = Math.floor((currentPage.value - 1) / 10) * 10 + 1
  const lastPage = Math.min(firstPage + 9, totalPages.value)
  return Array.from({ length: Math.max(0, lastPage - firstPage + 1) }, (_, index) => firstPage + index)
})

const setPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

useHead({
  title: 'Gup - Publications',
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
    <h1>{{ $t('results.title') }}</h1>

    <!-- the filter component updates the whole object -->
    <PublicationFilter v-model="filter" :year-range="range" />

    <div v-if="pending">{{ $t('results.loading') }}</div>
    <div v-else-if="error">
      {{ $t('results.loadError', { message: error.message }) }}
    </div>
    <div v-else>
      <!-- Display range information if available -->
      <div v-if="range" class="range-info">
        <p>{{ $t('results.range', { minYear: range.minYear, maxYear: range.maxYear, total }) }}</p>
      </div>
      
      <publication-card
        v-for="publication in publications"
        :key="publication.id"
        :publication="publication"
      />

      <nav v-if="totalPages > 1" class="pagination" :aria-label="$t('results.pagination')">
        <button
          type="button"
          class="pagination-button pagination-previous"
          :disabled="currentPage === 1"
          @click="setPage(currentPage - 1)"
        >
          {{ $t('results.previous') }}
        </button>
        <button
          v-for="page in pageNumbers"
          :key="page"
          type="button"
          class="pagination-button"
          :class="{ active: page === currentPage }"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="setPage(page)"
        >
          {{ page }}
        </button>
        <button
          type="button"
          class="pagination-button pagination-next"
          :disabled="currentPage === totalPages"
          @click="setPage(currentPage + 1)"
        >
          {{ $t('results.next') }}
        </button>
      </nav>
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

.pagination {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.pagination-button {
  min-width: 34px;
  height: 34px;
  margin-left: -1px;
  padding: 0 12px;
  color: #0067b1;
  background: #fff;
  border: 1px solid #ddd;
  font: inherit;
  cursor: pointer;
}

.pagination-button:first-child {
  margin-left: 0;
  border-radius: 5px 0 0 5px;
}

.pagination-button:last-child {
  border-radius: 0 5px 5px 0;
}

.pagination-button:hover:not(:disabled):not(.active) {
  background: #f5f5f5;
}

.pagination-button.active {
  position: relative;
  z-index: 1;
  color: #fff;
  background: #0067b1;
  border-color: #0067b1;
}

.pagination-button:disabled {
  color: #999;
  cursor: not-allowed;
}
</style>
