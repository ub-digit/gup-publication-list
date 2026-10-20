export default defineEventHandler(async (event) => {
 const { id } = event.context.params as { id: string }

    // Load publication details from Elasticsearch.
    const config = useRuntimeConfig(event)
    let url = `${config.elasticsearchUrl}/publications/_doc/${id}`

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json()
    return data._source

})
