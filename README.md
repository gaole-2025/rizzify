# Rizzify - AI Dating Photos Landing Page

A high-converting Next.js landing page for AI-generated dating photos, optimized for Tinder, Bumble, and Hinge users.

## Features

- **Responsive Design**: Works perfectly on all devices
- **High Performance**: Optimized images, lazy loading, minimal CLS
- **SEO Optimized**: JSON-LD structured data, meta tags, sitemap
- **Modern UI**: Tailwind CSS with custom design tokens
- **Interactive Components**: Before/after slider, horizontal scrolling galleries
- **Accessibility**: Keyboard navigation, screen reader friendly
- **Fast Loading**: Next.js 14, optimized images, preloading

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Images**: Next.js Image component with AVIF/WebP
- **TypeScript**: Full type safety
- **Performance**: Optimized for Core Web Vitals

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## Sections

1. **Hero**: Magazine-style portraits with trust indicators
2. **Before/After**: Interactive comparison slider with style tabs
3. **Style Packs**: Horizontal scrolling gallery with filters
4. **Testimonials**: Social proof with ratings and match counts
5. **Pricing**: Feature comparison table with competitors
6. **FAQ**: Collapsible questions with JSON-LD structured data

## Configuration

### Image Sources

To use your own R2/CDN images, update the `remotePatterns` in `next.config.js`:

```js
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'your-r2-domain.r2.dev',
    port: '',
    pathname: '/**',
  },
]
```

And update the image URLs in `lib/data.ts`.

### Design Tokens

Customize colors in `tailwind.config.ts`:

```js
colors: {
  dark: '#0D0D0F',      // Background
  light: '#EDEBE6',     // Text
  accent: '#A67F5A',    // Brand accent
  blue: '#6CA3FF',      // CTA blue
}
```

### Content

All content is centralized in `lib/data.ts`:
- Hero images
- Before/after cases
- Style packs
- Testimonials
- FAQ items
- Pricing features

## Performance Features

- **Image Optimization**: AVIF/WebP formats, responsive sizing
- **Lazy Loading**: Images load as they enter viewport
- **Preloading**: Critical resources loaded first
- **Code Splitting**: Components loaded as needed
- **Minimal JavaScript**: Lightweight animations only
- **CSS Optimization**: Tailwind purged for production

## SEO Features

- **Structured Data**: Product, Service, and FAQ schemas
- **Meta Tags**: OpenGraph, Twitter Cards
- **Semantic HTML**: Proper heading structure
- **Sitemap**: Auto-generated XML sitemap
- **Robots.txt**: Search engine directives

## Deployment

### Vercel (Recommended)

```bash
pnpm build
```

Deploy to Vercel with zero configuration.

### Other Platforms

```bash
pnpm build
pnpm start
```

## Customization

### Adding New Style Packs

1. Add images to your CDN
2. Update `stylePacks` array in `lib/data.ts`
3. Add new category to filter types if needed

### Modifying Before/After

1. Add new cases to `beforeAfterCases` in `lib/data.ts`
2. Update categories as needed
3. Images auto-load based on category selection

### Custom Components

All components are in `/components` and fully customizable:

- `Hero.tsx` - Main hero section
- `BeforeAfter.tsx` - Comparison slider
- `StylePacks.tsx` - Gallery with filters
- `Testimonials.tsx` - Social proof section
- `Pricing.tsx` - Comparison table
- `FAQ.tsx` - Collapsible questions
- `OptimizedImage.tsx` - Image wrapper with LQIP

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## License

MIT License - see LICENSE file for details.