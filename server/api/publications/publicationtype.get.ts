export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)

    console.log('Fetching publication types from external API...')

    const response = await fetch(`${config.adminBackendUrl}/publication_types`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw createError({
            statusCode: response.status,
            statusMessage: `Publication types API error: ${response.statusText}`
        })
    }

    const data = await response.json()

    // The GUP API wraps the list in a `publication_types` property.
    const publicationTypes = Array.isArray(data)
        ? data
        : data.publication_types

    if (!Array.isArray(publicationTypes)) {
        throw createError({
            statusCode: 502,
            statusMessage: 'Publication types API returned an unexpected response format'
        })
    }

    // Transform data to use publication_type_label as label and publication_type_id as value
    const transformedData = publicationTypes.map((item: any) => ({
        label: item.publication_type_label,
        value: item.publication_type_id
    }))

    return transformedData
});
