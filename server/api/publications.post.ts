import { resolvePublicationFilter } from '../utils/publicationFilter'
import { buildPublicationQuery } from '../utils/publicationQuery'

// server/api/publications.post.ts
export default defineEventHandler(async (event) => {

  const filter = await readBody(event) || {}

  // Elasticsearch pagination is zero-based (`from`), while the API accepts a
  // one-based page number. Keep the page size bounded to avoid an expensive
  // request caused by an invalid client value.
  const toPositiveInteger = (value: unknown, fallback: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback
  }
  const page = toPositiveInteger(filter.page, 1)
  const pageSize = Math.min(100, toPositiveInteger(filter.pageSize, 50))
  const from = (page - 1) * pageSize

  const config = useRuntimeConfig(event)
  const resolvedFilter = await resolvePublicationFilter(filter, config.elasticsearchUrl)
  const body = buildPublicationQuery(resolvedFilter, { from, size: pageSize })
  


  const response = await fetch(`${config.elasticsearchUrl}/publications/_search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Elasticsearch error: ${response.statusText}`
    })
  }

  const data = await response.json()
  const publications = data.hits.hits.map((hit: any) => hit._source)

  // Extract min / max
  const minYear = data.aggregations?.min_year?.value ?? null
  const maxYear = data.aggregations?.max_year?.value ?? null
  const range = (minYear !== null && maxYear !== null) ? { minYear, maxYear } : null
  const total = typeof data.hits.total === 'number' ? data.hits.total : data.hits.total?.value ?? 0

  return {
    publications,
    range,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
})
