export function usePagination<T>(items: Ref<T[]> | ComputedRef<T[]>, perPage = 24) {
  const page = ref(1)
  const pageSize = ref(perPage)

  const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize.value)))

  const paginatedItems = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return items.value.slice(start, start + pageSize.value)
  })

  const showPagination = computed(() => items.value.length > pageSize.value)

  // Reset to page 1 when items change (filter/sort)
  watch(() => items.value.length, () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  })

  function goTo(p: number) {
    page.value = Math.max(1, Math.min(p, totalPages.value))
  }

  function next() { goTo(page.value + 1) }
  function prev() { goTo(page.value - 1) }

  return { page, pageSize, totalPages, paginatedItems, showPagination, goTo, next, prev }
}
