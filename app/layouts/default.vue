<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  margin: 0;
  min-height: 100vh;
}

.app-main {
  min-width: 768px;
  max-width: 992px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>