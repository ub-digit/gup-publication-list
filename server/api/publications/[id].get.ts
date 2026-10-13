export default defineEventHandler(async (event) => {
 const { id } = event.context.params as { id: string }

    // Load publication details from http://localhost:9200/publications/_search

    let url = `http://localhost:9200/publications/_doc/${id}`

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json()
    return data._source

})