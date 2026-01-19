// app/admin/_components/DataTable.jsx - UPDATED WITH EDIT/DELETE SUPPORT
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';

export function DataTable({ 
  data = [], 
  columns = [], 
  onEdit,           // Function: (id) => void
  onDelete,         // Function: (id) => void
  editUrl,          // String pattern: "/admin/categories?edit=:id"
  deleteAction,     // Server Action: async (id) => Promise<{success, error}>
  searchable = true,
  searchPlaceholder = "Search..."
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState(null);

  // Filter data
  const filtered = search 
    ? data.filter(row => 
        columns.some(col => {
          const value = col.key.includes('.') 
            ? col.key.split('.').reduce((obj, key) => obj?.[key], row)
            : row[col.key];
          return value?.toString().toLowerCase().includes(search.toLowerCase());
        })
      )
    : data;

  // Sort data
  const sorted = sortColumn
    ? [...filtered].sort((a, b) => {
        const aVal = sortColumn.split('.').reduce((obj, key) => obj?.[key], a);
        const bVal = sortColumn.split('.').reduce((obj, key) => obj?.[key], b);
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal > bVal ? 1 : -1;
        return sortDirection === 'asc' ? comparison : -comparison;
      })
    : filtered;

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Handle edit click
  const handleEdit = (id) => {
    if (onEdit) {
      onEdit(id);
    } else if (editUrl) {
      const url = editUrl.replace(':id', id);
      router.push(url);
    }
  };

  // Handle delete click
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setDeletingId(id);

    if (onDelete) {
      // Use custom onDelete function
      await onDelete(id);
      setDeletingId(null);
    } else if (deleteAction) {
      // Use server action
      startTransition(async () => {
        try {
          const result = await deleteAction(id);
          
          if (result.error) {
            alert(result.error);
          } else {
            // Refresh the page to show updated data
            router.refresh();
          }
        } catch (error) {
          console.error('Delete error:', error);
          alert('Failed to delete item');
        } finally {
          setDeletingId(null);
        }
      });
    }
  };

  const hasActions = onEdit || onDelete || editUrl || deleteAction;

  return (
    <div className={styles.dataTableContainer}>
      {searchable && (
        <div className={styles.searchBar}>
          <input 
            type="search" 
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchResults}>
            {sorted.length} {sorted.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      )}
      
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={col.sortable !== false ? styles.sortable : ''}
                >
                  <div className={styles.thContent}>
                    {col.label}
                    {sortColumn === col.key && (
                      <span className={styles.sortIcon}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {hasActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className={styles.emptyState}>
                  No data found
                </td>
              </tr>
            ) : (
              sorted.map(row => (
                <tr key={row.id}>
                  {columns.map(col => {
                    const value = col.key.includes('.') 
                      ? col.key.split('.').reduce((obj, key) => obj?.[key], row)
                      : row[col.key];
                    
                    return (
                      <td key={col.key}>
                        {col.render ? col.render(value, row) : value}
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td className={styles.actions}>
                      {(onEdit || editUrl) && (
                        <button
                          onClick={() => handleEdit(row.id)}
                          className={styles.btnEdit}
                          type="button"
                          disabled={isPending && deletingId === row.id}
                        >
                          Edit
                        </button>
                      )}
                      {(onDelete || deleteAction) && (
                        <button
                          onClick={() => handleDelete(row.id)}
                          className={styles.btnDelete}
                          type="button"
                          disabled={isPending && deletingId === row.id}
                        >
                          {isPending && deletingId === row.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
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