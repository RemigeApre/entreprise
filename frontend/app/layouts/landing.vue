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
}
</style>

<style>
html:has(.landing-layout) {
  background-color: #EDE5D0;
}
</style>
