import { BeforeAfterImages, AvatarImages } from "./image-urls";

export interface BeforeAfterImage {
  before: string;
  after: string;
  alt: string;
  category: "realistic" | "artistic" | "glam";
}

export interface StylePack {
  id: string;
  name: string;
  category: "film" | "street" | "sunlit" | "cozy" | "gym" | "bw";
  image: string;
  alt: string;
  description: string;
}

export interface Testimonial {
  name: string;
  age: number;
  location: string;
  rating: number;
  text: string;
  avatar: string;
  matches: number;
}

export interface FAQ {
  question: string;
  answer: string;
}

export const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    alt: "Professional dating photo example 1",
  },
  {
    src: "https://images.unsplash.com/photo-1494790108755-2616b612c6fd?w=400&q=80",
    alt: "Professional dating photo example 2",
  },
  {
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    alt: "Professional dating photo example 3",
  },
  {
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
    alt: "Professional dating photo example 4",
  },
];

export const beforeAfterCases: BeforeAfterImage[] = [
  {
    before: BeforeAfterImages.getBefore("before-1.webp"),
    after: BeforeAfterImages.getAfter("after-1.webp"),
    alt: "Professional business transformation",
    category: "realistic",
  },
  {
    before: BeforeAfterImages.getBefore("before-2.webp"),
    after: BeforeAfterImages.getAfter("after-2.webp"),
    alt: "Stylish professional transformation",
    category: "artistic",
  },
  {
    before: BeforeAfterImages.getBefore("before-3.webp"),
    after: BeforeAfterImages.getAfter("after-3.webp"),
    alt: "Cinematic portrait transformation",
    category: "glam",
  },
  {
    before: BeforeAfterImages.getBefore("before-4.webp"),
    after: BeforeAfterImages.getAfter("after-4.webp"),
    alt: "Professional portrait transformation",
    category: "realistic",
  },
  {
    before: BeforeAfterImages.getBefore("before-5.webp"),
    after: BeforeAfterImages.getAfter("after-5.webp"),
    alt: "Artistic style transformation",
    category: "artistic",
  },
  {
    before: BeforeAfterImages.getBefore("before-6.webp"),
    after: BeforeAfterImages.getAfter("after-6.webp"),
    alt: "Glamour portrait transformation",
    category: "glam",
  },
];

export const stylePacks: StylePack[] = [
  {
    id: "film-noir",
    name: "Film Noir",
    category: "film",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    alt: "Film noir style portrait",
    description: "Dramatic shadows and classic cinema vibes",
  },
  {
    id: "street-casual",
    name: "Street Casual",
    category: "street",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80",
    alt: "Street style casual portrait",
    description: "Relaxed urban photography style",
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    category: "sunlit",
    image:
      "https://images.unsplash.com/photo-1494790108755-2616b612c6fd?w=300&q=80",
    alt: "Golden hour sunlit portrait",
    description: "Warm natural lighting that flatters",
  },
  {
    id: "cozy-indoor",
    name: "Cozy Indoor",
    category: "cozy",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
    alt: "Cozy indoor portrait",
    description: "Intimate and approachable atmosphere",
  },
  {
    id: "fitness-gym",
    name: "Fitness",
    category: "gym",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80",
    alt: "Fitness gym portrait",
    description: "Athletic and confident energy",
  },
  {
    id: "monochrome",
    name: "B&W Classic",
    category: "bw",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80&sat=-100",
    alt: "Black and white portrait",
    description: "Timeless monochrome elegance",
  },
];

// lib/data.ts 中的部分：Testimonials（合规版，4 个典型场景）
export const testimonials = [
  {
    name: "Mia",
    age: 27,
    location: "London",
    platform: "Tinder",
    rating: 5,
    text: "Uploaded one photo at lunch—had a new profile by evening.",
    avatar: AvatarImages.get("mia.webp"),
    date: "2025/08",
  },
  {
    name: "Leo",
    age: 29,
    location: "Berlin",
    platform: "Bumble",
    rating: 5,
    text: "I'm not photogenic, but one upload gave me photos that look like my best self.",
    avatar: AvatarImages.get("leo.webp"),
    date: "2025/08",
  },
  {
    name: "Ava",
    age: 26,
    location: "New York",
    platform: "Hinge",
    rating: 5,
    text: "After updating with Rizzify, more people actually start conversations.",
    avatar: AvatarImages.get("ava.webp"),
    date: "2025/08",
  },
  {
    name: "Ken",
    age: 31,
    location: "Singapore",
    platform: "Raya",
    rating: 4,
    text: "New city, new profile - one upload gave me a set I'm proud to use.",
    avatar: AvatarImages.get("ken.webp"),
    date: "2025/08",
  },
];

// lib/data.ts 里替换/新增
export const faqData: { question: string; answer: string }[] = [
  {
    question: "What do I need to start?",
    answer:
      "Sign in with Google and upload one clear, front-facing photo (good lighting, no heavy filters). That’s it.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. The Free plan gives 2 preview photos (watermarked, up to 1024px). One free try per account every 24 hours.",
  },
  {
    question: "How long does it take?",
    answer: "Typical delivery is 10–15 minutes, depending on the queue. ",
  },
  {
    question: "What's included in each paid plan?",
    answer:
      "Starter ($9.99): 20 HD photos. Pro ($19.99): 50 HD photos. Both export up to 2048px (JPG/PNG) for easy platform upload.",
  },
  {
    question: "What does “HD” mean here?",
    answer:
      "Final images up to 2048px on the long side with high-quality compression (sRGB, no EXIF). Ideal for Tinder, Bumble, and Hinge uploads.",
  },
  {
    question: "Can I choose styles?",
    answer:
      "We use a random mix from 45 styles to keep your set diverse and avoid decision fatigue.",
  },
  {
    question: "Can I use the photos on Tinder/Bumble/Hinge?",
    answer:
      "Yes. We export standard JPG/PNG; you can crop inside each app as needed. Rizzify isn’t affiliated with Tinder, Bumble, or Hinge.",
  },
  {
    question: "Do I own the photos and how can I use them?",
    answer:
      "You get a personal-use license for your profiles and social media. Commercial ads, endorsements, or resale aren’t allowed without permission.",
  },
  {
    question: "Privacy, deletion, refunds?",
    answer:
      "Uploads/outputs are stored to process and let you download/replace; you can delete them anytime in your dashboard. We may auto-delete after 30 days. Refunds aren’t available once generation starts;",
  },
];

export const pricingFeatures = [
  {
    feature: "Delivery time",
    basic: "5-15 minutes",
    competitor: "24-48 hours",
  },
  {
    feature: "Photos needed",
    basic: "10-20 uploads",
    competitor: "30+ uploads",
  },
  {
    feature: "Looks like you",
    basic: true,
    competitor: "Sometimes",
  },
  {
    feature: "Dating app friendly",
    basic: true,
    competitor: false,
  },
  {
    feature: "Trains on your photos",
    basic: false,
    competitor: true,
  },
  {
    feature: "Refund/rerun",
    basic: "Free rerun + 30d refund",
    competitor: "No refunds",
  },
  {
    feature: "Watermarks",
    basic: false,
    competitor: true,
  },
  {
    feature: "Commercial use",
    basic: "Personal only",
    competitor: "Personal only",
  },
];
