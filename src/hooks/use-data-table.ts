
'use client';

import { useState, useMemo } from 'react';

export interface ColumnDef<TData> {
  accessorKey?: keyof TData | string;
  header?: React.ReactNode;
  cell?: (props: { row: { original: TData } }) => React.ReactNode;
  id?: string;
}

export type SortingState = {
  id: string;
  desc: boolean;
}[];

export function useDataTable<TData>(data: TData[], columns: ColumnDef<TData>[]) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pageIndex, setPageIndex] = useState(0);
  // Set to 25 to align with recommended AI batch sizes
  const pageSize = 25;

  const getNestedValue = (obj: any, path?: string): any => {
    if (!path || obj === null || obj === undefined) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj as any);
  };

  const filteredRows = useMemo(() => {
    let processedData = [...data];

    // Apply global filter
    if (globalFilter) {
      processedData = processedData.filter(row =>
        columns.some(column => {
          if (!column.accessorKey) return false;
          const value = getNestedValue(row, column.accessorKey as string);
          return String(value).toLowerCase().includes(globalFilter.toLowerCase());
        })
      );
    }
    
    // Apply sorting
    if (sorting.length > 0) {
        const sortKey = sorting[0].id;
        const sortDesc = sorting[0].desc;

        processedData.sort((a, b) => {
            const valueA = getNestedValue(a, sortKey);
            const valueB = getNestedValue(b, sortKey);
            
            if (valueA === null || valueA === undefined) return 1;
            if (valueB === null || valueB === undefined) return -1;

            if (valueA < valueB) return sortDesc ? 1 : -1;
            if (valueA > valueB) return sortDesc ? -1 : 1;
            return 0;
        });
    }

    return processedData;

  }, [data, columns, globalFilter, sorting]);

  const pagedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredRows.slice(start, start + pageSize).map(original => ({ original }));
  }, [filteredRows, pageIndex, pageSize]);

  const toggleAll = (checked: boolean) => {
      const newSelection: Record<string, boolean> = {};
      if (checked) {
          pagedRows.forEach((row: any) => {
              const id = row.original.id;
              if (id) newSelection[id] = true;
          });
      }
      setRowSelection(newSelection);
  };

  const toggleRow = (id: string, checked: boolean) => {
      setRowSelection(prev => {
          const next = { ...prev };
          if (checked) next[id] = true;
          else delete next[id];
          return next;
      });
  };

  const pageCount = Math.ceil(filteredRows.length / pageSize);
  const canNextPage = pageIndex < pageCount - 1;
  const canPrevPage = pageIndex > 0;
  
  const nextPage = () => { if (canNextPage) setPageIndex(prev => prev + 1); };
  const prevPage = () => { if (canPrevPage) setPageIndex(prev => prev - 1); };

  return {
    rows: pagedRows,
    filteredCount: filteredRows.length,
    setSorting,
    setGlobalFilter,
    sorting,
    globalFilter,
    rowSelection,
    setRowSelection,
    toggleAll,
    toggleRow,
    pageIndex,
    pageCount,
    pageSize,
    nextPage,
    prevPage,
    canNextPage,
    canPrevPage
  };
}
