import { apicoreClient, GenerationRequest } from './apicore-client';
import { imageManager } from './image-manager';

// Use native fetch in Node.js 18+
const fetch = globalThis.fetch;

export interface BeautifyResult {
  r2ObjectKey: string;
  imageUrl: string;
  sizeBytes: number;
}

class BeautifyProcessor {
  private beautifyPrompt: string;

  constructor() {
    this.beautifyPrompt =
      process.env.BEAUTIFY_PROMPT ||
      '保持此人面部结构、五官比例与肤色一致；在不改变身份的前提下进行中度专业修图：去皮屑与瑕疵但保留真实毛孔与皮肤纹理；细致修整眉型与发际线；不要过度磨皮；让皮肤呈现健康的中性光泽。';
  }

  /**
   * Process user uploaded image with beautify prompt
   * @param userImageUrl - URL of the user uploaded image
   * @param taskId - Task ID for organizing R2 storage
   * @returns BeautifyResult with R2 object key and image URL
   */
  async process(userImageUrl: string, taskId: string): Promise<BeautifyResult> {
    try {
      console.log('\n[BeautifyProcessor] ========== BEAUTIFY PROCESS START ==========');
      console.log(`[BeautifyProcessor] Task ID: ${taskId}`);
      console.log(`[BeautifyProcessor] Input image URL: ${userImageUrl}`);
      console.log(`[BeautifyProcessor] Beautify prompt: ${this.beautifyPrompt.substring(0, 60)}...`);

      // Generate beautified image
      console.log('\n[BeautifyProcessor] Step 1: Calling Apicore API for beautification...');
      const generationRequest: GenerationRequest = {
        prompt: this.beautifyPrompt,
        image: userImageUrl,
        n: 1,
        size: '1x1',
      };

      console.log('[BeautifyProcessor] ========== BEAUTIFY REQUEST PARAMS ==========');
      console.log(`[BeautifyProcessor] Prompt: ${generationRequest.prompt.substring(0, 80)}...`);
      console.log(`[BeautifyProcessor] Image URL: ${generationRequest.image}`);
      console.log(`[BeautifyProcessor] Image length: ${generationRequest.image?.length || 0} chars`);
      console.log(`[BeautifyProcessor] N (count): ${generationRequest.n}`);
      console.log(`[BeautifyProcessor] Size: ${generationRequest.size}`);
      console.log('[BeautifyProcessor] ========== END REQUEST PARAMS ==========');
      console.log('[BeautifyProcessor] Generation request prepared');
      const imageUrls = await apicoreClient.generate([generationRequest]);
      console.log(`[BeautifyProcessor] ✅ API returned ${imageUrls.length} image URL(s)`);
      
      const beautifiedImageUrl = imageUrls[0];

      if (!beautifiedImageUrl) {
        throw new Error('Failed to generate beautified image');
      }

      console.log(`[BeautifyProcessor] Beautified image URL: ${beautifiedImageUrl}`);

      // Download and upload to R2
      console.log('\n[BeautifyProcessor] Step 2: Downloading and uploading to R2...');
      const objectKey = `results/${taskId}/beautified/001.jpg`;
      console.log(`[BeautifyProcessor] Target R2 key: ${objectKey}`);
      
      const uploadedKey = await imageManager.downloadAndUpload(beautifiedImageUrl, objectKey, `beautified_${taskId}.jpg`);
      console.log(`[BeautifyProcessor] ✅ Uploaded to R2: ${uploadedKey}`);

      // Get file size
      console.log('\n[BeautifyProcessor] Step 3: Getting image metadata...');
      const sizeBytes = await this.getImageSizeFromUrl(beautifiedImageUrl);
      console.log(`[BeautifyProcessor] ✅ Image size: ${sizeBytes} bytes`);

      console.log('\n[BeautifyProcessor] ========== BEAUTIFY PROCESS COMPLETED ==========\n');

      return {
        r2ObjectKey: uploadedKey,
        imageUrl: beautifiedImageUrl,
        sizeBytes,
      };
    } catch (error) {
      console.error('\n[BeautifyProcessor] ❌ PROCESS FAILED:', error);
      console.error('[BeautifyProcessor] Error details:', error instanceof Error ? error.stack : error);
      console.log('[BeautifyProcessor] ========== BEAUTIFY PROCESS FAILED ==========\n');
      throw error;
    }
  }

  /**
   * Get image size from URL (approximate)
   */
  private async getImageSizeFromUrl(imageUrl: string): Promise<number> {
    try {
      console.log('[BeautifyProcessor] Fetching image metadata from URL...');
      const response = await fetch(imageUrl, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      const size = contentLength ? parseInt(contentLength, 10) : 0;
      console.log(`[BeautifyProcessor] Content-Length: ${size} bytes`);
      return size;
    } catch (error) {
      console.warn('[BeautifyProcessor] ⚠️  Failed to get image size:', error);
      return 0;
    }
  }
}

export const beautifyProcessor = new BeautifyProcessor();
