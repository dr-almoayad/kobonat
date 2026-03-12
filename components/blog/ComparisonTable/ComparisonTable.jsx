'use client';
// components/blog/ComparisonTable/ComparisonTable.jsx
// Renders a single comparison table inside a blog post.
// Props:
//   table  — ComparisonTable object with nested columns, rows, cells
//   locale — full locale string e.g. 'ar-SA' | 'en-SA'

import { useState } from 'react';
import Link from 'next/link';
import styles from './ComparisonTable.module.css';

// ── Cell value renderers ──────────────────────────────────────────────────────
function RatingCell({ value }) {
  if (value == null) return <span className={styles.naValue}>—</span>;
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className={styles.ratingCell}>
      <span className={styles.ratingScore}>{value.toFixed(1)}</span>
      <div className={styles.stars}>
        {[1,2,3,4,5].map(i => (
          <span key={i} className={`material-symbols-sharp ${styles.star} ${i <= full ? styles.starFull : i === full+1 && half ? styles.starHalf : styles.starEmpty}`} style={{ fontSize: '0.85rem' }}>
            {i <= full ? 'star' : i === full+1 && half ? 'star_half' : 'star_border'}
          </span>
        ))}
      </div>
    </div>
  );
}

function BooleanCell({ value }) {
  if (value == null) return <span className={styles.naValue}>—</span>;
  return (
    <span className={value ? styles.boolTrue : styles.boolFalse}>
      <span className="material-symbols-sharp" style={{ fontSize: '1.15rem' }}>
        {value ? 'check_circle' : 'cancel'}
      </span>
    </span>
  );
}

function BadgeCell({ value }) {
  if (!value) return <span className={styles.naValue}>—</span>;
  return <span className={styles.badgeCell}>{value}</span>;
}

function TextCell({ value }) {
  if (!value) return <span className={styles.naValue}>—</span>;
  return <span className={styles.textCell}>{value}</span>;
}

function CellValue({ row, cell, lang }) {
  if (!cell) return <span className={styles.naValue}>—</span>;
  switch (row.rowType) {
    case 'RATING':  return <RatingCell  value={cell.numericValue} />;
    case 'BOOLEAN': return <BooleanCell value={cell.boolValue} />;
    case 'BADGE':   return <BadgeCell   value={lang === 'ar' ? cell.textValueAr : cell.textValueEn} />;
    default:        return <TextCell    value={lang === 'ar' ? cell.textValueAr : cell.textValueEn} />;
  }
}

function resolveColumn(col, lang) {
  const t = col.translations?.find(t => t.locale === lang) || col.translations?.[0] || {};
  const name = t.name
    || col.bank?.translations?.find(t => t.locale === lang)?.name
    || col.bank?.translations?.find(t => t.locale === 'en')?.name
    || col.store?.translations?.find(t => t.locale === 'en')?.name
    || col.bankCard?.translations?.find(t => t.locale === 'en')?.name
    || col.product?.translations?.find(t => t.locale === 'en')?.title
    || '—';
  const image = col.image || col.bank?.logo || col.store?.logo || col.bankCard?.image || col.product?.image || null;
  return { name, image, badge: t.badge || null, description: t.description || null };
}

export default function ComparisonTable({ table, locale }) {
  const lang  = locale?.split('-')[0] || 'ar';
  const isRTL = lang === 'ar';

  const t       = table.translations?.find(t => t.locale === lang) || table.translations?.[0] || {};
  const columns = table.columns || [];
  const rows    = table.rows    || [];

  // Cell lookup: cellMap[columnId][rowId]
  const cellMap = {};
  for (const col of columns) {
    cellMap[col.id] = {};
    for (const cell of col.cells || []) {
      cellMap[col.id][cell.rowId] = cell;
    }
  }

  const defaultActive = columns.findIndex(c => c.isHighlighted);
  const [activeColIdx, setActiveColIdx] = useState(defaultActive >= 0 ? defaultActive : 0);

  if (columns.length === 0 || rows.length === 0) return null;

  return (
    <div className={styles.wrapper} dir={isRTL ? 'rtl' : 'ltr'} aria-label={t.title || 'Comparison table'}>

      {/* Header */}
      {(t.title || t.subtitle) && (
        <div className={styles.header}>
          {t.title    && <h2 className={styles.title}>{t.title}</h2>}
          {t.subtitle && <p  className={styles.subtitle}>{t.subtitle}</p>}
        </div>
      )}

      {/* Mobile column picker */}
      <div className={styles.mobilePicker} role="tablist" aria-label={isRTL ? 'اختر عموداً' : 'Choose column'}>
        {columns.map((col, idx) => {
          const { name } = resolveColumn(col, lang);
          return (
            <button
              key={col.id}
              type="button"
              role="tab"
              aria-selected={idx === activeColIdx}
              className={`${styles.mobilePickerBtn} ${idx === activeColIdx ? styles.mobilePickerBtnActive : ''} ${col.isHighlighted ? styles.mobilePickerBtnHighlight : ''}`}
              onClick={() => setActiveColIdx(idx)}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Table scroll wrapper */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.cornerCell} aria-hidden="true" />
              {columns.map((col, idx) => {
                const { name, image, badge, description } = resolveColumn(col, lang);
                return (
                  <th key={col.id} scope="col"
                    className={[styles.colHeader, col.isHighlighted && styles.colHighlighted, idx !== activeColIdx && styles.colHiddenMobile].filter(Boolean).join(' ')}
                  >
                    {badge && <div className={styles.colBadge}>{badge}</div>}
                    <div className={styles.colHeaderInner}>
                      {image
                        ? <div className={styles.colImgWrap}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={image} alt={name} className={styles.colImg} />
                          </div>
                        : <div className={styles.colInitials} style={{ background: col.bank?.color || '#470ae2' }}>
                            {name.slice(0,2).toUpperCase()}
                          </div>
                      }
                      <span className={styles.colName}>{name}</span>
                      {description && <span className={styles.colDesc}>{description}</span>}
                    </div>
                    {col.ctaUrl && (
                      <Link href={col.ctaUrl}
                        className={`${styles.colCta} ${col.isHighlighted ? styles.colCtaHighlighted : ''}`}
                        target="_blank" rel="nofollow noopener"
                      >
                        {isRTL ? 'عرض التفاصيل' : 'View Details'}
                        <span className="material-symbols-sharp" style={{ fontSize: '0.8rem' }}>
                          {isRTL ? 'arrow_back' : 'arrow_forward'}
                        </span>
                      </Link>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const rt = row.translations?.find(t => t.locale === lang) || row.translations?.[0] || {};
              return (
                <tr key={row.id} className={rowIdx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <th scope="row" className={styles.rowLabel}>
                    <div className={styles.rowLabelInner}>
                      <span className={styles.rowLabelText}>{rt.label || '—'}</span>
                      {rt.helpText && (
                        <span className={styles.helpTooltip} title={rt.helpText} aria-label={rt.helpText}>
                          <span className="material-symbols-sharp" style={{ fontSize: '0.8rem' }}>info</span>
                        </span>
                      )}
                    </div>
                  </th>
                  {columns.map((col, idx) => {
                    const cell = cellMap[col.id]?.[row.id] || null;
                    return (
                      <td key={col.id}
                        className={[
                          styles.cell,
                          col.isHighlighted    && styles.cellHighlighted,
                          cell?.isHighlighted  && styles.cellValueHighlighted,
                          idx !== activeColIdx && styles.cellHiddenMobile,
                        ].filter(Boolean).join(' ')}
                      >
                        <CellValue row={row} cell={cell} lang={lang} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={styles.footnote}>
        {isRTL
          ? 'المعلومات للتوجيه فقط — تحقق من المصادر الرسمية للحصول على أحدث البيانات.'
          : 'Information is for guidance only — verify with official sources for the latest data.'}
      </p>
    </div>
  );
}
