'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/Button';
import { Input } from '@/app/components/Input';
import { Divider } from '@/app/components/Common';
import { HiCheck, HiDocumentDuplicate } from 'react-icons/hi2';
import { timeAgo, timeLeft, shortDateTime } from '@/lib/format-time';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';

interface ChatUserRow {
  id: string;
  anonymousId: string;
  email: string | null;
  purchasedCredits: number;
  freeUsedInWindow: number;
  windowExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditStats {
  users: ChatUserRow[];
  totalDonations: number;
  totalDonationAmount: number;
  providerCooldownUntil: string | null;
}

const CopyButton = ({ text, onCopy }: { text: string; onCopy: (t: string) => void }) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleClick = () => {
    onCopy(text);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copied ? undefined : handleClick}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-full transition-colors',
        copied ? 'text-success' : 'cursor-pointer text-base-content hover:bg-base-300'
      )}
      title={copied ? 'Copied!' : 'Copy'}
      aria-label={copied ? 'Copied' : 'Copy'}
      disabled={copied}
    >
      {copied ? <HiCheck className="h-3 w-3" /> : <HiDocumentDuplicate className="h-3 w-3" />}
    </button>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <div className="text-xs text-base-content">{label}</div>
    <div className="text-lg font-semibold">{String(value)}</div>
  </div>
);

const chatUserColumnHelper = createColumnHelper<ChatUserRow>();

export default function ChatCreditsPanel({
  creditStats,
  onRefresh,
  showMessage,
}: {
  creditStats: CreditStats;
  onRefresh: () => void;
  showMessage: (msg: string) => void;
}) {
  const [grantIdentifier, setGrantIdentifier] = useState('');
  const [grantAmount, setGrantAmount] = useState('');
  const [revokeIdentifier, setRevokeIdentifier] = useState('');
  const [creditActionLoading, setCreditActionLoading] = useState(false);

  const copyToClipboard = useCallback(
    (text: string) => {
      void navigator.clipboard.writeText(text);
      showMessage('Copied');
    },
    [showMessage]
  );

  const handleCreditAction = async (
    action: 'grant' | 'revoke',
    identifier: string,
    amount?: string
  ) => {
    if (!identifier.trim()) return;
    setCreditActionLoading(true);
    try {
      const res = await fetch('/api/admin/credit-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          identifier: identifier.trim(),
          amount: amount ? Number(amount) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMessage(data.error ?? 'Failed');
        return;
      }
      showMessage(
        `${action === 'grant' ? 'Granted' : 'Revoked'} ${data.credits} credits → balance: ${data.newBalance}`
      );
      onRefresh();
    } catch {
      showMessage('Request failed');
    } finally {
      setCreditActionLoading(false);
    }
  };

  const chatUserColumns = useMemo(
    () => [
      chatUserColumnHelper.accessor('anonymousId', {
        header: 'ID',
        size: 220,
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="flex items-center gap-1">
              <span className="truncate font-mono" title={val}>
                {val}
              </span>
              <CopyButton text={val} onCopy={copyToClipboard} />
            </span>
          );
        },
      }),
      chatUserColumnHelper.accessor('email', {
        header: 'Email',
        size: 220,
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <span className="text-base-content/30">—</span>;
          return (
            <span className="flex items-center gap-1">
              <span className="truncate" title={val}>
                {val}
              </span>
              <CopyButton text={val} onCopy={copyToClipboard} />
            </span>
          );
        },
      }),
      chatUserColumnHelper.accessor('purchasedCredits', { header: 'Credits' }),
      chatUserColumnHelper.accessor('freeUsedInWindow', { header: 'Free Used' }),
      chatUserColumnHelper.accessor('windowExpiresAt', {
        header: 'Free Window',
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <span className="text-base-content/30">—</span>;
          const d = new Date(val);
          return d > new Date() ? timeLeft(d) : 'reset';
        },
      }),
      chatUserColumnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => timeAgo(info.getValue()),
      }),
      chatUserColumnHelper.accessor('updatedAt', {
        header: 'Last Active',
        cell: (info) => timeAgo(info.getValue()),
      }),
    ],
    [copyToClipboard]
  );

  const creditTable = useReactTable({
    data: creditStats.users,
    columns: chatUserColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <Divider className="my-4" />
      <h3 className="mb-3 font-medium">Chat Credits ({creditStats.users.length} users)</h3>

      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
        <Stat label="Donations" value={creditStats.totalDonations} />
        <Stat label="Donation Total" value={`$${creditStats.totalDonationAmount.toFixed(2)}`} />
        {creditStats.providerCooldownUntil && (
          <div className="bg-warning/10 rounded px-3 py-2 text-xs text-warning">
            Anthropic cooldown until {shortDateTime(creditStats.providerCooldownUntil)}
          </div>
        )}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="table table-xs">
          <thead>
            {creditTable.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} style={{ width: header.getSize() }}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {creditTable.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Divider className="my-3" />

      <div className="space-y-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              size="sm"
              label="User ID or email"
              value={grantIdentifier}
              onChange={(e) => setGrantIdentifier(e.target.value)}
              placeholder="778ffdda-9020-4016-91cc-13bf8edc21af"
              className="h-9"
            />
          </div>
          <div className="w-28">
            <Input.Number size="sm" label="Credits" value={grantAmount} onChange={setGrantAmount} />
          </div>
          <Button.Stroked
            size="sm"
            color="primary"
            onClick={() => handleCreditAction('grant', grantIdentifier, grantAmount)}
            disabled={creditActionLoading || !grantIdentifier || !grantAmount}
          >
            Grant
          </Button.Stroked>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              size="sm"
              label="User ID or email"
              value={revokeIdentifier}
              onChange={(e) => setRevokeIdentifier(e.target.value)}
              placeholder="778ffdda-9020-4016-91cc-13bf8edc21af"
              className="h-9"
            />
          </div>
          <Button.Stroked
            size="sm"
            color="error"
            onClick={() => handleCreditAction('revoke', revokeIdentifier)}
            disabled={creditActionLoading || !revokeIdentifier}
          >
            Revoke
          </Button.Stroked>
        </div>
      </div>
    </>
  );
}
