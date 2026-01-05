
'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { useDataTable, type ColumnDef, type SortingState } from '@/hooks/use-data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
}

export function DataTable<TData>({ columns, data }: DataTableProps<TData>) {
  const {
    rows,
    setSorting,
    sorting,
    setGlobalFilter,
    globalFilter,
  } = useDataTable(data, columns);

  const handleSort = (columnId: string) => {
    const isAsc = sorting.length > 0 && sorting[0].id === columnId && !sorting[0].desc;
    setSorting([{ id: columnId, desc: isAsc }]);
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter all columns..."
        value={globalFilter}
        onChange={e => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead key={column.accessorKey as string}>
                  {column.id === 'actions' ? (
                     <span className="flex justify-end pr-4">{column.header}</span>
                  ) : (
                    <Button
                        variant="ghost"
                        onClick={() => column.accessorKey && handleSort(column.accessorKey as string)}
                    >
                        {column.header}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <TableRow key={index}>
                  {columns.map(column => (
                    <TableCell key={column.accessorKey as string}>
                      {column.cell({ row })}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
