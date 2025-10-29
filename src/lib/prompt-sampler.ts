import fs from 'fs/promises';
import path from 'path';

export interface PromptItem {
  id: string;
  source: 'p2' | 'p3';
  gender: 'male' | 'female' | 'unisex';
  text: string;
}

export interface SampledPrompts {
  prompts: PromptItem[];
  count: number;
}

class PromptSampler {
  private catalogP2: PromptItem[] | null = null;
  private catalogP3: PromptItem[] | null = null;

  async loadCatalogs(): Promise<void> {
    if (this.catalogP2 && this.catalogP3) return;

    const p2Path = path.resolve(process.cwd(), process.env.PROMPT_CATALOG_P2 || 'docs/catalog/prompt-catalog.full.p2.json');
    const p3Path = path.resolve(process.cwd(), process.env.PROMPT_CATALOG_P3 || 'docs/catalog/prompt-catalog.full.p3.json');

    try {
      const [p2Raw, p3Raw] = await Promise.all([
        fs.readFile(p2Path, 'utf-8'),
        fs.readFile(p3Path, 'utf-8'),
      ]);

      const p2Data = JSON.parse(p2Raw);
      const p3Data = JSON.parse(p3Raw);

      this.catalogP2 = p2Data.items || [];
      this.catalogP3 = p3Data.items || [];

      console.log(`[PromptSampler] Loaded ${this.catalogP2.length} p2 prompts and ${this.catalogP3.length} p3 prompts`);
    } catch (error) {
      console.error('[PromptSampler] Failed to load catalogs:', error);
      throw error;
    }
  }

  /**
   * Sample prompts based on gender and plan
   * @param gender - male, female, or unisex
   * @param plan - free, start, or pro
   * @returns Sampled prompts
   */
  async sample(gender: 'male' | 'female' | 'unisex', plan: 'free' | 'start' | 'pro'): Promise<SampledPrompts> {
    await this.loadCatalogs();

    if (this.catalogP2 === null || this.catalogP3 === null) {
      throw new Error('Catalogs not loaded');
    }

    // Determine count based on plan
    const countMap: Record<string, number> = {
      free: parseInt(process.env.PLAN_FREE_COUNT || '2', 10),
      start: parseInt(process.env.PLAN_START_COUNT || '30', 10),
      pro: parseInt(process.env.PLAN_PRO_COUNT || '70', 10),
    };

    const totalCount = countMap[plan];

    // Filter by gender - separate gender-specific and unisex prompts
    const genderSpecificP2 = (this.catalogP2 || []).filter((item) => item.gender === gender);
    const unisexP2 = (this.catalogP2 || []).filter((item) => item.gender === 'unisex');
    const genderSpecificP3 = (this.catalogP3 || []).filter((item) => item.gender === gender);
    const unisexP3 = (this.catalogP3 || []).filter((item) => item.gender === 'unisex');

    // Combine gender-specific with unisex for fallback
    const filteredP2 = [...genderSpecificP2, ...unisexP2];
    const filteredP3 = [...genderSpecificP3, ...unisexP3];

    if (filteredP2.length === 0 || filteredP3.length === 0) {
      throw new Error(`No prompts found for gender: ${gender}`);
    }

    // Sample from p2 and p3 with 50:50 weight
    const p2Count = Math.ceil(totalCount / 2);
    const p3Count = totalCount - p2Count;

    // Check if we have enough prompts
    if (filteredP2.length < p2Count) {
      console.warn(`[PromptSampler] ⚠️ P2 prompts insufficient for ${gender}: need ${p2Count}, have ${filteredP2.length}`);
    }
    if (filteredP3.length < p3Count) {
      console.warn(`[PromptSampler] ⚠️ P3 prompts insufficient for ${gender}: need ${p3Count}, have ${filteredP3.length}`);
    }

    const sampledP2 = this.randomSampleWithVariation(filteredP2, p2Count);
    const sampledP3 = this.randomSampleWithVariation(filteredP3, p3Count);

    const prompts = [...sampledP2, ...sampledP3];
    // Shuffle using Fisher-Yates algorithm for better randomness
    this.shuffleArray(prompts);

    return {
      prompts,
      count: prompts.length,
    };
  }

  /**
   * Random sample from array without replacement using Fisher-Yates shuffle
   */
  private randomSample<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr];
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, arr.length));
  }

  /**
   * Random sample with variation - adds random elements to prompts to ensure uniqueness
   */
  private randomSampleWithVariation(arr: PromptItem[], count: number): PromptItem[] {
    const variations = [
      '；画面略微调整角度',
      '；光线稍有变化',
      '；构图微调',
      '；背景略有不同',
      '；姿态稍作调整',
      '；表情自然变化',
      '；视角轻微改变',
      '；氛围略有差异',
      '；细节稍作变化',
      '；整体风格微调',
    ];

    // If we need more samples than available, allow reuse with variation
    if (count > arr.length) {
      const result: PromptItem[] = [];
      const shuffled = [...arr];
      this.shuffleArray(shuffled);

      // First pass: use all available prompts
      result.push(...shuffled);

      // Second pass: reuse with variations
      const remaining = count - arr.length;
      for (let i = 0; i < remaining; i++) {
        const original = shuffled[i % shuffled.length];
        const variation = variations[Math.floor(Math.random() * variations.length)];
        result.push({
          ...original,
          id: `${original.id}-var${i + 1}`,
          text: original.text + variation,
        });
      }

      this.shuffleArray(result);
      return result;
    }

    // Normal case: enough prompts available
    return this.randomSample(arr, count);
  }

  /**
   * Shuffle array in-place using Fisher-Yates algorithm
   */
  private shuffleArray<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}

export const promptSampler = new PromptSampler();
