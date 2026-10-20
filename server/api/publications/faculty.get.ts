export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const response = await fetch(`${config.elasticsearchUrl}/departments/_search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            size: 1000,
            query: {
                term: {
                    is_faculty: true
                }
            }
        })
    });

    const data = await response.json()

    // Extract the list of faculties from the response
    const faculties = data.hits?.hits?.map((hit: any) => ({
        label: hit._source.name_en,
        value: hit._id,
        names: {
            en: hit._source.name_en,
            sv: hit._source.name_sv
        }
        
    })) || []

    return faculties
});