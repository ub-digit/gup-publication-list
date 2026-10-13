<template>
  <div class="publication">
    <h1>{{ publication.title }}</h1>

    <div class="publication-type">
      {{ publication.publication_type_label }}

      <span v-if="publication.artistic_basis">
        (Inom konstnärligt arbete)
      </span>
    </div>

    <!-- Authors -->
    <div v-if="authors.length" class="meta-row">
      <div class="label">Författare</div>

      <div class="value">
        <div
          v-for="author in authors"
          :key="author.person.id"
          class="author"
        >
          <span class="author-name">
            {{ author.person.first_name }}
            {{ author.person.last_name }}
          </span>

          <span
            v-for="affiliation in author.affiliations"
            :key="affiliation.department_id"
            class="affiliation"
          >
            {{ affiliation.name_sv }}
          </span>
        </div>
      </div>
    </div>

    <!-- Publication year -->
    <div v-if="publication.pubyear" class="meta-row">
      <div class="label">Publikationsår</div>

      <div class="value">
        {{ publication.pubyear }}
      </div>
    </div>

    <!-- Published in -->
    <div v-if="publishedIn" class="meta-row">
      <div class="label">Publicerad i</div>

      <div class="value">
        {{ publishedIn }}
      </div>
    </div>

    <!-- Abstract -->
    <div v-if="publication.abstract" class="meta-row">
      <div class="label">Sammanfattning</div>

      <div class="value abstract">
        {{ publication.abstract }}
      </div>
    </div>

    <!-- Links -->
    <div v-if="publication.publication_links?.length" class="meta-row">
      <div class="label">Länkar</div>

      <div class="value">
        <div
          v-for="link in publication.publication_links"
          :key="link.url"
          class="publication-link"
        >
          <a
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ link.url }}
          </a>

          <span v-if="link.is_oa" class="open-access">
            ↗
          </span>
        </div>
      </div>
    </div>

    <!-- ISSN -->
    <div v-if="publication.issn" class="meta-row">
      <div class="label">ISSN</div>

      <div class="value">
        {{ publication.issn }}
      </div>
    </div>

    <!-- E-ISSN -->
    <div v-if="publication.eissn" class="meta-row">
      <div class="label">E-ISSN</div>

      <div class="value">
        {{ publication.eissn }}
      </div>
    </div>

    <!-- Categories -->
    <div v-if="categories.length" class="meta-row">
      <div class="label">Ämnesord</div>

      <div class="value">
        <div
          v-for="category in categories"
          :key="category.category_id"
        >
          {{ category.name_sv }}
        </div>
      </div>
    </div>

    <!-- Keywords -->
    <div v-if="publication.keywords" class="meta-row">
      <div class="label">Nyckelord</div>

      <div class="value">
        {{ publication.keywords }}
      </div>
    </div>

    <!-- Language -->
    <div v-if="languageLabel" class="meta-row">
      <div class="label">Språk</div>

      <div class="value">
        {{ languageLabel }}
      </div>
    </div>

    <!-- Project -->
    <div v-if="project" class="meta-row">
      <div class="label">Projekt</div>

      <div class="value">
        {{ project }}
      </div>
    </div>

    <!-- Publisher -->
    <div v-if="publication.publisher" class="meta-row">
      <div class="label">Förlag</div>

      <div class="value">
        {{ publication.publisher }}
      </div>
    </div>

    <!-- Additional information -->
    <div v-if="additionalInformation" class="meta-row">
      <div class="label">Ytterligare information</div>

      <div class="value">
        {{ additionalInformation }}
      </div>
    </div>

    <!-- Publication ID -->
    <div class="meta-row">
      <div class="label">Publikations-ID</div>

      <div class="value">
        {{ publication.publication_id }}
      </div>
    </div>

    <!-- Identifiers -->
    <div
      v-if="publication.publication_identifiers?.length"
      class="meta-row"
    >
      <div class="label">Identifikatorer</div>

      <div class="value">
        <div
          v-for="identifier in publication.publication_identifiers"
          :key="identifier.identifier_code"
        >
          <template v-if="identifier.identifier_code === 'pubmed'">
            Pubmed-ID:
            <a
              :href="`https://www.ncbi.nlm.nih.gov/pubmed/${identifier.identifier_value}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.ncbi.nlm.nih.gov/pubmed/{{ identifier.identifier_value }}
            </a>
          </template>

          <template v-else-if="identifier.identifier_code === 'doi'">
            DOI:
            <a
              :href="`https://doi.org/${identifier.identifier_value}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://doi.org/{{ identifier.identifier_value }}
            </a>
          </template>

          <template v-else-if="identifier.identifier_code === 'isi-id'">
            ISI-ID: {{ identifier.identifier_value }}
          </template>

          <template v-else-if="identifier.identifier_code === 'scopus-id'">
            Scopus-ID: {{ identifier.identifier_value }}
          </template>

          <template v-else>
            {{ identifier.identifier_code }}:
            {{ identifier.identifier_value }}
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Publication } from '~/shared/types/publication'

const props = defineProps<{
  publication: Publication
}>()

/*
 * Authors must be displayed according to their position,
 * not according to the order Elasticsearch happens to return them.
 */
const authors = computed(() =>
  [...(props.publication.authors ?? [])]
    .sort(
      (a, b) =>
        (a.position?.[0]?.position ?? 999999) -
        (b.position?.[0]?.position ?? 999999)
    )
    .filter(author => author.person?.[0])
    .map(author => ({
      person: author.person[0],
      affiliations: author.affiliations ?? []
    }))
)

/*
 * Build:
 *
 * Neonatology, 121 (5), 608 - 615
 *
 * while allowing any of the individual fields to be missing.
 */
const publishedIn = computed(() => {
  const result: string[] = []

  if (props.publication.sourcetitle) {
    result.push(props.publication.sourcetitle)
  }

  if (props.publication.sourcevolume) {
    let volume = props.publication.sourcevolume

    if (props.publication.sourceissue) {
      volume += ` (${props.publication.sourceissue})`
    }

    result.push(volume)
  }

  if (props.publication.sourcepages) {
    result.push(props.publication.sourcepages)
  }

  return result.join(', ')
})

/*
 * Temporary category data.
 *
 * The publication index only gives us:
 *
 *   Oftalmologi
 *
 * while the production UI displays:
 *
 *   Medicin och hälsovetenskap | Klinisk medicin | Oftalmologi
 *
 * The parent hierarchy will presumably be loaded from another source.
 */
const categories = computed(() => props.publication.categories ?? [])

// TODO: Load category hierarchy from the appropriate index/API.
//
// const categoryHierarchy = await $fetch(...)
// const categories = computed(() => buildCategoryHierarchy(...))

/*
 * Temporary project data.
 *
 * The project is not part of the publication document.
 */
const project = ref<string | null>(null)

// TODO: Load project from the appropriate index/API.
//
// const projectData = await $fetch(...)
// project.value = projectData...

/*
 * Temporary additional information.
 *
 * This is also not part of the publication document.
 */
const additionalInformation = ref<string | null>(null)

// TODO: Load additional information from the appropriate index/API.
//
// const additionalInformationData = await $fetch(...)
// additionalInformation.value = additionalInformationData...

const languageLabel = computed(() => {
  const languages: Record<string, string> = {
    en: 'Engelska',
    sv: 'Svenska',
    da: 'Danska',
    no: 'Norska',
    fi: 'Finska',
    de: 'Tyska',
    fr: 'Franska',
    es: 'Spanska'
  }

  return languages[props.publication.publanguage]
    ?? props.publication.publanguage
})
</script>

<style scoped>
.publication {
  max-width: 1000px;
  padding: 20px 0 40px;

  font-family: Arial, Helvetica, sans-serif;
  color: #222;
}

h1 {
  margin: 0 0 8px;

  font-size: 30px;
  font-weight: 400;
  line-height: 1.25;
}

.publication-type {
  margin-bottom: 24px;

  font-size: 18px;
  line-height: 1.4;
}

.meta-row {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);

  column-gap: 20px;

  margin-bottom: 12px;

  font-size: 15px;
  line-height: 1.45;
}

.label {
  font-weight: 700;
  text-align: right;
}

.value {
  min-width: 0;
}

.author {
  margin-bottom: 7px;
}

.author-name {
  margin-right: 8px;
}

.affiliation {
  display: inline-block;

  margin-right: 6px;
  padding: 2px 6px;

  background: #777;
  color: #fff;

  border-radius: 2px;

  font-size: 12px;
  font-weight: 700;
}

.abstract {
  max-width: 760px;
  white-space: pre-line;
}

.publication-link {
  margin-bottom: 3px;
}

.open-access {
  margin-left: 3px;
  color: #d66a00;
}

a {
  color: #0066b3;
  text-decoration: none;
  overflow-wrap: anywhere;
}

a:hover {
  text-decoration: underline;
}

@media (max-width: 700px) {
  .meta-row {
    grid-template-columns: 1fr;
    row-gap: 3px;
  }

  .label {
    text-align: left;
  }

  h1 {
    font-size: 25px;
  }

  .publication-type {
    font-size: 16px;
  }
}
</style>
