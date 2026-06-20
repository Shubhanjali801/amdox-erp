import React from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  error?: string | null
  empty?: string
  rowKey?: (row: T) => string
}

export function DataTable<T extends Record<string, any>>({
  columns, rows, loading, error, empty = 'No records found', rowKey,
}: Props<T>) {
  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Loading…</div>
  if (error) return <div className="text-red-400 text-sm py-8 text-center bg-red-900/20 border border-red-800 rounded-lg">{error}</div>

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-800 text-gray-400">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="text-left font-medium px-4 py-3 whitespace-nowrap">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center text-gray-500 py-8">{empty}</td></tr>
          ) : (
            rows.map((row, i) => (
              <tr key={rowKey ? rowKey(row) : i} className="hover:bg-gray-800/50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-gray-200 whitespace-nowrap">
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
