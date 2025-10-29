import sharp from 'sharp';

export class WatermarkProcessor {
  async addWatermark(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width || 1024;
      const height = metadata.height || 1024;

      // 创建水印 SVG
      const watermarkSvg = Buffer.from(`
        <svg width="${width}" height="${height}">
          <text 
            x="50%" 
            y="50%" 
            font-size="${Math.max(width, height) * 0.08}"
            fill="rgba(255, 255, 255, 0.3)"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial"
            font-weight="bold"
            transform="rotate(-45 ${width / 2} ${height / 2})"
          >
            Rizzify Free
          </text>
        </svg>
      `);

      // 合成水印
      return await sharp(imageBuffer)
        .composite([{ input: watermarkSvg, blend: 'over' }])
        .toBuffer();
    } catch (error) {
      console.error('[WatermarkProcessor] Failed to add watermark:', error);
      return imageBuffer; // 降级：返回原始图片
    }
  }
}

export const watermarkProcessor = new WatermarkProcessor();
