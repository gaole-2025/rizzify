import sharp from 'sharp';

export class WatermarkProcessor {
  async addWatermark(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width || 1024;
      const height = metadata.height || 1024;

      console.log(`[WatermarkProcessor] Adding watermark to ${width}x${height} image`);

      // 创建水印 SVG - 使用 Pango 兼容的文字渲染
      const fontSize = Math.max(width, height) * 0.08;
      const watermarkSvg = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/>
            </filter>
          </defs>
          <g transform="translate(${width / 2}, ${height / 2}) rotate(-45)">
            <text 
              x="0" 
              y="0" 
              text-anchor="middle" 
              dominant-baseline="middle"
              font-family="sans-serif"
              font-size="${fontSize}"
              font-weight="bold"
              fill="white"
              opacity="0.25"
              filter="url(#shadow)"
            >
              Rizzify Free
            </text>
          </g>
        </svg>
      `);

      console.log(`[WatermarkProcessor] SVG watermark created, size: ${watermarkSvg.length} bytes`);

      // 合成水印
      const result = await sharp(imageBuffer)
        .composite([{ input: watermarkSvg, blend: 'over' }])
        .toBuffer();

      console.log(`[WatermarkProcessor] Watermark applied successfully, output size: ${result.length} bytes`);
      return result;
    } catch (error) {
      console.error('[WatermarkProcessor] Failed to add watermark:', error);
      console.error('[WatermarkProcessor] Error details:', error instanceof Error ? error.stack : error);
      return imageBuffer; // 降级：返回原始图片
    }
  }
}

export const watermarkProcessor = new WatermarkProcessor();
