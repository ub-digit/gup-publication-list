<template>
  <div class="publication-item">
    <NuxtLink :to="`/publication/${stripIdFromGup(publication.id)}`" class="publication-link">
      <h2>{{ publication.title }}</h2>
    </NuxtLink>

    <p class="meta-row">
      <span class="label">{{ $t('publication.authors') }}:</span>
      {{ authorNames }}
    </p>

    <p v-if="publication.publication_type_label" class="meta-row">
      <span class="label">{{ $t('publication.publicationType') }}:</span>
      {{ publication.publication_type_label }}
    </p>

    <p v-if="publication.pubyear" class="meta-row">
      <span class="label">{{ $t('publication.publicationYear') }}:</span>
      {{ publication.pubyear }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  publication: {
    id: string
    title: string
    authors: Array<{
      person: Array<{ id: string; first_name: string; last_name: string }>
    }>
    publication_type_label?: string
    pubyear?: string | number
  }
}>()

const stripIdFromGup = (gupId: string) => gupId.replace(/^gup_/, '')

const authorNames = computed(() =>
  props.publication.authors
    .map((a) => a.person[0] ? `${a.person[0].first_name} ${a.person[0].last_name}` : '')
    .filter(Boolean)
    .join(', ')
)
</script>

<style scoped>
.publication-item {
  font-family: Arial, Helvetica, sans-serif;
  color: #222;
  padding: 8px 0 16px;
  border-bottom: 1px solid #d0d0d0;
  max-width: 900px;
}

.publication-link {
  text-decoration: none;
}

.publication-link h2 {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.3;
  color: #2b6cb0;
}

.publication-link:hover h2 {
  text-decoration: underline;
}

.meta-row {
  margin: 0 0 6px;
  font-size: 15px;
  line-height: 1.45;
}

.label {
  font-weight: 700;
  margin-right: 4px;
}

.publication-item { min-width: 0; overflow-wrap: anywhere; }
@media (max-width: 767px) {
  .publication-link h2 { font-size: 20px; }
}
</style>
