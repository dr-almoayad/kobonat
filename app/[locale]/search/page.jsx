// app/[locale]/search/page.jsx - FIXED FOR MULTI-LANGUAGE
'use client'
import { useSearchParams } from 'next/navigation'
import SearchClient from './SearchClient'
import './searchPage.css'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  const t = useTranslations('SearchPage')
  const locale = useLocale()
  
  // Get current language from locale
  const currentLanguage = locale.split('-')[0]

  return (
    <div className="search_page">
      <div className="search-header">
        <div className="search-header-content">
          {/* Optional: You can add a search input or breadcrumbs here */}
        </div>
      </div>

      {query ? (
        <SearchClient />
      ) : (
        <EmptySearchState t={t} language={currentLanguage} />
      )}
    </div>
  )
}

function EmptySearchState({ t, language }) {
  return (
    <div className="empty-search">
      <span className="material-symbols-sharp" style={{ fontSize: '64px', opacity: 0.3 }}>
        search
      </span>
      <h2>{t('startSearching')}</h2>
      <p>{t('searchDescription')}</p>
      <div className="search-tips">
        <h3>{t('trySearchingFor')}</h3>
        <div className="search-examples">
          <button className="search-example-pill">
            <span className="material-symbols-sharp">storefront</span>
            {language === 'ar' ? 'أمازون' : 'Amazon'}
          </button>
          <button className="search-example-pill">
            <span className="material-symbols-sharp">local_offer</span>
            {language === 'ar' ? 'خصم ٥٠٪' : '50% off'}
          </button>
          <button className="search-example-pill">
            <span className="material-symbols-sharp">category</span>
            {language === 'ar' ? 'إلكترونيات' : 'Electronics'}
          </button>
          <button className="search-example-pill">
            <span className="material-symbols-sharp">checkroom</span>
            {language === 'ar' ? 'أزياء' : 'Fashion'}
          </button>
        </div>
      </div>
    </div>
  )
}