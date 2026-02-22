'use client';

import { useState, useMemo } from 'react';

export interface ColumnDef<TData> {
  accessorKey: keyof TData | string;
  header: React.ReactNode;
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

  const getNestedValue = (obj: any, path: string): any => {
    if (obj === null || obj === undefined) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const rows = useMemo(() => {
    let processedData = [...data];

    // Apply global filter
    if (globalFilter) {
      processedData = processedData.filter(row =>
        columns.some(column => {
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

    return processedData.map(original => ({ original }));

  }, [data, columns, globalFilter, sorting]);


  return {
    rows,
    setSorting,
    setGlobalFilter,
    sorting,
    globalFilter,
  };
}
