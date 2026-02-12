// components/Breadcrumbs/Breadcrumbs.jsx
import Link from 'next/link';
import './breadcrumbs.css';

export default function Breadcrumbs({ items, locale }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol itemScope itemType="https://schema.org/BreadcrumbList" className="breadcrumbs-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li
              key={index}
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
                  <meta itemProp="position" content={String(index + 1)} />
                  <span className="breadcrumb-separator" aria-hidden="true">
                    {locale.startsWith('ar') ? '‹' : '›'}
                  </span>
                </>
              ) : (
                <>
                  <span itemProp="name" className="breadcrumb-current">
                    {item.name}
                  </span>
                  <meta itemProp="position" content={String(index + 1)} />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
