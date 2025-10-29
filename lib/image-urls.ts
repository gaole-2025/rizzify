/**
 * 图片URL管理系统 - 支持本地和R2双模式
 * 在迁移过程中可以动态切换图片源
 */

// 环境变量和配置
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const USE_R2_IMAGES =
  process.env.NEXT_PUBLIC_USE_R2_IMAGES === "true" ||
  process.env.USE_R2_IMAGES === "true";
const R2_STATIC_DOMAIN =
  process.env.NEXT_PUBLIC_CLOUDFLARE_R2_STATIC_DOMAIN ||
  process.env.CLOUDFLARE_R2_STATIC_DOMAIN ||
  "https://rizzify.org";
const R2_USER_DATA_DOMAIN =
  process.env.NEXT_PUBLIC_CLOUDFLARE_R2_USER_DATA_DOMAIN ||
  process.env.CLOUDFLARE_R2_USER_DATA_DOMAIN ||
  "https://rizzify.org";

// 图片源模式
export type ImageSource = "local" | "r2";

// 图片类别配置
interface ImageConfig {
  local: string;
  r2: string;
}

// 图片路径配置映射
const IMAGE_PATHS: Record<string, ImageConfig> = {
  // 登录背景图片
  login: {
    local: "/images/login/",
    r2: "/ui/login/",
  },

  // Before/After 对比图片
  beforeAfterBefore: {
    local: "/images/",
    r2: "/ui/before-after/before/",
  },

  beforeAfterAfter: {
    local: "/images/",
    r2: "/ui/before-after/after/",
  },

  // 滚动画廊图片
  gallery: {
    local: "/images/roll/",
    r2: "/ui/gallery/",
  },

  // 示例图片（好的示例）
  examples: {
    local: "/images/head/",
    r2: "/ui/examples/",
  },

  // 避免示例图片
  avoid: {
    local: "/images/inner/",
    r2: "/ui/avoid/",
  },

  // 用户头像
  avatars: {
    local: "/avatars/",
    r2: "/ui/avatars/",
  },

  // 用户生成内容
  userGenerated: {
    local: "/generated/",
    r2: "/generated/",
  },

  // 用户上传内容
  userUploads: {
    local: "/uploads/",
    r2: "/uploads/",
  },
};

/**
 * 获取图片的完整URL
 * @param category 图片类别
 * @param filename 文件名
 * @param source 图片源 ('local' | 'r2' | 'auto')
 * @returns 完整的图片URL
 */
export function getImageUrl(
  category: keyof typeof IMAGE_PATHS,
  filename: string,
  source: ImageSource | "auto" = "auto",
): string {
  // 自动选择源
  if (source === "auto") {
    // 优先使用 R2，除非明确配置为本地模式
    source = USE_R2_IMAGES || IS_PRODUCTION ? "r2" : "r2"; // 默认使用 R2
  }

  const config = IMAGE_PATHS[category];
  if (!config) {
    console.warn(`Unknown image category: ${category}`);
    return filename;
  }

  if (source === "r2") {
    // R2 静态资源
    if (category.startsWith("user")) {
      return `${R2_USER_DATA_DOMAIN}${config.r2}${filename}`;
    } else {
      return `${R2_STATIC_DOMAIN}${config.r2}${filename}`;
    }
  } else {
    // 本地静态资源
    return `${config.local}${filename}`;
  }
}

/**
 * 登录背景图片URLs
 */
export const LoginImages = {
  get: (filename: string, source?: ImageSource | "auto") =>
    getImageUrl("login", filename, source),

  // 预定义的登录背景图片列表
  list: [
    "04cd87b5-3984-474e-b5fc-bf887b582e79.webp",
    "2196af43-a96f-405a-9583-3836689dd4b7.webp",
    "250faa09-869b-4a80-9dc8-6af96ce50289.webp",
    "307e7ac4-6243-41d8-a274-6ab183ac9ed5.webp",
    "32d6769d-2fa6-428f-85cd-0b2a06deaf3f.webp",
    "485371d5-83c1-4b25-88df-cf4c83526b77.webp",
    "4efc606f-7134-413c-b3c2-529d17b4c33a.webp",
    "52338a67-1537-4d8e-a034-be7eff39a2d6.webp",
    "53cb1870-7473-42da-a2d3-cc9a5e818167.webp",
    "56fb29c7-ae2b-4486-a3dc-e45549affaed.webp",
    "5b3d9961-083c-47a1-bae3-21cb5983f0a3.webp",
    "734e129e-9b96-4d5b-8010-47f0fc9563b7.webp",
    "76905624-8457-4492-81fa-57494fa46f8f.webp",
    "7f1baf4e-fa5f-4332-9b51-6208172302b6.webp",
    "8d817704-6629-4340-be95-88e9e01b3ca2.webp",
    "918e4124-6722-47e0-9bea-449042b7ae26.webp",
    "a430ce82-d962-4c11-87c4-72042ba40059.webp",
    "a957515d-cc11-4913-bfc9-69fa28fd92a7.webp",
    "c76a6c17-bde8-4335-a9f5-fa89adbfe04a.webp",
    "dfdc3f9c-ae8f-4ec8-becb-36f3504d80a8.webp",
    "e3ef1eb3-dc9e-4aab-955a-51a16fa40d1c.webp",
    "e8247091-8e82-46bf-aff5-b5b9219b7beb.webp",
    "f1a7c046-9761-40d4-974d-3897eb2a394b.webp",
    "fd48717a-ca5a-4536-ad95-133985313b96.webp",
    "uploads_generated_2025_09_27_1f7c58a2-7fd3-424b-ad4a-aa55897fa6fb.webp",
    "uploads_generated_2025_09_27_21f55b1b-fc06-4706-bf5b-30a82bea26ad.webp",
    "uploads_generated_2025_09_27_5670f8cb-6113-45fb-ad08-a3f677f998b8.webp",
    "uploads_generated_2025_09_27_5cb741fb-879a-4e81-8369-fe364d59def6.webp",
    "uploads_generated_2025_09_27_5fb1d894-f8cc-4f71-a7c2-60222ebda1ec.webp",
    "uploads_generated_2025_09_27_76754fe7-2102-46eb-bee3-652dfaeab758.webp",
    "uploads_generated_2025_09_27_961c7cec-d01e-4a60-9340-f29fa6e79046.webp",
    "uploads_generated_2025_09_27_b7492ef5-8b03-4016-b4b0-10c16d245233.webp",
    "uploads_generated_2025_09_27_d116f05a-6fa7-42eb-bf0b-813db77d78fd.webp",
    "uploads_generated_2025_09_27_dc85c001-8b57-4fda-9f47-3d73bad8e4ed.webp",
  ],

  // 获取所有URL
  getAll: (source?: ImageSource | "auto") =>
    LoginImages.list.map((filename) => LoginImages.get(filename, source)),
};

/**
 * Before/After 对比图片URLs
 */
export const BeforeAfterImages = {
  getBefore: (filename: string, source?: ImageSource | "auto") =>
    getImageUrl("beforeAfterBefore", filename, source),

  getAfter: (filename: string, source?: ImageSource | "auto") =>
    getImageUrl("beforeAfterAfter", filename, source),

  // 预定义的对比图片对
  pairs: [
    { before: "before-1.webp", after: "after-1.webp" },
    { before: "before-2.webp", after: "after-2.webp" },
    { before: "before-3.webp", after: "after-3.webp" },
    { before: "before-4.webp", after: "after-4.webp" },
    { before: "before-5.webp", after: "after-5.webp" },
    { before: "before-6.webp", after: "after-6.webp" },
  ],

  // 获取对比图片对
  getPair: (index: number, source?: ImageSource | "auto") => {
    const pair = BeforeAfterImages.pairs[index];
    if (!pair) return null;

    return {
      before: BeforeAfterImages.getBefore(pair.before, source),
      after: BeforeAfterImages.getAfter(pair.after, source),
    };
  },

  // 获取所有对比图片对
  getAllPairs: (source?: ImageSource | "auto") =>
    BeforeAfterImages.pairs
      .map((_, index) => BeforeAfterImages.getPair(index, source))
      .filter(Boolean),
};

/**
 * 滚动画廊图片URLs
 */
export const GalleryImages = {
  get: (filename: string, source?: ImageSource | "auto") =>
    getImageUrl("gallery", filename, source),

  // 画廊图片列表（与登录背景相同的WebP文件）
  list: LoginImages.list,

  // 获取所有画廊URL
  getAll: (source?: ImageSource | "auto") =>
    GalleryImages.list.map((filename) => GalleryImages.get(filename, source)),
};

/**
 * 示例图片URLs（好的示例）
 */
export const ExampleImages = {
  get: (filename: string, source?: ImageSource | "auto") =>
    getImageUrl("examples", filename, source),

  // 理想示例图片列表
  idealList: [
    "1.png",
    "istockphoto-2156062809-612x612.webp",
    "istockphoto-2174363314-612x612.webp",
    "istockphoto-2218333130-612x612.webp",
    "photo-1556157382-97eda2d62296.webg.webp",
    "photo-1633332755192-727a05c4013d.webp",
    "premium_photo-1689747698547-271d2d553cee.webp",
    "premium_photo-1691784778805-e1067ac42e01.webp",
  ],

  // 获取理想示例URLs
  getIdealExamples: (source?: ImageSource | "auto") =>
    ExampleImages.idealList.map((filename) =>
      ExampleImages.get(filename, source),
    ),
};

/**
 * 避免示例图片URLs
 */
export const AvoidImages = {
  get: (filename: string, source?: ImageSource | "auto") =>
    getImageUrl("avoid", filename, source),

  // 应该避免的示例图片列表
  list: [
    "mahdi-bafande-4xVlmURVMHc-unsplash.webp",
    "md-mahdi-oGlPMRb63uA-unsplash.webp",
    "pexels-kampus-5935247 (1).webp",
    "ui_avoid_noone.webp",
  ],

  // 获取避免示例URLs
  getAvoidExamples: (source?: ImageSource | "auto") =>
    AvoidImages.list.map((filename) => AvoidImages.get(filename, source)),
};

/**
 * 用户头像URLs
 */
export const AvatarImages = {
  get: (filename: string, source?: ImageSource | "auto") =>
    getImageUrl("avatars", filename, source),

  // 预定义头像列表
  list: ["mia.webp", "leo.webp", "ava.webp", "ken.webp"],

  // 获取所有头像URLs
  getAll: (source?: ImageSource | "auto") =>
    AvatarImages.list.map((filename) => AvatarImages.get(filename, source)),
};

/**
 * 用户生成内容URLs
 */
export const UserGeneratedImages = {
  get: (taskId: string, filename: string, source?: ImageSource | "auto") =>
    getImageUrl("userGenerated", `${taskId}/${filename}`, source),

  getByTask:
    (taskId: string, source?: ImageSource | "auto") => (filename: string) =>
      UserGeneratedImages.get(taskId, filename, source),
};

/**
 * 用户上传内容URLs
 */
export const UserUploadImages = {
  get: (userId: string, filename: string, source?: ImageSource | "auto") =>
    getImageUrl("userUploads", `${userId}/${filename}`, source),

  getByUser:
    (userId: string, source?: ImageSource | "auto") => (filename: string) =>
      UserUploadImages.get(userId, filename, source),
};

/**
 * 便捷的图片URL获取函数（向后兼容）
 */
export const IMAGE_URLS = {
  login: LoginImages.get,
  gallery: GalleryImages.get,
  beforeAfter: {
    before: BeforeAfterImages.getBefore,
    after: BeforeAfterImages.getAfter,
  },
  examples: ExampleImages.get,
  avoid: AvoidImages.get,
  avatars: AvatarImages.get,
  userGenerated: UserGeneratedImages.get,
  userUploads: UserUploadImages.get,
};

/**
 * 获取当前使用的图片源
 */
export function getCurrentImageSource(): ImageSource {
  return USE_R2_IMAGES || IS_PRODUCTION ? "r2" : "local";
}

/**
 * 检查是否使用R2图片
 */
export function isUsingR2Images(): boolean {
  return getCurrentImageSource() === "r2";
}

/**
 * 调试信息
 */
export function getImageSourceInfo() {
  return {
    source: getCurrentImageSource(),
    isProduction: IS_PRODUCTION,
    useR2Images: USE_R2_IMAGES,
    r2StaticDomain: R2_STATIC_DOMAIN,
    r2UserDataDomain: R2_USER_DATA_DOMAIN,
  };
}

// 默认导出
export default {
  LoginImages,
  BeforeAfterImages,
  GalleryImages,
  ExampleImages,
  AvoidImages,
  AvatarImages,
  UserGeneratedImages,
  UserUploadImages,
  IMAGE_URLS,
  getImageUrl,
  getCurrentImageSource,
  isUsingR2Images,
  getImageSourceInfo,
};
