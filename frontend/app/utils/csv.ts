export function downloadCsv(rows: Record<string, string | number | null>[], filename: string) {
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const sep = ';'

  const lines = [
    headers.join(sep),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h]
        if (val === null || val === undefined) return ''
        const str = String(val)
        if (str.includes(sep) || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"'
        }
        return str
      }).join(sep)
    )
  ]

  // BOM for Excel UTF-8 detection
  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
