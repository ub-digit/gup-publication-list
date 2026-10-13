<template>
  <header class="gup-header">
    <div class="gup-header__inner">
      <div class="gup-header__brand">
        <NuxtLink to="/" class="gup-header__org">
          GÖTEBORGS<br />UNIVERSITETSBIBLIOTEK
        </NuxtLink>
        <span class="gup-header__divider" aria-hidden="true" />
        <NuxtLink to="/" class="gup-header__app">GUP</NuxtLink>
      </div>

      <nav class="gup-header__nav" aria-label="Huvudmeny">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="gup-header__link"
          active-class="is-active"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="gup-header__actions">
        <button type="button" class="gup-header__lang" @click="toggleLocale">
          {{ localeLabel }}
        </button>
        <NuxtLink to="/login" class="gup-header__user">
          <span class="gup-header__user-icon" aria-hidden="true">👤</span>
          xblars
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const locale = ref<'sv' | 'en'>('sv')

const navItems = computed(() =>
  locale.value === 'sv'
    ? [
        { to: '/publikationer', label: 'Publikationer' },
        { to: '/att-granska', label: 'Att granska' },
        { to: '/statistik', label: 'Statistik' },
        { to: '/publikationslistor', label: 'Publikationslistor' },
      ]
    : [
        { to: '/publikationer', label: 'Publications' },
        { to: '/att-granska', label: 'Review' },
        { to: '/statistik', label: 'Statistics' },
        { to: '/publikationslistor', label: 'Publication lists' },
      ]
)

const localeLabel = computed(() => (locale.value === 'sv' ? 'English' : 'Svenska'))

function toggleLocale() {
  locale.value = locale.value === 'sv' ? 'en' : 'sv'
}
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

.gup-header__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 18px;
}

.gup-header__lang,
.gup-header__user {
  background: none;
  border: 0;
  color: #fff;
  text-decoration: none;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.gup-header__user {
  display: flex;
  align-items: center;
  gap: 6px;
}

.gup-header__user-icon {
  font-size: 14px;
}
</style>