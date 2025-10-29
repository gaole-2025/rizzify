import Hero from '@/components/Hero'
import BeforeAfter from '@/components/BeforeAfter'
import PlatformScroll from '@/components/PlatformScroll'
import RollingGallery from '@/components/RollingGallery'
import Testimonials from '@/components/Testimonials'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function HomePage() {
  // Product JSON-LD structured data
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Rizzify AI Dating Photos",
    "description": "AI-powered dating photos that get 3x more matches on Tinder, Bumble, and Hinge. 40-80 professional photos delivered in 5-15 minutes.",
    "brand": {
      "@type": "Brand",
      "name": "Rizzify"
    },
    "offers": {
      "@type": "Offer",
      "price": "29",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://rizzify.com/start"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "10000",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Alex"
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "reviewBody": "Got 3x more matches in the first week. The photos look exactly like me but way more professional."
      }
    ]
  }

  // Service JSON-LD
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "AI Dating Photo Generation",
    "description": "Professional AI-generated dating photos for Tinder, Bumble, and Hinge profiles",
    "provider": {
      "@type": "Organization",
      "name": "Rizzify",
      "url": "https://rizzify.com"
    },
    "areaServed": "Worldwide",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Dating Photo Packages",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "AI Dating Photo Package"
          },
          "price": "29",
          "priceCurrency": "USD"
        }
      ]
    }
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <SiteHeader />

      <main>
        <Hero />
        <div id="compare">
          <BeforeAfter />
        </div>
        <PlatformScroll />
        <RollingGallery />
        <Testimonials />
        <div id="pricing">
          <Pricing />
        </div>
        <div id="faq">
          <FAQ />
        </div>
      </main>

      <SiteFooter />
    </>
  )
}