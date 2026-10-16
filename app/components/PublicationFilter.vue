<script setup lang="ts">
import type { Person } from '#shared/types/person'
import type { Filter } from '#shared/types/filter'
import Multiselect from '@vueform/multiselect'


// Parent owns the filter object via v-model
const filters = defineModel<Filter>({ required: true })

const sortOptions = [
  { label: 'År', value: 'year' },
  { label: 'Titel', value: 'title' },
  { label: 'Publikationstyp', value: 'publication_type_id' }
]

// Props to receive the actual year range from the parent
const props = defineProps<{
  yearRange?: { minYear: number; maxYear: number }
}>()



onMounted(async () => {
  if (!filters.value.sortBy) {
    filters.value.sortBy = 'year'
  }

  await Promise.all([
    loadInstitutions(),
    loadPublicationTypes()
  ])
})


// --- Load helpers -------------------------------------------------


const loadPersons = async (query: string): Promise<Person[]> => {
  if (!query || query.length < 3) return []


  try {
    const response = await $fetch('/api/persons/persons', {
      method: 'POST',
      body: { name: query },
    })


    const raw = response?.data ?? response ?? []


    const persons = raw.map((p: Person) => ({
      //id: p.id,
      //names: p.names,
      label: getPrimaryFullName(p.names),
      value: getGupPersonIds(p.names), // single value for Multiselect
    }))

    // alert('Loaded persons: ' + JSON.stringify(persons))


    // Store loaded persons for later lookup
    loadedPersons.value = persons
    return persons
  } catch (error) {
    console.error('Failed to load persons:', error)
    return []
  }
}


const getGupPersonIds = (names: { gup_person_id: number }[]): number[] => {
  return names.map(n => n.gup_person_id).filter(Boolean)
}


const getPrimaryFullName = (names: { primary: boolean; full_name: string }[]): string => {
  const primary = names.find(n => n.primary)
  return primary?.full_name ?? 'Unknown'
}


const loadFaculties = async (): Promise<{ label: string; value: string }[]> => {
  try {
    const response = await $fetch('/api/publications/faculty', {
      method: 'GET',
    })

    return response || []
  } catch (error) {
    console.error('Failed to load faculties:', error)
    return []
  }
}


const loadSeries = async (): Promise<{ label: string; value: number }[]> => {
  try {
    const response = await $fetch('/api/publications/series', {
      method: 'GET',
    })

    return response || []
  } catch (error) {
    console.error('Failed to load series:', error)
    return []
  }
}


const loadPublicationTypes = async (): Promise<{ label: string; value: number }[]> => {
  try {
    const response = await $fetch('/api/publications/publicationtype', {
      method: 'GET',
    })

    return response || []
  } catch (error) {
    console.error('Failed to load publication types:', error)
    return []
  }
}


const loadProjects = async (): Promise<{ label: string; value: number }[]> => {
  try {
    const response = await $fetch('/api/publications/projects', {
      method: 'GET',
    })

    return response || []
  } catch (error) {
    console.error('Failed to load projects:', error)
    return []
  }
}


const loadInstitutions = async () => {
  try {
    const response = await $fetch('/api/publications/institutions', {
      method: 'GET',
      params: {
        parentId: filters.value.facultyId || undefined
      }
    })

    institutions.value = response || []
  } catch (error) {
    console.error('Failed to load institutions:', error)
    institutions.value = []
  }
}


// Year options - use actual range from server or default to 1900-2026
const yearOptions = computed(() => {
  // If yearRange is provided and valid, use it
  if (props.yearRange && props.yearRange.minYear && props.yearRange.maxYear) {
    const minYear = props.yearRange.minYear
    const maxYear = props.yearRange.maxYear
    const years: number[] = []
    for (let y = maxYear; y >= minYear; y--) years.push(y)
    return years
  }
  // Fallback to default range if no range provided
  const minYear = 1900
  const maxYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = maxYear; y >= minYear; y--) years.push(y)
  return years
})

// Dynamic year options based on selected values
const startYearOptions = computed(() => {
  if (!filters.value.endYear) return yearOptions.value
  return yearOptions.value.filter(year => year <= filters.value.endYear)
})

const endYearOptions = computed(() => {
  if (!filters.value.startYear) return yearOptions.value
  return yearOptions.value.filter(year => year >= filters.value.startYear)
})


// Keep track of loaded persons for gupPersonIds lookup
const loadedPersons = ref<Person[]>([])



// Keep gupPersonIds in sync with selectedPersons
watch(
  () => filters.value.selectedPersons,
  (persons) => {
    // Find the loaded persons that match the selected IDs and extract their gupPersonIds
    const selectedGupPersonIds: number[] = []
    persons.forEach(person => {
      const loadedPerson = loadedPersons.value.find(p => p.id === person.id)
      if (loadedPerson && loadedPerson.gupPersonIds) {
        selectedGupPersonIds.push(...loadedPerson.gupPersonIds)
      }
    })
    filters.value.gupPersonIds = selectedGupPersonIds.filter(Boolean)
  },
  { deep: true }
)

// Watch for changes in startYear and endYear to maintain proper filtering
watch(
  () => filters.value.startYear,
  (newStartYear) => {
    if (newStartYear && filters.value.endYear && newStartYear > filters.value.endYear) {
      filters.value.endYear = null as any
    }
  }
)

watch(
  () => filters.value.endYear,
  (newEndYear) => {
    if (newEndYear && filters.value.startYear && newEndYear < filters.value.startYear) {
      filters.value.startYear = null as any
    }
  }
)

const institutions = ref<{ label: string; value: string }[]>([])

watch(
  () => filters.value.facultyId,
  async () => {
    await loadInstitutions()
  },
  { deep: true }
)

// Filter function to only allow numeric input
const numericInputFilter = (input: string): boolean => {
  return /^\d*$/.test(input)
}
</script>


<style src="@vueform/multiselect/themes/default.css"></style>


<style scoped>
.filters-form {
  max-width: 900px;
}

.filters-title {
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 1.5rem;
  color: #333;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem 2rem;
  margin-bottom: 1.25rem;
  align-items: flex-start;
}

.year-group {
  display: flex;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  min-width: 160px;
}

.field label {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: #333;
}

.field .multiselect {
  min-width: 160px;
}

.checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-top: 1.6rem; /* aligns with the dropdowns under the labels */
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}

.author-field,
.pubtype-field {
  flex: 1;
  min-width: 220px;
}
</style>


<template>
  <form class="filters-form" @submit.prevent>
    <h2 class="filters-title">Filtrera publikationslistan</h2>

    <!-- Row 1: Startår + Slutår + checkboxes -->
    <div class="filters-row">
      <div class="year-group">
        <div class="field">
          <label for="start-year">Startår</label>
          <Multiselect
            id="start-year"
            v-model="filters.startYear"
            :options="startYearOptions"
            placeholder="Startår"
            :can-clear="true"
            :searchable="true"
            :create-option="true"
            :filter-results="false"
            :input-filter="numericInputFilter"
          />
        </div>

        <div class="field">
          <label for="end-year">Slutår</label>
          <Multiselect
            id="end-year"
            v-model="filters.endYear"
            :options="endYearOptions"
            placeholder="Slutår"
            :can-clear="true"
            :searchable="true"
            :create-option="true"
            :filter-results="false"
            :input-filter="numericInputFilter"
          />
        </div>
      </div>

      <div class="checkboxes">
        <label class="checkbox-label">
          <input type="checkbox" v-model="filters.peerReviewed" id="peer-reviewed" />
          Endast refereegranskade publikationer
        </label>
         <label class="checkbox-label">
          <input type="checkbox" v-model="filters.artisticWorkOnly" id="is-oa" />
          Endast konstnärligt arbete
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="filters.isOa" id="is-oa" />
          Open access
        </label>
      </div>
    </div>

    <!-- Row 2: Författare + Publikationstyp -->
    <div class="filters-row">
      <div class="field author-field">
        <label>Författare</label>
        <Multiselect
          v-model="filters.selectedPersons"
          mode="tags"
          placeholder="Författare"
          :filter-results="false"
          :min-chars="3"
          :resolve-on-load="false"
          :delay="300"
          :searchable="true"
          :clear-on-select="true"
          :options="loadPersons"
          label="label"
        />
      </div>

      <div class="field pubtype-field">
        <label for="publication-type">Publikationstyp</label>
        <Multiselect
          id="publication-type"
          v-model="filters.publicationTypeIds"
          :options="loadPublicationTypes"
          placeholder="Publikationstyp"
          :can-clear="true"
          :searchable="true"
        />
      </div>
    </div>

    <div class="filters-row">
       <div class="field pubtype-field">
        <label for="faculty">Fakultet</label>
        <Multiselect
          id="faculty"
          v-model="filters.facultyId"
          :options="loadFaculties"
          placeholder="Fakultet"
          :can-clear="true"
          :searchable="true"
          :clear-on-select="true"
        />
      </div>
      
       <div class="field author-field">
        <label for="series">Serie (Gu)</label>
        <Multiselect
          id="series"
          v-model="filters.seriesIds"
          :options="loadSeries"
          placeholder="Serie (Gu)"
          :can-clear="true"
          :searchable="true"
        />
      </div>
    </div>

    <div class="filters-row">
     <div class="field author-field">
        <label for="institution">Institution</label>
        <Multiselect
          id="institution"
          v-model="filters.institutionIds"
          :options="institutions"
          placeholder="Institution"
          :can-clear="true"
          :searchable="true"
        />
      </div>

      <div class="field pubtype-field">
        <label for="project">Projekt (EU-finansierat)</label>
        <Multiselect
          id="project"
          v-model="filters.projectIds"
          :options="loadProjects"
          placeholder="Projekt (EU-finansierat)"
          :can-clear="true"
          :searchable="true"
          :clear-on-select="true"
        />
      </div>
    </div>

    <div class="filters-row">
      <div class="field">
        <label for="sort-by">Sortessra</label>
        <Multiselect
          id="sort-by"
          v-model="filters.sortBy"
          :options="sortOptions"
          :searchable="false"
          :allow-empty="false"
          :can-clear="false" 
        />
      </div>
    </div>
  </form>
</template>
