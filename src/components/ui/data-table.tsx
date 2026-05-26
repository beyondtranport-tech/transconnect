'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { useDataTable, type ColumnDef } from '@/hooks/use-data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { Checkbox } from './checkbox';

// Helper to safely access nested properties
function getNestedValue<T>(obj: T, path: string): any {
  if (obj === null || obj === undefined) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj as any);
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function DataTable<TData>({ columns, data, onSelectionChange }: DataTableProps<TData>) {
  const {
    rows,
    filteredCount,
    setSorting,
    sorting,
    setGlobalFilter,
    globalFilter,
    rowSelection,
    toggleAll,
    toggleRow,
    pageIndex,
    pageCount,
    pageSize,
    nextPage,
    prevPage,
    canNextPage,
    canPrevPage
  } = useDataTable(data, columns);

  const handleSort = (columnId: string) => {
    const isAsc = sorting.length > 0 && sorting[0].id === columnId && !sorting[0].desc;
    setSorting([{ id: columnId, desc: isAsc }]);
  };

  React.useEffect(() => {
      if (onSelectionChange) {
          onSelectionChange(Object.keys(rowSelection));
      }
  }, [rowSelection, onSelectionChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Filter all columns..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {Object.keys(rowSelection).length} of {filteredCount} selected
          </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={filteredCount > 0 && Object.keys(rowSelection).length === filteredCount}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                />
              </TableHead>
              {columns.map(column => (
                <TableHead key={(column.id || column.accessorKey) as string}>
                  {column.header ? (
                    column.id === 'actions' ? (
                      <div className="text-right">{column.header}</div>
                    ) : column.accessorKey ? (
                      <Button
                          variant="ghost"
                          onClick={() => handleSort(column.accessorKey as string)}
                          className="-ml-4 h-8"
                      >
                          {column.header}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      column.header
                    )
                  ) : null}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <TableRow key={(row.original as any).id || index} data-state={rowSelection[(row.original as any).id] ? 'selected' : ''}>
                  <TableCell>
                      <Checkbox 
                        checked={!!rowSelection[(row.original as any).id]}
                        onCheckedChange={(checked) => toggleRow((row.original as any).id, !!checked)}
                      />
                  </TableCell>
                  {columns.map(column => (
                    <TableCell key={(column.id || column.accessorKey) as string}>
                      {column.cell ? column.cell({ row }) : getNestedValue(row.original, column.accessorKey as string)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
            Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, filteredCount)} of {filteredCount} entries
        </div>
        <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={prevPage} disabled={!canPrevPage}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <div className="text-sm font-medium px-4">Page {pageIndex + 1} of {pageCount || 1}</div>
            <Button variant="outline" size="sm" onClick={nextPage} disabled={!canNextPage}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
        </div>
      </div>
    </div>
  );
}
