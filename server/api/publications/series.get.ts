export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    console.log('Fetching series data from Elasticsearch...')

    const response = await fetch(`${config.elasticsearchUrl}/series/_search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            size: 1000,
            _source: ['id', 'title']
        })
    })

    if (!response.ok) {
        throw createError({
            statusCode: response.status,
            statusMessage: `Elasticsearch error: ${response.statusText}`
        })
    }

    const data = await response.json()

    const series = data.hits?.hits
        ?.map((hit: any) => ({
            label: hit._source.title,
            value: hit._source.id
        }))
        .filter((series: { label?: string; value?: number }) => series.label && series.value != null)
        .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label))
        ?? []

    return series
})
