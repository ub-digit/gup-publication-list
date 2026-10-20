export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const searchTerm = body.name
  const elasticsearchUrl = useRuntimeConfig(event).elasticsearchUrl || 'http://localhost:9200'

  console.log('Received search term:', searchTerm)

  const response = await fetch(`${elasticsearchUrl}/persons/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      size: 10,
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

  if (personIds.length === 0) return personHits.map(hit => hit._source)

  // Count publications for all matched people in one request, then use those
  // counts to promote authors represented in the GUP publication index.
  const publicationResponse = await fetch(`${elasticsearchUrl}/publications/_search`, {
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
      return { person: hit._source, publicationCount, score: hit._score, index }
    })
    .sort((left, right) =>
      right.publicationCount - left.publicationCount || right.score - left.score || left.index - right.index
    )
    .map(({ person }) => person)
})



