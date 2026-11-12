// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'sv',
    strategy: 'no_prefix',
    langDir: 'locales/',
    locales: [
      { code: 'sv', language: 'sv-SE', file: 'sv.json' },
      { code: 'en', language: 'en-GB', file: 'en.json' }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'gup_locale'
    }
  },
  runtimeConfig: {
    elasticsearchUrl: '',
    adminBackendUrl: '',
    gupUrl: ''
  }
})
