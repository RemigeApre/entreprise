<template>
  <div class="landing-layout">
    <slot />
  </div>
</template>

<style scoped>
.landing-layout {
  height: 100dvh;
  overflow: hidden;
  background-color: #F7F0DE;
  transition: background-color 0.4s ease, color 0.4s ease;
}

:global(.dark) .landing-layout {
  background-color: #1F2C23;
}
</style>
