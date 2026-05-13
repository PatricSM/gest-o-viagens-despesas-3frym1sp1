import { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from './EmptyState'

export interface Column<T = any> {
  header: string | ReactNode
  accessorKey?: keyof T
  cell?: (row: T) => ReactNode
  className?: string
}

/**
 * DataTable Component
 * Visual data table adhering to the "data-tabular" standard.
 * Sorting, pagination and selection state logic should be maintained by the parent.
 * @param columns - Array of column definitions.
 * @param data - The array of data rows to render.
 * @param emptyMessage - Message to display when no data is provided.
 * @param isLoading - Indicates if the table is currently loading data.
 */
export function DataTable<T = any>({
  columns,
  data,
  emptyMessage = 'Nenhum registro encontrado.',
  isLoading = false,
}: {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  isLoading?: boolean
}) {
  return (
    <div className="rounded-md border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table data-tabular>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  {columns.map((col, j) => (
                    <TableCell key={j} className={col.className}>
                      <Skeleton className="h-5 w-full max-w-[200px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center p-0 h-64">
                  <EmptyState icon={Inbox} title="Sem resultados" description={emptyMessage} />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow key={(row as any).id || i} className="group hover:bg-muted/30">
                  {columns.map((col, j) => (
                    <TableCell key={j} className={col.className}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                          ? String(row[col.accessorKey])
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
