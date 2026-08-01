import { describe, expect, it } from 'vitest';

import {
  createPlaceholderSvg,
  decodeImageBase64,
  encodeImageBase64,
  faviconSizes,
  fitMatte,
  getImageFormatCapabilities,
  seamlessSlices,
  socialCropRect,
  splitGrid,
  stitchLayout,
  transparentBounds,
  watermarkLayout,
} from '../src/engines/image';
import { IMAGE_FIXTURES, bytesFromBase64 } from './fixtures/image-fixtures';

describe('图片几何引擎', () => {
  it('2x2 网格能生成四个不重叠区域', () => {
    expect(splitGrid(1200, 800, 2, 2)).toEqual([
      { x: 0, y: 0, width: 600, height: 400 },
      { x: 600, y: 0, width: 600, height: 400 },
      { x: 0, y: 400, width: 600, height: 400 },
      { x: 600, y: 400, width: 600, height: 400 },
    ]);
  });

  it('非整除网格覆盖每个像素且没有重叠', () => {
    const regions = splitGrid(5, 3, 2, 2);
    expect(regions).toEqual([
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 2, y: 0, width: 3, height: 1 },
      { x: 0, y: 1, width: 2, height: 2 },
      { x: 2, y: 1, width: 3, height: 2 },
    ]);
    expect(regions.reduce((area, region) => area + region.width * region.height, 0)).toBe(15);
  });

  it('网格引擎硬限制每边 20 且总输出不超过 400', () => {
    expect(() => splitGrid(5000, 5000, 21, 1)).toThrow('每边最多 20');
    expect(() => splitGrid(5000, 5000, 1, 21)).toThrow('每边最多 20');
    expect(splitGrid(5000, 5000, 20, 20)).toHaveLength(400);
  });

  it('长图切片保留最后不足一页的高度', () => {
    expect(seamlessSlices(1080, 2500, 1000)).toEqual([
      { x: 0, y: 0, width: 1080, height: 1000 },
      { x: 0, y: 1000, width: 1080, height: 1000 },
      { x: 0, y: 2000, width: 1080, height: 500 },
    ]);
  });

  it('contain 在方形画布中居中留白', () => {
    expect(fitMatte(400, 200, 300, 300, 'contain')).toEqual({
      source: { x: 0, y: 0, width: 400, height: 200 },
      destination: { x: 0, y: 75, width: 300, height: 150 },
    });
  });

  it('cover 从源图中心裁剪并铺满画布', () => {
    expect(fitMatte(400, 200, 300, 300, 'cover')).toEqual({
      source: { x: 100, y: 0, width: 200, height: 200 },
      destination: { x: 0, y: 0, width: 300, height: 300 },
    });
  });

  it('按社交媒体 4:5 比例居中裁剪', () => {
    expect(socialCropRect(1200, 800, '4:5')).toEqual({ x: 280, y: 0, width: 640, height: 800 });
  });

  it('拒绝非法自定义社交比例', () => {
    expect(() => socialCropRect(1200, 800, '0:5')).toThrow('裁剪比例必须是两个大于 0 的数字');
    expect(() => socialCropRect(1200, 800, '随便')).toThrow('请输入形如 4:5 的裁剪比例');
  });

  it('横向拼接计算画布、间距和每张图片位置', () => {
    expect(stitchLayout([{ width: 100, height: 80 }, { width: 50, height: 120 }], 'horizontal', 10)).toEqual({
      width: 160,
      height: 120,
      placements: [
        { x: 0, y: 20, width: 100, height: 80 },
        { x: 110, y: 0, width: 50, height: 120 },
      ],
    });
  });

  it('纵向拼接计算画布、间距和每张图片位置', () => {
    expect(stitchLayout([{ width: 100, height: 80 }, { width: 50, height: 120 }], 'vertical', 8)).toEqual({
      width: 100,
      height: 208,
      placements: [
        { x: 0, y: 0, width: 100, height: 80 },
        { x: 25, y: 88, width: 50, height: 120 },
      ],
    });
  });

  it('透明边界只包围可见像素', () => {
    const data = new Uint8ClampedArray(4 * 3 * 4);
    data[(1 * 4 + 1) * 4 + 3] = 255;
    data[(2 * 4 + 3) * 4 + 3] = 1;
    expect(transparentBounds({ width: 4, height: 3, data })).toEqual({ x: 1, y: 1, width: 3, height: 2 });
  });

  it('全透明图片返回 null 而不是伪造裁切范围', () => {
    expect(transparentBounds({ width: 2, height: 2, data: new Uint8ClampedArray(16) })).toBeNull();
  });

  it('平铺水印遵守边距、间距、透明度和旋转', () => {
    const result = watermarkLayout(300, 200, 60, 20, {
      mode: 'tile', margin: 20, gap: 30, opacity: 0.35, rotation: -20,
    });
    expect(result.length).toBeGreaterThan(1);
    expect(result[0]).toMatchObject({ bounds: { x: 20, y: 20 }, opacity: 0.35, rotation: -20 });
    expect(result.every((item) => item.bounds.x >= 20 && item.bounds.y >= 20)).toBe(true);
  });

  it('45 度单个水印按旋转后包围盒贴齐右下边距', () => {
    const [placement] = watermarkLayout(400, 300, 100, 20, {
      mode: 'single', margin: 16, gap: 0, opacity: 0.5, rotation: 45, position: 'bottom-right',
    });
    expect(placement.bounds.width).toBeCloseTo(84.85281374);
    expect(placement.bounds.height).toBeCloseTo(84.85281374);
    expect(placement.bounds.x + placement.bounds.width).toBeCloseTo(384);
    expect(placement.bounds.y + placement.bounds.height).toBeCloseTo(284);
    expect(placement.centerX).toBeCloseTo(placement.bounds.x + placement.bounds.width / 2);
    expect(placement.centerY).toBeCloseTo(placement.bounds.y + placement.bounds.height / 2);
  });

  it('90 度单个水印交换包围盒轴并保持左上边距', () => {
    const [placement] = watermarkLayout(400, 300, 100, 20, {
      mode: 'single', margin: 12, gap: 0, opacity: 1, rotation: 90, position: 'top-left',
    });
    expect(placement.bounds).toMatchObject({ x: 12, y: 12 });
    expect(placement.bounds.width).toBeCloseTo(20);
    expect(placement.bounds.height).toBeCloseTo(100);
  });

  it('45 度平铺使用旋转包围盒计算步长且所有水印不越界', () => {
    const placements = watermarkLayout(300, 260, 100, 20, {
      mode: 'tile', margin: 10, gap: 15, opacity: 0.4, rotation: 45,
    });
    expect(placements.length).toBeGreaterThan(1);
    expect(placements[1].bounds.x - placements[0].bounds.x).toBeCloseTo(placements[0].bounds.width + 15);
    expect(placements.every(({ bounds }) => (
      bounds.x >= 10 && bounds.y >= 10
      && bounds.x + bounds.width <= 290.000001
      && bounds.y + bounds.height <= 250.000001
    ))).toBe(true);
  });

  it('拒绝越界的水印参数', () => {
    expect(() => watermarkLayout(300, 200, 60, 20, { mode: 'single', margin: 0, gap: 0, opacity: 1.2, rotation: 0 })).toThrow('水印透明度必须在 0 到 1 之间');
    expect(() => watermarkLayout(300, 200, 60, 20, { mode: 'single', margin: 0, gap: 0, opacity: 1, rotation: 181 })).toThrow('水印旋转角度必须在 -180 到 180 度之间');
  });

  it('favicon 尺寸去重并按从小到大排序', () => {
    expect(faviconSizes([64, 16, 32, 16, 180])).toEqual([16, 32, 64, 180]);
  });

  it('favicon 拒绝小数、零和过大尺寸', () => {
    expect(() => faviconSizes([16, 0])).toThrow('图标尺寸必须是 1 到 512 之间的整数');
    expect(() => faviconSizes([16.5])).toThrow('图标尺寸必须是 1 到 512 之间的整数');
    expect(() => faviconSizes([1024])).toThrow('图标尺寸必须是 1 到 512 之间的整数');
  });
});

describe('图片编码与格式能力', () => {
  it('占位 SVG 转义文本并保留安全内容', () => {
    const svg = createPlaceholderSvg({ width: 320, height: 180, text: '<script>alert("x")</script> & 标题', background: '#111827', foreground: '#ffffff' });
    expect(svg).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; 标题');
    expect(svg).not.toContain('<script>');
  });

  it.each(Object.values(IMAGE_FIXTURES))('真实 $mime 字节按内容验证并决定扩展名', ({ mime, extension, base64 }) => {
    const bytes = bytesFromBase64(base64);
    const dataUrl = encodeImageBase64(bytes, mime);
    expect(decodeImageBase64(dataUrl)).toEqual({ mime, extension, bytes });
  });

  it('Data URL 拒绝非图片 MIME、非法 base64、伪图片和 MIME 魔数不一致', () => {
    expect(() => decodeImageBase64('data:text/plain;base64,aGk=')).toThrow('Data URL 必须包含图片 MIME 类型');
    expect(() => decodeImageBase64('data:image/png;base64,***')).toThrow('图片 Base64 内容无效');
    expect(() => decodeImageBase64('data:image/png;base64,aGk=')).toThrow('不是有效的 PNG、JPEG 或 WebP 图片');
    expect(() => decodeImageBase64(`data:image/jpeg;base64,${IMAGE_FIXTURES.png.base64}`)).toThrow('声明的 MIME 与图片内容不一致');
    expect(() => decodeImageBase64('')).toThrow('请输入图片 Data URL');
  });

  it('转换格式能力表只启用探测后真正可编码的格式', () => {
    const capabilities = getImageFormatCapabilities((mime) => mime === 'image/png' || mime === 'image/jpeg');
    expect(capabilities.filter((item) => item.enabled).map((item) => item.mime)).toEqual(['image/png', 'image/jpeg']);
    expect(capabilities.find((item) => item.mime === 'image/webp')).toMatchObject({ enabled: false });
    expect(capabilities.find((item) => item.mime === 'image/gif')?.reason).toContain('无法可靠编码');
  });
});
