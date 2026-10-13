export default defineEventHandler(async (event) => {

    const query = getQuery(event)
    const parentId = query.parentId as number | undefined

    const must: { term?: QueryTerm; terms?: { parent_id: string[] } }[] = [
        {
            term: {
                is_faculty: false
            }
        }
    ]

    if (parentId) {
        must.push({
            term: {
                parent_id: parentId
            }
        })
    }

    const response = await fetch('http://localhost:9200/departments/_search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            size: 1000,
            query: {
                bool: {
                    must
                }
            }
        })
    })

    const data = await response.json()

    const institutions = data.hits?.hits?.map((hit: any) => ({
        label: hit._source.name_en,
        value: hit._id,
        names: {
            en: hit._source.name_en,
            sv: hit._source.name_sv
        }
    })) || []

    return institutions
})