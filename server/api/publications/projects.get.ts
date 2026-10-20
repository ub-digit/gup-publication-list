export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    console.log('Fetching project data from Elasticsearch...')

    const response = await fetch(`${config.elasticsearchUrl}/projects/_search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            size: 1000
        })
    })

    if (!response.ok) {
        throw createError({
            statusCode: response.status,
            statusMessage: `Elasticsearch error: ${response.statusText}`
        })
    }

    const data = await response.json()

    const projects = data.hits?.hits
        ?.map((hit: any) => {
            const project = hit._source

            return {
                label: project.title ?? project.name ?? project.project,
                value: project.project_id ?? project.id
            }
        })
        .filter((project: { label?: string; value?: number }) => project.label && project.value != null)
        .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label))
        ?? []

    return projects
})
