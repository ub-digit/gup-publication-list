import { createError } from 'h3'

// Department selections include descendants, matching the existing GUP search.
export async function resolvePublicationFilter(filter: Record<string, any>, elasticsearchUrl: string) {
  const values = Array.isArray(filter.institutionIds) ? filter.institutionIds : String(filter.institutionIds ?? '').split(',')
  const ids = [...new Set(values.filter(value => String(value).trim() !== '')
    .map(Number).filter(value => Number.isSafeInteger(value) && value > 0))]
  if (!ids.length) return filter

  let data: any
  try {
    const response = await fetch(`${elasticsearchUrl}/departments/_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        size: 10000,
        track_total_hits: true,
        _source: ['id'],
        query: { terms: { hierarchy: ids } }
      })
    })
    if (!response.ok) throw new Error('Department lookup failed')
    data = await response.json()
    const total = typeof data.hits?.total === 'number' ? data.hits.total : data.hits?.total?.value
    if (!Array.isArray(data.hits?.hits) || data.timed_out || data._shards?.failed > 0 || total > data.hits.hits.length) {
      throw new Error('Department lookup incomplete')
    }
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Could not resolve institution filter' })
  }
  const descendants = data.hits.hits.map((hit: any) => Number(hit._source?.id ?? hit._id))
    .filter((id: number) => Number.isSafeInteger(id) && id > 0)
  return { ...filter, institutionIds: [...new Set([...ids, ...descendants])] }
}
