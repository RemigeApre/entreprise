import { describe, it, expect, vi, beforeEach } from 'vitest'
import { downloadCsv } from '../app/utils/csv'

describe('downloadCsv', () => {
  beforeEach(() => {
    // Mock DOM APIs
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn()
    })
    vi.stubGlobal('Blob', vi.fn().mockImplementation((parts) => ({
      text: () => Promise.resolve(parts[0])
    })))
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn()
      }))
    })
  })

  it('should generate CSV with correct headers', () => {
    const rows = [
      { Nom: 'Dupont', Prenom: 'Jean', Age: 30 },
      { Nom: 'Martin', Prenom: 'Marie', Age: 25 }
    ]
    downloadCsv(rows, 'test.csv')

    expect(Blob).toHaveBeenCalledWith(
      [expect.stringContaining('Nom;Prenom;Age')],
      expect.any(Object)
    )
  })

  it('should handle empty rows gracefully', () => {
    downloadCsv([], 'empty.csv')
    // Should not create a blob
    expect(Blob).not.toHaveBeenCalled()
  })

  it('should escape values containing semicolons', () => {
    const rows = [{ Texte: 'hello;world' }]
    downloadCsv(rows, 'test.csv')

    expect(Blob).toHaveBeenCalledWith(
      [expect.stringContaining('"hello;world"')],
      expect.any(Object)
    )
  })

  it('should escape values containing quotes', () => {
    const rows = [{ Texte: 'He said "hello"' }]
    downloadCsv(rows, 'test.csv')

    expect(Blob).toHaveBeenCalledWith(
      [expect.stringContaining('"He said ""hello"""')],
      expect.any(Object)
    )
  })

  it('should handle null values', () => {
    const rows = [{ Nom: 'Test', Email: null }]
    downloadCsv(rows, 'test.csv')

    expect(Blob).toHaveBeenCalledWith(
      [expect.stringContaining('Test;')],
      expect.any(Object)
    )
  })

  it('should include BOM for Excel UTF-8 detection', () => {
    const rows = [{ Nom: 'Test' }]
    downloadCsv(rows, 'test.csv')

    expect(Blob).toHaveBeenCalledWith(
      [expect.stringContaining('\uFEFF')],
      expect.any(Object)
    )
  })
})
