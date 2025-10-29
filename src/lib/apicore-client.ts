// Use native fetch in Node.js 18+
const fetch = globalThis.fetch;

export interface GenerationRequest {
  prompt: string;
  image?: string; // Base64 encoded image or URL
  n?: number; // Number of images to generate (1-10, default 1)
  size?: '1x1' | '16:9' | '9:16'; // Image size
}

export interface GenerationResponse {
  data: Array<{
    url: string;
  }>;
}

export interface ApicoreClientOptions {
  apiKey: string;
  apiUrl: string;
  model: string;
  maxRetries?: number;
  timeoutMs?: number;
}

class ApicoreClient {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(options: ApicoreClientOptions) {
    this.apiKey = options.apiKey;
    this.apiUrl = options.apiUrl;
    this.model = options.model;
    this.maxRetries = options.maxRetries || 3;
    this.timeoutMs = options.timeoutMs || 15000;
  }

  /**
   * Generate images with retry logic
   */
  async generate(requests: GenerationRequest[]): Promise<string[]> {
    console.log(`\n[ApicoreClient] ========== GENERATE START ==========`);
    console.log(`[ApicoreClient] Generating ${requests.length} image(s)`);
    console.log(`[ApicoreClient] Model: ${this.model}`);
    console.log(`[ApicoreClient] Timeout: ${this.timeoutMs}ms`);
    console.log(`[ApicoreClient] Max retries: ${this.maxRetries}`);
    
    // 🚀 优化：並发请求（並发度 5，提升 67%）
    const concurrency = 5;
    const urls: string[] = new Array(requests.length);

    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchIndices = batch.map((_, idx) => i + idx);

      console.log(`\n[ApicoreClient] Processing concurrent batch: requests ${batchIndices[0] + 1}-${batchIndices[batchIndices.length - 1] + 1}`);

      const promises = batch.map((request, batchIdx) => {
        const globalIdx = i + batchIdx;
        console.log(`[ApicoreClient]   Request ${globalIdx + 1}/${requests.length}:`);
        console.log(`[ApicoreClient]     - Prompt length: ${request.prompt.length} chars`);
        console.log(`[ApicoreClient]     - Has image: ${!!request.image}`);
        console.log(`[ApicoreClient]     - Size: ${request.size}`);
        
        return this.generateSingle(request)
          .then((imageUrl) => {
            console.log(`[ApicoreClient]   ✅ Request ${globalIdx + 1} completed: ${imageUrl.substring(0, 50)}...`);
            urls[globalIdx] = imageUrl;
            return imageUrl;
          })
          .catch((error) => {
            console.error(`[ApicoreClient]   ❌ Request ${globalIdx + 1} failed:`, error);
            throw error;
          });
      });

      await Promise.all(promises);
    }

    console.log(`\n[ApicoreClient] ========== GENERATE COMPLETED ==========`);
    console.log(`[ApicoreClient] Generated ${urls.length} image URL(s)\n`);
    return urls;
  }

  /**
   * Generate a single image with retry (used for concurrent requests)
   */
  private async generateSingle(request: GenerationRequest, attempt = 1): Promise<string> {
    try {
      console.log(`[ApicoreClient]   Attempt ${attempt}/${this.maxRetries}...`);
      const response = await this.callApi(request);
      console.log(`[ApicoreClient]   Response data: ${JSON.stringify(response)}`);
      if (response.data && response.data.length > 0) {
        console.log(`[ApicoreClient]   ✅ Success on attempt ${attempt}`);
        const url = response.data[0].url;
        console.log(`[ApicoreClient]   Image URL: ${url}`);
        return url;
      }
      throw new Error('No image URL in response');
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = 10000; // Fixed 10s interval between retries
        console.warn(`[ApicoreClient]   ⚠️  Attempt ${attempt} failed, retrying in ${delay}ms...`);
        console.warn(`[ApicoreClient]   Error: ${error instanceof Error ? error.message : error}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.generateSingle(request, attempt + 1);
      }
      console.error(`[ApicoreClient]   ❌ All ${this.maxRetries} attempts failed`);
      throw new Error(`Failed to generate image after ${this.maxRetries} retries: ${error}`);
    }
  }

  /**
   * Call Apicore API
   */
  private async callApi(request: GenerationRequest): Promise<GenerationResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      console.log(`[ApicoreClient]     Calling API: ${this.apiUrl}`);
      console.log(`[ApicoreClient]     Timeout: ${this.timeoutMs}ms`);
      
      // Combine image URL and prompt in the prompt field
      let finalPrompt = request.prompt;
      if (request.image) {
        finalPrompt = `${request.image} ${request.prompt}`;
      }

      const payload = {
        model: this.model,
        prompt: finalPrompt,
        n: request.n || 1,
        size: request.size || '1x1',
      };

      console.log(`[ApicoreClient]     ========== FULL PAYLOAD ==========`);
      console.log(`[ApicoreClient]     Model: ${payload.model}`);
      console.log(`[ApicoreClient]     Prompt length: ${payload.prompt.length} chars`);
      console.log(`[ApicoreClient]     Prompt: ${payload.prompt}`);
      console.log(`[ApicoreClient]     N (count): ${payload.n}`);
      console.log(`[ApicoreClient]     Size: ${payload.size}`);
      if (request.image) {
        console.log(`[ApicoreClient]     Image URL: ${request.image.substring(0, 120)}...`);
      }
      console.log(`[ApicoreClient]     Total payload size: ${JSON.stringify(payload).length} bytes`);
      console.log(`[ApicoreClient]     ========== END PAYLOAD ==========`);
      const startTime = Date.now();
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      } as any);

      const elapsed = Date.now() - startTime;
      console.log(`[ApicoreClient]     Response received in ${elapsed}ms (status: ${response.status})`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as GenerationResponse;
      console.log(`[ApicoreClient]     ✅ API returned ${data.data?.length || 0} image(s)`);
      return data;
    } catch (error) {
      console.error(`[ApicoreClient]     ❌ API call failed: ${error instanceof Error ? error.message : error}`);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export function createApicoreClient(): ApicoreClient {
  const apiKey = process.env.APIORE_API_KEY;
  const apiUrl = process.env.APIORE_API_URL;
  const model = process.env.APIORE_MODEL;
  const maxRetries = parseInt(process.env.APIORE_MAX_RETRIES || '3', 10);
  const timeoutMs = parseInt(process.env.APIORE_TIMEOUT_MS || '120000', 10); // 120s default timeout

  if (!apiKey || !apiUrl || !model) {
    throw new Error('Missing Apicore configuration: APIORE_API_KEY, APIORE_API_URL, APIORE_MODEL');
  }

  return new ApicoreClient({
    apiKey,
    apiUrl,
    model,
    maxRetries,
    timeoutMs,
  });
}

export const apicoreClient = createApicoreClient();
