// components/Breadcrumbs/Breadcrumbs.jsx
import Link from 'next/link';
import './breadcrumbs.css';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

/**
 * Breadcrumb component with visible navigation + Schema.org BreadcrumbList in JSON‑LD.
 * @param {Object[]} items - Array of breadcrumb items.
 * @param {string} items[].name - Display name.
 * @param {string} items[].url - URL for the item (can be absolute or relative).
 * @param {string} locale - Current locale, e.g. 'ar-SA' or 'en-SA'.
 */
export default function Breadcrumbs({ items, locale }) {
  if (!items || items.length === 0) return null;

  const isRtl = locale?.startsWith('ar') ?? false;
  const separator = isRtl ? '‹' : '›';

  // Build absolute URLs for JSON‑LD (Google requires them)
  const absoluteItems = items.map(item => ({
    ...item,
    absoluteUrl: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
  }));

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: absoluteItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: {
        '@id': item.absoluteUrl,
        name: item.name,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <ol className="breadcrumbs-list">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.url} className="breadcrumb-item">
                {!isLast ? (
                  <>
                    <Link href={item.url} className="breadcrumb-link">
                      {item.name}
                    </Link>
                    <span className="breadcrumb-separator" aria-hidden="true">
                      {separator}
                    </span>
                  </>
                ) : (
                  <span className="breadcrumb-current" aria-current="page">
                    {item.name}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
