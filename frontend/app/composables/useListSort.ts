export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: string
  dir: SortDirection
}

export function useListSort<T>(defaultKey = '', defaultDir: SortDirection = 'desc') {
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
