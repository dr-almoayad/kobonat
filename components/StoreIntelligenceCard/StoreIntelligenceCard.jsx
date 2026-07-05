// components/StoreIntelligenceCard/StoreIntelligenceCard.jsx
import { prisma } from '@/lib/prisma';
import './StoreIntelligenceCard.css';

// ── Helpers ──────────────────────────────────────────────────────────────
const pf = (v) => parseFloat(v ?? 0);

function fmt(v, unit = '') {
  if (v == null || isNaN(pf(v))) return '—';
  return `${Math.round(pf(v))}${unit}`;
}

function fmtRange(min, max, unit = '') {
  if (min == null && max == null) return '—';
  if (min == null) return `${max}${unit}`;
  if (max == null || min === max) return `${min}${unit}`;
  return `${min}–${max}${unit}`;
}

// ── Data fetch ────────────────────────────────────────────────────────────
async function fetchIntelligence(storeId, lang, countryCode) {
  try {
    return await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true, logo: true, color: true,
        averageDeliveryDaysMin: true, averageDeliveryDaysMax: true,
        freeShippingThreshold: true, returnWindowDays: true,
        freeReturns: true,
        refundProcessingDaysMin: true, refundProcessingDaysMax: true,
        offerFrequencyDays: true, lastVerifiedAt: true,
        translations: {
          where: { locale: lang },
          select: { name: true, slug: true, description: true },
        },
        intelligenceSections: {
          where: { locale: lang },
          orderBy: { order: 'asc' },
          include: {
            voucher: {
              include: {
                translations: { where: { locale: lang }, select: { title: true } },
                store: { include: { translations: { where: { locale: lang }, select: { name: true, slug: true } } } },
              },
            },
            promo: {
              include: {
                translations: { where: { locale: lang }, select: { title: true, description: true } },
                bank: { include: { translations: { where: { locale: lang }, select: { name: true } } } },
                store: { include: { translations: { where: { locale: lang }, select: { name: true } } } },
              },
            },
          },
        },
      },
    });
  } catch (e) {
    console.error('[StoreIntelligenceCard] fetch error:', e.message);
    return null;
  }
}

// ── Helper: render embedded voucher or promo ────────────────────────────
function EmbedBlock({ voucher, promo, locale }) {
  const lang = locale.split('-')[0];
  const isAr = lang === 'ar';

  if (voucher) {
    const t = voucher.translations?.[0] || {};
    const store = voucher.store;
    const storeName = store?.translations?.[0]?.name || '';
    return (
      <div className="sic-embed sic-embed--voucher">
        <div className="sic-embed__badge">
          <span className="material-symbols-sharp">confirmation_number</span>
          {isAr ? 'كود خصم' : 'Coupon Code'}
        </div>
        <div className="sic-embed__body">
          <div className="sic-embed__title">{t.title || (isAr ? 'عرض' : 'Offer')}</div>
          {voucher.discount && <div className="sic-embed__discount">{voucher.discount}</div>}
          {voucher.code && (
            <code className="sic-embed__code">{voucher.code}</code>
          )}
          {storeName && <div className="sic-embed__meta">{storeName}</div>}
        </div>
      </div>
    );
  }

  if (promo) {
    const t = promo.translations?.[0] || {};
    const bankName = promo.bank?.translations?.[0]?.name || '';
    return (
      <div className="sic-embed sic-embed--promo">
        <div className="sic-embed__badge">
          <span className="material-symbols-sharp">account_balance</span>
          {isAr ? 'عرض بنكي' : 'Bank Offer'}
        </div>
        <div className="sic-embed__body">
          <div className="sic-embed__title">{t.title || (isAr ? 'عرض بنكي' : 'Bank Offer')}</div>
          {bankName && <div className="sic-embed__meta">{bankName}</div>}
          {t.description && <div className="sic-embed__desc">{t.description}</div>}
          {(promo.discountPercent || promo.verifiedAvgPercent) && (
            <div className="sic-embed__discount">
              {isAr
                ? `خصم ${promo.verifiedAvgPercent ?? promo.discountPercent}٪`
                : `${promo.verifiedAvgPercent ?? promo.discountPercent}% off`}
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

// ── Section Renderer ──────────────────────────────────────────────────────
function Section({ section, locale, isHalf }) {
  const lang = locale.split('-')[0];
  const isAr = lang === 'ar';

  return (
    <div className={`sic-editorial__section ${isHalf ? 'sic-editorial__section--half' : 'sic-editorial__section--full'}`}>
      {section.title && <h3 className="sic-editorial__section-title">{section.title}</h3>}
      {section.image && (
        <div className="sic-editorial__section-image">
          <img src={section.image} alt={section.title || ''} />
        </div>
      )}
      {section.content && (
        <div
          className="sic-editorial__section-content"
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      )}
      {(section.voucher || section.promo) && (
        <div className="sic-editorial__section-embed">
          <EmbedBlock voucher={section.voucher} promo={section.promo} locale={locale} />
        </div>
      )}
      {section.linkUrl && (
        <a
          href={section.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sic-editorial__section-link"
        >
          {section.linkText || (isAr ? 'اقرأ المزيد →' : 'Read more →')}
        </a>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default async function StoreIntelligenceCard({
  storeId,
  locale = 'ar-SA',
  countryCode = 'SA',
}) {
  const lang = locale.split('-')[0];
  const isRtl = lang === 'ar';
  const isAr = isRtl;

  const store = await fetchIntelligence(storeId, lang, countryCode);
  if (!store) return null;

  const t = store.translations?.[0] || {};
  const storeName = t.name || '';

  // ── All sections sorted by order ──────────────────────────────────────
  const sections = (store.intelligenceSections || []).sort((a, b) => a.order - b.order);

  return (
    <div className="sic sic--editorial" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Store Header ────────────────────────────────────────────── */}
      <div className="sic-editorial__header">
        <div className="sic-editorial__eyebrow">
          <span className="material-symbols-sharp">auto_awesome</span>
          {isAr ? 'دليل التوفير' : 'Saving Guide'}
        </div>
        <h2 className="sic-editorial__title">
          {isAr ? `ما نعرفه عن ${storeName}` : `What to Expect from ${storeName}`}
          {store.logo && (
            <span className="sic-editorial__logo">
              <img src={store.logo} alt={storeName} />
            </span>
          )}
        </h2>
        {store.translations?.[0]?.description && (
          <p className="sic-editorial__subhead">{store.translations[0].description}</p>
        )}
      </div>

      {/* ── Dynamic Sections Grid (ordered, mixed widths) ────────────── */}
      {sections.length > 0 && (
        <div className="sic-editorial__sections">
          {sections.map((sec) => (
            <Section
              key={sec.id}
              section={sec}
              locale={locale}
              isHalf={sec.columnSpan === 1}
            />
          ))}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      {store.lastVerifiedAt && (
        <div className="sic-editorial__footer">
          <div className="sic-editorial__verified">
            <span className="material-symbols-sharp">verified_user</span>
            {isAr ? 'تم التحقق من البيانات' : 'Data verified'}
          </div>
          <span className="sic-editorial__date">
            {new Date(store.lastVerifiedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  );
}
