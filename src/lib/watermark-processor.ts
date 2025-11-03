import sharp from 'sharp';

export class WatermarkProcessor {
  async addWatermark(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width || 1024;
      const height = metadata.height || 1024;

      console.log(`[WatermarkProcessor] Adding watermark to ${width}x${height} image`);

      // 创建水印 SVG - 使用简单的矩形和文字
      const fontSize = Math.max(width, height) * 0.06;
      const watermarkSvg = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>
              @font-face {
                font-family: 'Arial';
                src: local('Arial');
              }
            </style>
          </defs>
          <g transform="translate(${width / 2}, ${height / 2}) rotate(-45)">
            <rect x="-200" y="-40" width="400" height="80" fill="none" stroke="white" stroke-width="2" opacity="0.2"/>
            <text 
              x="0" 
              y="15" 
              text-anchor="middle" 
              font-family="Arial"
              font-size="${fontSize}"
              font-weight="bold"
              fill="white"
              opacity="0.2"
            >Rizzify Free</text>
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
