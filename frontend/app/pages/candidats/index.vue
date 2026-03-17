<script setup lang="ts">
definePageMeta({
  middleware: [
    'directeur',
    () => navigateTo('/candidats/stages', { replace: true })
  ]
})
</script>
