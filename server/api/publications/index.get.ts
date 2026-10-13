

export default defineEventHandler(async (event) => {
    // Load list of publications from http://localhost:9200/publications/_search

    console.log('Fetching publications from Elasticsearch...')

    const response = await fetch('http://localhost:9200/publications/_search', {
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