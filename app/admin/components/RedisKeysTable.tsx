'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { Button } from '@/app/components/Button';
import { timeAgo, ttlLeft } from '@/lib/format-time';

interface RedisKey {
  key: string;
  ttl: number;
  cachedAt: number | null;
}

const friendlyName = (key: string): string => {
  const parts = key.split(':');
  if (parts[0] === 'ratelimit') return `Rate Limit (${parts[1]})`;
  if (parts[0] !== 'cfbd') return key;
  if (parts[1] === 'chat') {
    const endpoint = parts.slice(2, -1).join('/');
    return `Chat: /${endpoint}`;
  }
  const [, , type, ...rest] = parts;
  switch (type) {
    case 'games':
      return `${rest[0]} Games (${rest[1]} ${rest[2]})`;
    case 'teams':
      return `Teams (${rest[0]})`;
    case 'rankings':
      return `Rankings (${rest[0]} ${rest[2]})`;
    case 'sp':
      return `SP+ Ratings (${rest[0]})`;
    case 'fpi':
      return `FPI Ratings (${rest[0]})`;
    default:
      return key;
  }
};

const columnHelper = createColumnHelper<RedisKey>();

const RedisKeysTable = ({
  data,
  onDelete,
}: {
  data: RedisKey[];
  onDelete: (keys: string[]) => void;
}) => {
  const columns = useMemo(
    () => [
      columnHelper.accessor('key', {
        header: 'Key',
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'name',
        header: 'Name',
        cell: (info) => (
          <span className="whitespace-nowrap">{friendlyName(info.row.original.key)}</span>
        ),
      }),
      columnHelper.accessor('cachedAt', {
        header: 'Last Cached',
        cell: (info) => {
          const val = info.getValue();
          return <span className="whitespace-nowrap">{val ? timeAgo(val) : '—'}</span>;
        },
      }),
      columnHelper.accessor('ttl', {
        header: 'Expires In',
        cell: (info) => <span className="whitespace-nowrap">{ttlLeft(info.getValue())}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <Button size="xs" color="error" onClick={() => onDelete([info.row.original.key])}>
            Delete
          </Button>
        ),
      }),
    ],
    [onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return <p className="text-sm text-base-content">No cached keys found</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-xs">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RedisKeysTable;
export type { RedisKey };
