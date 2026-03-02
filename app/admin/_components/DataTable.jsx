// app/admin/_components/DataTable.jsx
// Rewritten to use ap-* CSS classes from admin-panel.css
// Matches the same visual style as offers / intelligence / leaderboard pages.
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function DataTable({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  editUrl,
  deleteAction,
  searchable = true,
  searchPlaceholder = 'Search…',
}) {
  const router = useRouter();
  const [search,        setSearch]        = useState('');
  const [sortColumn,    setSortColumn]    = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [deletingId,    setDeletingId]    = useState(null);
  const [isPending,     startTransition]  = useTransition();

  // ── Filter ─────────────────────────────────────────────────────────────
  const filtered = search
    ? data.filter(row =>
        columns.some(col => {
          const v = col.key.includes('.')
            ? col.key.split('.').reduce((o, k) => o?.[k], row)
            : row[col.key];
          return String(v ?? '').toLowerCase().includes(search.toLowerCase());
        })
      )
    : data;

  // ── Sort ───────────────────────────────────────────────────────────────
  const sorted = sortColumn
    ? [...filtered].sort((a, b) => {
        const av = sortColumn.split('.').reduce((o, k) => o?.[k], a);
        const bv = sortColumn.split('.').reduce((o, k) => o?.[k], b);
        if (av === bv) return 0;
        const cmp = av > bv ? 1 : -1;
        return sortDirection === 'asc' ? cmp : -cmp;
      })
    : filtered;

  function handleSort(key) {
    if (sortColumn === key) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  }

  function handleEdit(id) {
    if (onEdit)   return onEdit(id);
    if (editUrl)  return router.push(editUrl.replace(':id', id));
  }

  async function handleDelete(id) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    setDeletingId(id);
    if (onDelete) {
      await onDelete(id);
      setDeletingId(null);
      return;
    }
    if (deleteAction) {
      startTransition(async () => {
        try {
          const result = await deleteAction(id);
          if (result?.error) alert(result.error);
          else router.refresh();
        } catch (e) {
          alert('Delete failed');
        } finally {
          setDeletingId(null);
        }
      });
    }
  }

  const hasActions = onEdit || onDelete || editUrl || deleteAction;

  return (
    <div className="ap-table-wrap" style={{ borderRadius: '6px', overflow: 'hidden' }}>
      {searchable && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--ap-border)', background: 'var(--ap-surface-2)',
        }}>
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ap-input"
            style={{ maxWidth: '320px' }}
          />
          <span style={{ fontFamily: 'var(--ap-mono)', fontSize: '0.72rem', color: 'var(--ap-text-muted)', whiteSpace: 'nowrap' }}>
            {sorted.length} {sorted.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="ap-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ cursor: col.sortable !== false ? 'pointer' : 'default' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {col.label}
                    {sortColumn === col.key && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {hasActions && <th style={{ width: '1px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)}>
                  <div className="ap-empty">No data found</div>
                </td>
              </tr>
            ) : (
              sorted.map(row => (
                <tr key={row.id}>
                  {columns.map(col => {
                    const value = col.key.includes('.')
                      ? col.key.split('.').reduce((o, k) => o?.[k], row)
                      : row[col.key];
                    return (
                      <td key={col.key}>
                        {col.render ? col.render(value, row) : (value ?? '—')}
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                        {(onEdit || editUrl) && (
                          <button
                            type="button"
                            className="ap-btn ap-btn--ghost ap-btn--xs"
                            onClick={() => handleEdit(row.id)}
                            disabled={isPending && deletingId === row.id}
                          >
                            Edit
                          </button>
                        )}
                        {(onDelete || deleteAction) && (
                          <button
                            type="button"
                            className="ap-btn ap-btn--danger ap-btn--xs"
                            onClick={() => handleDelete(row.id)}
                            disabled={isPending && deletingId === row.id}
                          >
                            {isPending && deletingId === row.id ? '…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
