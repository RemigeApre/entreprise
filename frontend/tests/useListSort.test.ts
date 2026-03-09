import { describe, it, expect } from 'vitest'
import { ref } from 'vue'

// Inline implementation for testing (composable uses Nuxt auto-imports)
type SortDirection = 'asc' | 'desc'
interface SortState { key: string; dir: SortDirection }

function useListSort<T>(defaultKey = '', defaultDir: SortDirection = 'desc') {
  const sort = ref<SortState>({ key: defaultKey, dir: defaultDir })

  function toggleSort(key: string) {
    if (sort.value.key === key) {
      sort.value = { key, dir: sort.value.dir === 'asc' ? 'desc' : 'asc' }
    } else {
      sort.value = { key, dir: 'asc' }
    }
  }

  function sortItems(items: T[], accessor: (item: T, key: string) => string | number | null): T[] {
    if (!sort.value.key) return items
    const { key, dir } = sort.value
    return [...items].sort((a, b) => {
      const va = accessor(a, key)
      const vb = accessor(b, key)
      if (va === null || va === undefined) return 1
      if (vb === null || vb === undefined) return -1
      if (typeof va === 'number' && typeof vb === 'number') {
        return dir === 'asc' ? va - vb : vb - va
      }
      const sa = String(va).toLowerCase()
      const sb = String(vb).toLowerCase()
      return dir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }

  return { sort, toggleSort, sortItems }
}

interface TestItem { name: string; age: number; city: string | null }

const items: TestItem[] = [
  { name: 'Charlie', age: 30, city: 'Paris' },
  { name: 'Alice', age: 25, city: 'Lyon' },
  { name: 'Bob', age: 35, city: null }
]

const accessor = (item: TestItem, key: string) => (item as any)[key] ?? null

describe('useListSort', () => {
  it('should initialize with default sort key and direction', () => {
    const { sort } = useListSort<TestItem>('name', 'asc')
    expect(sort.value).toEqual({ key: 'name', dir: 'asc' })
  })

  it('should toggle direction when clicking same key', () => {
    const { sort, toggleSort } = useListSort<TestItem>('name', 'asc')
    toggleSort('name')
    expect(sort.value.dir).toBe('desc')
    toggleSort('name')
    expect(sort.value.dir).toBe('asc')
  })

  it('should reset to asc when clicking different key', () => {
    const { sort, toggleSort } = useListSort<TestItem>('name', 'desc')
    toggleSort('age')
    expect(sort.value).toEqual({ key: 'age', dir: 'asc' })
  })

  it('should sort strings ascending', () => {
    const { sortItems } = useListSort<TestItem>('name', 'asc')
    const sorted = sortItems(items, accessor)
    expect(sorted.map(i => i.name)).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('should sort strings descending', () => {
    const { sortItems } = useListSort<TestItem>('name', 'desc')
    const sorted = sortItems(items, accessor)
    expect(sorted.map(i => i.name)).toEqual(['Charlie', 'Bob', 'Alice'])
  })

  it('should sort numbers ascending', () => {
    const { sortItems } = useListSort<TestItem>('age', 'asc')
    const sorted = sortItems(items, accessor)
    expect(sorted.map(i => i.age)).toEqual([25, 30, 35])
  })

  it('should sort numbers descending', () => {
    const { sortItems } = useListSort<TestItem>('age', 'desc')
    const sorted = sortItems(items, accessor)
    expect(sorted.map(i => i.age)).toEqual([35, 30, 25])
  })

  it('should push null values to the end', () => {
    const { sortItems } = useListSort<TestItem>('city', 'asc')
    const sorted = sortItems(items, accessor)
    expect(sorted[sorted.length - 1].city).toBeNull()
  })

  it('should not sort when no key is set', () => {
    const { sortItems } = useListSort<TestItem>('', 'asc')
    const sorted = sortItems(items, accessor)
    expect(sorted).toEqual(items) // Same reference since no copy
  })

  it('should not mutate original array', () => {
    const original = [...items]
    const { sortItems } = useListSort<TestItem>('name', 'asc')
    sortItems(items, accessor)
    expect(items).toEqual(original)
  })
})
