<script setup lang="ts">
definePageMeta({ middleware: ['directeur'] })
await navigateTo('/candidats/stages', { replace: true })
</script>
