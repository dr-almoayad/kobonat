// app/api/og/route.js
// Generates open-graph images for store pages on the fly.
// Uses Next.js built-in ImageResponse (no extra packages required).
//
// Usage (already wired in generateStoreMetadata.js, but kept here for reference):
//   /api/og?store=Noon&logo=https://…/noon.png
//
// Falls back gracefully if the logo URL can't be fetched (network error, bad domain).

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const ACCENT  = '#470ae2';
const WHITE   = '#ffffff';
const SURFACE = '#f5f1ff';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeName = (searchParams.get('store') || 'Cobonat').slice(0, 60);
    const logoUrl   = searchParams.get('logo')  || '';
    const isAr      = searchParams.get('lang') === 'ar';

    const tagline = isAr
      ? 'أفضل الكوبونات والعروض'
      : 'Best Coupons & Deals';

    // Attempt to pre-fetch the logo so ImageResponse can embed it.
    // If it fails (remote domain not allowed, network issue, etc.) we skip it.
    let logoData: string | null = null;
    if (logoUrl) {
      try {
        const res = await fetch(logoUrl);
        if (res.ok) {
          const buf      = await res.arrayBuffer();
          const b64      = Buffer.from(buf).toString('base64');
          const mimeType = res.headers.get('content-type') || 'image/png';
          logoData       = `data:${mimeType};base64,${b64}`;
        }
      } catch {
        // logo unavailable — render without it
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            display:        'flex',
            flexDirection:  'column',
            width:          '100%',
            height:         '100%',
            background:     WHITE,
            position:       'relative',
            overflow:       'hidden',
          }}
        >
          {/* Purple accent bar at top */}
          <div
            style={{
              position:   'absolute',
              top:        0,
              left:       0,
              right:      0,
              height:     '8px',
              background: ACCENT,
            }}
          />

          {/* Background circle decoration */}
          <div
            style={{
              position:     'absolute',
              bottom:       '-120px',
              right:        '-120px',
              width:        '400px',
              height:       '400px',
              borderRadius: '50%',
              background:   SURFACE,
            }}
          />

          {/* Main content */}
          <div
            style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              flex:           1,
              padding:        '60px',
              gap:            '28px',
            }}
          >
            {/* Logo */}
            {logoData && (
              <div
                style={{
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  width:           '120px',
                  height:          '120px',
                  borderRadius:    '24px',
                  background:      WHITE,
                  boxShadow:       '0 4px 24px rgba(71,10,226,0.12)',
                  padding:         '16px',
                  overflow:        'hidden',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoData}
                  alt={storeName}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Store name */}
            <div
              style={{
                fontSize:    '56px',
                fontWeight:  800,
                color:       '#0f041c',
                textAlign:   'center',
                lineHeight:  1.15,
                maxWidth:    '800px',
              }}
            >
              {storeName}
            </div>

            {/* Tagline */}
            <div
              style={{
                fontSize:     '26px',
                fontWeight:   500,
                color:        '#64748b',
                textAlign:    'center',
              }}
            >
              {tagline}
            </div>

            {/* Cobonat brand badge */}
            <div
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '10px',
                background:   ACCENT,
                borderRadius: '50px',
                padding:      '10px 24px',
                marginTop:    '8px',
              }}
            >
              <div
                style={{
                  fontSize:   '22px',
                  fontWeight: 700,
                  color:      WHITE,
                }}
              >
                {isAr ? 'كوبونات' : 'Cobonat'}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width:  1200,
        height: 630,
      }
    );
  } catch (err) {
    // Never let OG generation crash the rest of the site
    console.error('[/api/og]', err);
    return new Response('Failed to generate image', { status: 500 });
  }
}
