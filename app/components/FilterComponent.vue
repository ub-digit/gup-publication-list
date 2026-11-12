<script setup>
import { reactive, ref, watch } from 'vue'


const currentYear = new Date().getFullYear()
const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i)

const form = reactive({ name: '' })
const persons = ref([])
const selectedPersons = ref([])
const ev = ref(null)
const selectedPerson = ref(null)
const isPersonListOpen = ref(false)

const filters = reactive({
  startYear: '',
  endYear: '',
  peerReviewedOnly: false,
  artisticOnly: false,
})

// async function submit() {
//   try {
//     const response = await $fetch('/api/persons/persons', {
//       method: 'POST',
//       body: form,
//     })
//     persons.value = response?.data ?? response ?? []
//   } catch (error) {
//     console.error('Failed to submit:', error)
//   }
// }

async function submit() {
  try {
    const response = await $fetch('/api/persons/persons', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: form,
    })
    persons.value = response?.data ?? response ?? []
    isPersonListOpen.value = persons.value.length > 0
  } catch (error) {
    console.error('Failed to submit:', error)
    isPersonListOpen.value = false
  }
}


watch(
  () => form.name,
  (newValue) => {
    if (newValue?.trim().length > 2) submit()
  }
)

watch(filters, () => {
  if (selectedPersons.value.length) searchPosts()
}, { deep: true })

async function searchPosts() {
  const gupPersonIds = getGupPersonIdsFromSelectedPersons(selectedPersons.value)
  if (!gupPersonIds.length) return

  try {
    const params = new URLSearchParams({
      gupPersonIds: gupPersonIds.join(','),
    })

    if (filters.startYear) params.set('pubyear_from', String(filters.startYear))
    if (filters.endYear) params.set('pubyear_to', String(filters.endYear))
    if (filters.peerReviewedOnly) params.set('peer_reviewed', 'true')
    if (filters.artisticOnly) params.set('artistic', 'true')

    const response = await $fetch(`/api/publications/search?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    const allAuthorIds = response.flatMap((publication) =>
      publication.authors.map((author) => author.person[0].id)
    )
    const matchingIds = gupPersonIds.filter((id) => allAuthorIds.includes(id))
    console.log('Matching IDs:', matchingIds)
  } catch (error) {
    console.error('Search failed:', error)
  }
}

function getGupPersonIdsFromSelectedPersons(list) {
  const ids = []
  for (const person of list) {
    for (const name of person.names ?? []) {
      if (name.gup_person_id) ids.push(name.gup_person_id)
    }
  }
  return ids
}

function removePerson(person) {
  selectedPersons.value = selectedPersons.value.filter((p) => p.id !== person.id)
}

function togglePerson(person) {
  const index = selectedPersons.value.findIndex((p) => p.id === person.id)
  if (index === -1) {
    selectedPersons.value.push(person)
    searchPosts()
  } else {
    selectedPersons.value.splice(index, 1)
  }
  isPersonListOpen.value = false


}
</script>
<style src="@vueform/multiselect/themes/default.css"></style>
<template>
  <form class="search-form" @submit.prevent="submit">
    <!-------------------------------------------->
    <div>
    <Multiselect
      v-model="value"
       mode="tags"
      :options="options"
      :multiple="true"
      :close-on-select="false"
      :clear-on-select="false"
      :preserve-search="true"
      placeholder="Search"
      label="names[0].first_name"
      track-by="id"

    />
  </div>

    <input v-model="form.name" class="filter-input" placeholder="Search" />

    <div id="selected_persons">
      <div v-for="p in selectedPersons" :key="p.id" class="selected-person">
        <span class="remove" title="Remove" @click="removePerson(p)">×</span>
        <span>{{ p.names?.[0]?.first_name }} {{ p.names?.[0]?.last_name }}</span>
      </div>
    </div>
      <ul v-if="isPersonListOpen" class="person-select-list">
        <li
          v-for="person in persons"
          :key="person.id"
          class="person-row"
          @click="togglePerson(person)"
        >
          <input
            type="checkbox"
            :id="String(person.id)"
            :checked="selectedPersons.some((p) => p.id === person.id)"
            @click.stop
            @change="togglePerson(person)"
          />
          <label :for="String(person.id)" @click.stop>
            {{ person.names?.[0]?.first_name }} {{ person.names?.[0]?.last_name }}
          </label>
        </li>
      </ul>

    <div class="filters">
      <label class="field">
        <span class="field-label">Startår</span>
        <select v-model="filters.startYear">
          <option value="">Startår</option>
          <option v-for="year in years" :key="'from-' + year" :value="year">
            {{ year }}
          </option>
        </select>
      </label>

      <label class="field">
        <span class="field-label">Slutår</span>
        <select v-model="filters.endYear">
          <option value="">Slutår</option>
          <option v-for="year in years" :key="'to-' + year" :value="year">
            {{ year }}
          </option>
        </select>
      </label>

      <div class="checks">
        <label class="check">
          Endast refereegranskade publikationer
          <input v-model="filters.peerReviewedOnly" type="checkbox" />
        </label>
        <label class="check">
          Endast konstnärligt arbete
          <input v-model="filters.artisticOnly" type="checkbox" />
        </label>
      </div>
    </div>

    <!-- <ul class="person-select-list">
      <li
        v-for="person in persons"
        :key="person.id"
        class="person-row"
        @click="togglePerson(person)"
      >
        <input
          type="checkbox"
          :id="String(person.id)"
          :checked="selectedPersons.some((p) => p.id === person.id)"
          @click.stop
          @change="togglePerson(person)"
        />
        <label :for="String(person.id)" @click.stop>
          {{ person.names?.[0]?.first_name }} {{ person.names?.[0]?.last_name }}
        </label>
      </li>
    </ul> -->
  </form>
</template>

<style scoped>
.search-form {
  font-family: Arial, Helvetica, sans-serif;
  color: #222;
}

.filter-input {
  width: 280px;
  padding: 8px 12px;
  border: 1px solid #cfcfcf;
  border-radius: 4px;
  margin-bottom: 16px;
}

#selected_persons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.selected-person {
  display: inline-flex;
  align-items: center;
  margin-bottom: 0;
  white-space: nowrap;
}

.remove {
  cursor: pointer;
  color: #2563eb;
  font-weight: bold;
  margin-right: 6px;
}

.filters {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 28px;
  margin: 16px 0 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 14px;
}

.field select {
  min-width: 180px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #cfcfcf;
  border-radius: 6px;
  background: #fff;
  color: #666;
}

.checks {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 6px;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.person-row {
  cursor: pointer;
  padding: 8px;

  margin-bottom: 8px;
}

.person-select-list {
  list-style: none;
  margin: 0;
  padding: 8px;
  border: 1px solid #cfcfcf;
  border-radius: 6px;
}

.person-row {
  cursor: pointer;
  padding: 8px;
  margin: 0;
}
</style>


<script>
  import Multiselect from '@vueform/multiselect'

  export default {
    components: {
      Multiselect,
    },
    data() {
      return {
        value: null,
        options: [
          'Batman',
          'Robin',
          'Joker',
        ]
      }
    }
  }

 
</script>