<template>
  <div class="landing-layout">
    <slot />
  </div>
</template>

<style scoped>
.landing-layout {
  height: 100dvh;
  overflow: hidden;
  background-color: #EDE5D0;
  transition: background-color 0.4s ease, color 0.4s ease;
}

:global(.dark) .landing-layout {
  background-color: #1a2318;
}
</style>

<style>
html:has(.landing-layout) {
  background-color: #EDE5D0;
  transition: background-color 0.4s ease;
}
html.dark:has(.landing-layout) {
  background-color: #1a2318;
}
</style>
