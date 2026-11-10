<template>
  <header class="gup-header" @keydown.esc="closeMenu(true)">
    <div class="gup-header__inner">
      <div class="gup-header__brand">
        <NuxtLink to="/" class="gup-header__org">
          GÖTEBORGS<br />UNIVERSITETSBIBLIOTEK
        </NuxtLink>
        <span class="gup-header__divider" aria-hidden="true" />
        <NuxtLink to="/" class="gup-header__app">GUP</NuxtLink>
      </div>

      <button type="button" class="gup-header__lang" @click="toggleLocale">{{ localeLabel }}</button>
      <button ref="menuButton" type="button" class="gup-header__menu-button"
        :aria-expanded="menuOpen" aria-controls="header-menu" @click="menuOpen = !menuOpen">
        {{ menuOpen ? $t('nav.closeMenu') : $t('nav.openMenu') }}
      </button>
      <div id="header-menu" class="gup-header__menu" :class="{ 'is-open': menuOpen }">
        <nav class="gup-header__nav" :aria-label="$t('nav.mainMenu')">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="gup-header__link"
            active-class="is-active"
            @click="closeMenu(true)"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { locale, setLocale, t } = useI18n()
const menuOpen = ref(false)
const menuButton = ref<HTMLButtonElement | null>(null)
const route = useRoute()
const closeMenu = (restoreFocus = false) => {
  if (!menuOpen.value) return
  menuOpen.value = false
  if (restoreFocus) menuButton.value?.focus()
}
watch(() => route.fullPath, () => closeMenu())

const navItems = computed(() =>
  [
    { to: '/publikationslistor', label: t('nav.lists') }
  ]
)

const localeLabel = computed(() => (locale.value === 'sv' ? 'English' : 'Svenska'))

const toggleLocale = () => setLocale(locale.value === 'sv' ? 'en' : 'sv')
</script>

<style scoped>
.gup-header {
  background: #005ea8;
  color: #fff;
  font-family: Arial, Helvetica, sans-serif;
}

.gup-header__inner {
  display: flex;
  align-items: stretch;
  min-height: 56px;
  padding: 0 20px;
  gap: 20px;
}

.gup-header__brand {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.gup-header__org {
  color: #fff;
  text-decoration: none;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.15;
  text-transform: uppercase;
}

.gup-header__divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.55);
}

.gup-header__app {
  color: #fff;
  text-decoration: none;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.gup-header__nav {
  display: flex;
  align-items: stretch;
  gap: 4px;
}

.gup-header__link {
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #fff;
  text-decoration: none;
  font-size: 15px;
  border-bottom: 3px solid transparent;
}

.gup-header__link:hover {
  background: rgba(255, 255, 255, 0.08);
}

.gup-header__link.is-active {
  border-bottom-color: #7eb6e6;
}

.gup-header__lang {
  background: none;
  border: 0;
  color: #fff;
  text-decoration: none;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.gup-header__menu { display: contents; }
.gup-header__menu-button { display: none; }
.gup-header__lang { order: 2; margin-left: auto; min-height: 44px; }
.gup-header__link { min-height: 44px; }

@media (max-width: 959px) {
  .gup-header__inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
  }
  .gup-header__brand { gap: 8px; min-width: 0; flex-wrap: wrap; }
  .gup-header__org { font-size: 8px; }
  .gup-header__app { font-size: 20px; }
  .gup-header__lang { order: initial; margin: 0; padding: 0 4px; }
  .gup-header__menu-button {
    display: block;
    min-height: 44px;
    padding: 0 8px;
    border: 1px solid rgba(255,255,255,.7);
    border-radius: 4px;
    color: #fff;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }
  .gup-header__menu { display: none; grid-column: 1 / -1; }
  .gup-header__menu.is-open { display: block; }
  .gup-header__nav { flex-direction: column; }
  .gup-header__link { padding: 10px 0; }
}
</style>
