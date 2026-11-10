// Expose only the public navigation URL to the hydrated client.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  useState<string>('gup-url', () => config.gupUrl)
})
