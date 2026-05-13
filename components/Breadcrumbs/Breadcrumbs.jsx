// components/Breadcrumbs/Breadcrumbs.jsx
import Link from 'next/link';
import './breadcrumbs.css';

/**
 * Breadcrumb component with Schema.org BreadcrumbList markup.
 * @param {Object[]} items - Array of breadcrumb items.
 * @param {string} items[].name - Display name.
 * @param {string} items[].url - URL for the item (the last item can have url to itself or current page).
 * @param {string} locale - Current locale, e.g. 'ar-SA' or 'en-SA'.
 */
export default function Breadcrumbs({ items, locale }) {
  if (!items || items.length === 0) return null;

  const isRtl = locale?.startsWith('ar') ?? false;
  const separator = isRtl ? '‹' : '›';

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol itemScope itemType="https://schema.org/BreadcrumbList" className="breadcrumbs-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const position = index + 1;

          return (
            <li
              key={item.url} // Use url as stable key
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              className="breadcrumb-item"
            >
              {!isLast ? (
                <>
                  <Link
                    href={item.url}
                    itemProp="item"
                    className="breadcrumb-link"
                  >
                    <span itemProp="name">{item.name}</span>
                  </Link>
                  <meta itemProp="position" content={String(position)} />
                  <span className="breadcrumb-separator" aria-hidden="true">
                    {separator}
                  </span>
                </>
              ) : (
                <>
                  <span
                    itemProp="name"
                    className="breadcrumb-current"
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                  <meta itemProp="position" content={String(position)} />
                  {/* If the last item has a URL, include it for schema but don't render as link */}
                  {item.url && (
                    <meta itemProp="item" content={item.url} />
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
