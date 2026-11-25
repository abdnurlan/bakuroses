import Script from 'next/script';

const META_PIXEL_ID = '29846141741676110';

// Meta (Facebook) Pixel. Public site only — rendered from the [locale] layout so
// admin sessions are not tracked. lazyOnload for the same reason as gtag in
// RootDocument: fbevents.js is heavy and should not compete with hydration; the
// fbq stub queues calls until it arrives. The pixel tracks client-side (history
// API) navigations as PageView on its own, so no route listener is needed.
export function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="lazyOnload">{`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${META_PIXEL_ID}');
        fbq('track', 'PageView');
      `}</Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
