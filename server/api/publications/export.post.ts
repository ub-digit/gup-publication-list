import { resolvePublicationFilter } from '../../utils/publicationFilter'
import type { Publication } from '../../../shared/types/publication'
import { buildPublicationQuery } from '../../utils/publicationQuery'
import { publicationsToRis } from '../../utils/ris'

export default defineEventHandler(async (event) => {
  const filter = await readBody(event) || {}
  if (typeof filter !== 'object' || Array.isArray(filter)) {
    throw createError({ statusCode: 400, statusMessage: 'Expected publication filters' })
  }
  const config = useRuntimeConfig(event)
  // Ignore UI pagination and any client-supplied limit. One bounded search also
  // avoids duplicates or omissions caused by indexing between batch requests.
  const resolvedFilter = await resolvePublicationFilter(filter, config.elasticsearchUrl)
  const body = buildPublicationQuery(resolvedFilter, { size: 10000, aggregations: false })
  body._source = [
    'publication_type_id', 'title', 'authors', 'pubyear', 'publanguage',
    'publication_identifiers', 'issn', 'eissn', 'isbn', 'keywords',
    'sourcetitle', 'sourcevolume', 'sourceissue', 'sourcepages',
    'publisher', 'abstract', 'url'
  ]
  let response: Response
  try {
    response = await fetch(`${config.elasticsearchUrl}/publications/_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000)
    })
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Could not prepare publication export' })
  }
  if (!response.ok) {
    throw createError({ statusCode: 502, statusMessage: 'Publication export search failed' })
  }
  const data = await response.json()
  if (data.timed_out || data._shards?.failed > 0 || !Array.isArray(data.hits?.hits)) {
    throw createError({ statusCode: 502, statusMessage: 'Publication export search was incomplete' })
  }
  const publications: Publication[] = data.hits.hits.slice(0, 10000).map((hit: { _source: Publication }) => hit._source)
  const total = typeof data.hits.total === 'number' ? data.hits.total : data.hits.total?.value ?? publications.length
  setHeader(event, 'Content-Type', 'application/x-research-info-systems; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'attachment; filename="publications.ris"')
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-Export-Limited', String(total > 10000))
  return publicationsToRis(publications)
})
