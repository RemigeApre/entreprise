import { describe, it, expect } from 'vitest'
import { ref, computed, nextTick } from 'vue'

// Inline for testing (composable uses Nuxt auto-imports)
function usePagination<T>(items: { value: T[] }, perPage = 24) {
  const page = ref(1)
  const pageSize = ref(perPage)
  const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize.value)))
  const paginatedItems = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return items.value.slice(start, start + pageSize.value)
  })
  const showPagination = computed(() => items.value.length > pageSize.value)
  function goTo(p: number) {
    page.value = Math.max(1, Math.min(p, totalPages.value))
  }
  function next() { goTo(page.value + 1) }
  function prev() { goTo(page.value - 1) }
  return { page, pageSize, totalPages, paginatedItems, showPagination, goTo, next, prev }
}

function makeItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }))
}

describe('usePagination', () => {
  it('should show all items when count <= perPage', () => {
    const items = ref(makeItems(5))
    const { paginatedItems, showPagination, totalPages } = usePagination(items, 10)

    expect(paginatedItems.value).toHaveLength(5)
    expect(showPagination.value).toBe(false)
    expect(totalPages.value).toBe(1)
  })

  it('should paginate when count > perPage', () => {
    const items = ref(makeItems(30))
    const { paginatedItems, showPagination, totalPages, page } = usePagination(items, 10)

    expect(paginatedItems.value).toHaveLength(10)
    expect(showPagination.value).toBe(true)
    expect(totalPages.value).toBe(3)
    expect(page.value).toBe(1)
    expect(paginatedItems.value[0].id).toBe(1)
  })

  it('should navigate pages with next/prev', () => {
    const items = ref(makeItems(30))
    const { paginatedItems, page, next, prev } = usePagination(items, 10)

    next()
    expect(page.value).toBe(2)
    expect(paginatedItems.value[0].id).toBe(11)

    next()
    expect(page.value).toBe(3)
    expect(paginatedItems.value[0].id).toBe(21)
    expect(paginatedItems.value).toHaveLength(10)

    prev()
    expect(page.value).toBe(2)
  })

  it('should not go below page 1', () => {
    const items = ref(makeItems(10))
    const { page, prev } = usePagination(items, 5)

    prev()
    expect(page.value).toBe(1)
  })

  it('should not go above total pages', () => {
    const items = ref(makeItems(10))
    const { page, next } = usePagination(items, 5)

    next()
    next()
    next() // Should stay at 2
    expect(page.value).toBe(2)
  })

  it('should handle goTo', () => {
    const items = ref(makeItems(50))
    const { page, goTo } = usePagination(items, 10)

    goTo(3)
    expect(page.value).toBe(3)

    goTo(0) // Clamped to 1
    expect(page.value).toBe(1)

    goTo(100) // Clamped to 5
    expect(page.value).toBe(5)
  })

  it('should handle last page with partial items', () => {
    const items = ref(makeItems(25))
    const { paginatedItems, totalPages, goTo } = usePagination(items, 10)

    goTo(3)
    expect(totalPages.value).toBe(3)
    expect(paginatedItems.value).toHaveLength(5)
  })

  it('should handle empty items', () => {
    const items = ref([])
    const { paginatedItems, totalPages, showPagination } = usePagination(items, 10)

    expect(paginatedItems.value).toHaveLength(0)
    expect(totalPages.value).toBe(1)
    expect(showPagination.value).toBe(false)
  })
})
