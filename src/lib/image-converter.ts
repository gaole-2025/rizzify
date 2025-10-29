/**
 * 图片转换工具 - 将 URL 转换为 Base64
 */

const fetch = globalThis.fetch;

/**
 * 从 URL 下载图片并转换为 Base64
 */
export async function urlToBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`[ImageConverter] Converting image to Base64: ${imageUrl.substring(0, 50)}...`);
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    console.log(`[ImageConverter] ✅ Converted to Base64 (${base64.length} chars)`);
    return base64;
  } catch (error) {
    console.error(`[ImageConverter] ❌ Failed to convert image:`, error);
    throw error;
  }
}
