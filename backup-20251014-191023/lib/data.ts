export interface BeforeAfterImage {
  before: string
  after: string
  alt: string
  category: 'realistic' | 'artistic' | 'glam'
}

export interface StylePack {
  id: string
  name: string
  category: 'film' | 'street' | 'sunlit' | 'cozy' | 'gym' | 'bw'
  image: string
  alt: string
  description: string
}

export interface Testimonial {
  name: string
  age: number
  location: string
  rating: number
  text: string
  avatar: string
  matches: number
}

export interface FAQ {
  question: string
  answer: string
}

export const heroImages = [
  {
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    alt: 'Professional dating photo example 1',
  },
  {
    src: 'https://images.unsplash.com/photo-1494790108755-2616b612c6fd?w=400&q=80',
    alt: 'Professional dating photo example 2',
  },
  {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    alt: 'Professional dating photo example 3',
  },
  {
    src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    alt: 'Professional dating photo example 4',
  },
]

export const beforeAfterCases: BeforeAfterImage[] = [
  {
    before: '/images/before-1.webp',
    after: '/images/after-1.webp',
    alt: 'Professional business transformation',
    category: 'realistic'
  },
  {
    before: '/images/before-2.webp',
    after: '/images/after-2.webp',
    alt: 'Stylish professional transformation',
    category: 'artistic'
  },
  {
    before: '/images/before-3.webp',
    after: '/images/after-3.webp',
    alt: 'Cinematic portrait transformation',
    category: 'glam'
  },
  {
    before: '/images/before-4.webp',
    after: '/images/after-4.webp',
    alt: 'Professional portrait transformation',
    category: 'realistic'
  },
  {
    before: '/images/before-5.webp',
    after: '/images/after-5.webp',
    alt: 'Artistic style transformation',
    category: 'artistic'
  },
  {
    before: '/images/before-6.webp',
    after: '/images/after-6.webp',
    alt: 'Glamour portrait transformation',
    category: 'glam'
  },
]

export const stylePacks: StylePack[] = [
  {
    id: 'film-noir',
    name: 'Film Noir',
    category: 'film',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
    alt: 'Film noir style portrait',
    description: 'Dramatic shadows and classic cinema vibes'
  },
  {
    id: 'street-casual',
    name: 'Street Casual',
    category: 'street',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80',
    alt: 'Street style casual portrait',
    description: 'Relaxed urban photography style'
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    category: 'sunlit',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612c6fd?w=300&q=80',
    alt: 'Golden hour sunlit portrait',
    description: 'Warm natural lighting that flatters'
  },
  {
    id: 'cozy-indoor',
    name: 'Cozy Indoor',
    category: 'cozy',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80',
    alt: 'Cozy indoor portrait',
    description: 'Intimate and approachable atmosphere'
  },
  {
    id: 'fitness-gym',
    name: 'Fitness',
    category: 'gym',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80',
    alt: 'Fitness gym portrait',
    description: 'Athletic and confident energy'
  },
  {
    id: 'monochrome',
    name: 'B&W Classic',
    category: 'bw',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80&sat=-100',
    alt: 'Black and white portrait',
    description: 'Timeless monochrome elegance'
  },
]

// lib/data.ts 中的部分：Testimonials（合规版，4 个典型场景）
export const testimonials = [
  {
    name: 'Mia', age: 27, location: 'London', platform: 'Tinder', rating: 5,
    text: 'Uploaded one photo at lunch—had a new profile by evening.',
    avatar: '/avatars/mia.jpg',
    date: '2025/08'
  },
  {
    name: 'Leo', age: 29, location: 'Berlin', platform: 'Bumble', rating: 5,
    text: "I’m not photogenic, but one upload gave me photos that look like my best self.",
    avatar: '/avatars/leo.jpg',
    date: '2025/08'
  },
  {
    name: 'Ava', age: 26, location: 'New York', platform: 'Hinge', rating: 5,
    text: 'After updating with Rizzify, more people actually start conversations.',
    avatar: '/avatars/ava.jpg',
    date: '2025/08'
  },
  {
    name: 'Ken', age: 31, location: 'Singapore', platform: 'Raya', rating: 4,
    text: 'New city, new profile—one upload gave me a set I’m proud to use.',
    avatar: '/avatars/ken.jpg',
    date: '2025/08'
  }
]

// lib/data.ts 里替换/新增
export const faqData: { question: string; answer: string }[] = [
  {
    question: "What do I need to start?",
    answer:
      "Sign in with Google and upload one clear, front-facing photo (good lighting, no heavy filters). That’s it."
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. The Free plan gives 2 preview photos (watermarked, up to 1024px). One free try per account every 24 hours."
  },
  {
    question: "How long does it take?",
    answer:
      "Typical delivery is 30–40 minutes, depending on the queue. Add Priority Queue ($2.99) for ~10–15 minutes when available (not guaranteed)."
  },
  {
    question: "What’s included in each paid plan?",
    answer:
      "Starter ($9.99): 20 HD photos. Complete ($19.99): 50 HD photos. Both export up to 2048px (JPG/PNG) for easy platform upload."
  },
  {
    question: "What does “HD” mean here?",
    answer:
      "Final images up to 2048px on the long side with high-quality compression (sRGB, no EXIF). Ideal for Tinder, Bumble, and Hinge uploads."
  },
  {
    question: "Can I choose styles?",
    answer:
      "We use a random mix from 45 styles to keep your set diverse and avoid decision fatigue."
  },
  {
    question: "What if I don’t like some photos?",
    answer:
      "Paid plans include one batch replacement within 24 hours: Starter can replace up to 6 photos; Complete up to 12. We regenerate with fresh styles/variants."
  },
  {
    question: "Can I use the photos on Tinder/Bumble/Hinge?",
    answer:
      "Yes. We export standard JPG/PNG; you can crop inside each app as needed. Rizzify isn’t affiliated with Tinder, Bumble, or Hinge."
  },
  {
    question: "Do I own the photos and how can I use them?",
    answer:
      "You get a personal-use license for your profiles and social media. Commercial ads, endorsements, or resale aren’t allowed without permission."
  },
  {
    question: "Privacy, deletion, refunds?",
    answer:
      "Uploads/outputs are stored to process and let you download/replace; you can delete them anytime in your dashboard. We may auto-delete after 30 days. Refunds aren’t available once generation starts; Priority can be added only before processing begins."
  }
];


export const pricingFeatures = [
  {
    feature: 'Delivery time',
    basic: '5-15 minutes',
    competitor: '24-48 hours'
  },
  {
    feature: 'Photos needed',
    basic: '10-20 uploads',
    competitor: '30+ uploads'
  },
  {
    feature: 'Looks like you',
    basic: true,
    competitor: 'Sometimes'
  },
  {
    feature: 'Dating app friendly',
    basic: true,
    competitor: false
  },
  {
    feature: 'Trains on your photos',
    basic: false,
    competitor: true
  },
  {
    feature: 'Refund/rerun',
    basic: 'Free rerun + 30d refund',
    competitor: 'No refunds'
  },
  {
    feature: 'Watermarks',
    basic: false,
    competitor: true
  },
  {
    feature: 'Commercial use',
    basic: 'Personal only',
    competitor: 'Personal only'
  },
]