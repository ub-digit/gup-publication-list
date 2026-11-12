// app/composables/usePublications.ts
// export function usePublications() {
//   return useAsyncData('publications', () => $fetch('/api/publications'))
// }


// composables/usePublications.ts
export function usePublications(filter: Ref<Record<string, any>> | ComputedRef<Record<string, any>>) {
  return useAsyncData(
    // key must change when any part of the filter changes
    () => `publications-${JSON.stringify(filter.value)}`,
    () => $fetch('/api/publications', {
      method: 'POST', 
      headers: {
      'Content-Type': 'application/json'
      },                    // or GET with query if you prefer
      body: filter.value,                 // entire filter object goes to the backend
    }),
    {
      watch: [filter],                    // refetch whenever the filter object changes
    }
  )
}