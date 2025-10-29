'use client'

import { useEffect, useRef } from 'react'
import Hero from '@/components/Hero'
import BeforeAfter from '@/components/BeforeAfter'
import PlatformScroll from '@/components/PlatformScroll'
import RollingGallery from '@/components/RollingGallery'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { analytics } from '@/src/lib/analytics'

export default function HomePage() {
  const pageViewTrackedRef = useRef(false)
  
  // 📊 埋点：页面浏览（只追踪一次）
  useEffect(() => {
    if (!pageViewTrackedRef.current) {
      pageViewTrackedRef.current = true
      analytics.pageView('/')
    }
  }, [])

  // Product JSON-LD structured data
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Rizzify AI Dating Photos",
    "description": "AI-powered dating photos for Tinder, Bumble, and Hinge profiles",
    "brand": {
      "@type": "Brand",
      "name": "Rizzify"
    },
    "offers": {
      "@type": "Offer",
      "price": "9.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://rizzify.com/start"
    }
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
          "price": "9.99",
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
        <div id="styles">
          <RollingGallery />
        </div>
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