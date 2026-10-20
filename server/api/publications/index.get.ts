

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    // Load list of publications from Elasticsearch.

    console.log('Fetching publications from Elasticsearch...')

    const response = await fetch(`${config.elasticsearchUrl}/publications/_search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            size: 10,
            query: {
                bool: {
                    filter: [
                        {
                            term: {
                                "source": "gup"
                            }
                        }
                    ]
                }
            }
        })
    });



    const data = await response.json()

    // Extract the list of publications from the response
    const publications = data.hits.hits.map((hit: any) => hit._source)

    return publications
});
