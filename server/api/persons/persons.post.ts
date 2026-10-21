export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const searchTerm = body.name
  const config = useRuntimeConfig(event)

  console.log('Received search term:', searchTerm)

  const response = await fetch(`${config.elasticsearchUrl}/persons/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Fetch a wider candidate set before excluding people without
      // publications; the UI still receives the best 10 results below.
      size: 100,
      query: {
        bool: {
          must: [{
            multi_match: {
              query: searchTerm,
              fields: ['names.full_name^3', 'names.first_name^2', 'names.last_name^2'],
              fuzziness: 'AUTO'
            }
          }],
          should: [{
            constant_score: {
              filter: { term: { 'identifiers.code': 'X_ACCOUNT' } },
              boost: 1000
            }
          }]
        }
      },
      sort: [{ _score: 'desc' }]
    })
  })

  if (!response.ok) {
    throw createError({ statusCode: response.status, statusMessage: `Elasticsearch error: ${response.statusText}` })
  }

  const data = await response.json()
  const personHits = data.hits.hits as Array<{ _source: any; _score: number }>
  const personIds = [...new Set(personHits.flatMap(hit =>
    (hit._source.names || [])
      .map((name: { gup_person_id?: number }) => Number(name.gup_person_id))
      .filter(Number.isFinite)
  ))]

  if (personIds.length === 0) return []

  // Count publications for all matched people in one request. People without
  // GUP publications are excluded, and X_ACCOUNT identities rank first.
  const publicationResponse = await fetch(`${config.elasticsearchUrl}/publications/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { source: 'gup' } },
            { terms: { 'authors.person.id': personIds } }
          ]
        }
      },
      aggs: {
        publications_by_person: {
          terms: { field: 'authors.person.id', size: personIds.length }
        }
      }
    })
  })

  if (!publicationResponse.ok) {
    throw createError({
      statusCode: publicationResponse.status,
      statusMessage: `Elasticsearch error: ${publicationResponse.statusText}`
    })
  }

  const publicationData = await publicationResponse.json()
  const publicationCounts = new Map(
    (publicationData.aggregations?.publications_by_person?.buckets || [])
      .map((bucket: { key: string | number; doc_count: number }) => [Number(bucket.key), bucket.doc_count])
  )

  return personHits
    .map((hit, index) => {
      const publicationCount = (hit._source.names || []).reduce(
        (count: number, name: { gup_person_id?: number }) => count + (publicationCounts.get(Number(name.gup_person_id)) || 0),
        0
      )
      const hasXAccount = (hit._source.identifiers || []).some(
        (identifier: { code?: string }) => identifier.code === 'X_ACCOUNT'
      )

      return { person: hit._source, publicationCount, hasXAccount, score: hit._score, index }
    })
    .filter(result => result.publicationCount > 0)
    .sort((left, right) =>
      Number(right.hasXAccount) - Number(left.hasXAccount) ||
      right.publicationCount - left.publicationCount ||
      right.score - left.score ||
      left.index - right.index
    )
    .slice(0, 10)
    .map(({ person }) => person)
})



