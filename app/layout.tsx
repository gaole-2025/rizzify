import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { DevControlsProvider, DevToolbar } from "@/components/dev/DevToolbar";
import AuthProvider from "@/src/components/AuthProvider";
import AuthGuard from "@/components/AuthGuard";
import DisableZoom from "@/components/DisableZoom";

// 🚀 优化：移除 Google Fonts，改为系统字体以加快构建速度
// const caveat = Caveat({
//   weight: ["600", "700"],
//   subsets: ["latin"],
//   variable: "--font-caveat",
// });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Rizzify - AI Dating Photos That Get Matches | Tinder, Bumble, Hinge",
  description:
    "Get 20-50 magazine-style AI dating photos tuned for Tinder, Bumble, and Hinge. Typically 5-10 min delivery. Looks like you. One free rerun.",
  keywords:
    "AI dating photos, Tinder photos, Bumble photos, Hinge photos, dating profile pictures, AI headshots, professional dating photos",
  authors: [{ name: "Rizzify" }],
  creator: "Rizzify",
  publisher: "Rizzify",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://rizzify.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Rizzify - AI Dating Photos for Tinder, Bumble & Hinge",
    description:
      "Get 20-50 AI dating photos tuned for Tinder, Bumble, and Hinge. Usually ready in 10-15 minutes.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://rizzify.com",
    siteName: "Rizzify",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Rizzify AI Dating Photos",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rizzify - AI Dating Photos That Get Matches",
    description:
      "Get 20-50 magazine-style AI dating photos for Tinder, Bumble & Hinge. 5-10 min delivery.",
    images: ["/og-image.jpg"],
    creator: "@rizzify",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-key",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          data-domain="rizzify.org"
          src="https://stats.rizzify.org/js/script.js"
        />
        <Script
          id="pre-hydration-cleanup"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: "(function(){function c(){try{var n=document.getElementById('video-roll-root-mask');if(n){n.removeAttribute('id')}}catch(e){}}c();try{var o=new MutationObserver(function(m){for(var i=0;i<m.length;i++){var t=m[i];if(t.type==='attributes'&&t.attributeName==='id'){var el=t.target;if(el&&el.id==='video-roll-root-mask'){el.removeAttribute('id')}}if(t.type==='childList'){c()}}});o.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['id']});setTimeout(function(){o.disconnect()},2000)}catch(e){}})();",
          }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        {/* Microsoft Clarity */}
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "tw3wgy2hcb");
            `,
          }}
        />
        
        <DisableZoom />
        <AuthProvider>
          <AuthGuard>
            <DevControlsProvider>
              {children}
              <DevToolbar />
            </DevControlsProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
