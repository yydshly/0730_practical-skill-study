import { describe, expect, it } from 'vitest';

import {
  cropImage,
  drawWatermark,
  resizeImage,
  rotateImage,
  splitImage,
  stitchImages,
  type ImageDataLike,
} from '../src/engines/imageTransform';

const rgba = (width: number, height: number, values: number[]): ImageDataLike => ({
  width,
  height,
  data: new Uint8ClampedArray(values),
});

const pixels = (image: ImageDataLike): number[] => [...image.data];

describe('本地图像像素转换引擎', () => {
  const quad = rgba(2, 2, [
    255, 0, 0, 255, 0, 255, 0, 128,
    0, 0, 255, 64, 255, 255, 255, 0,
  ]);

  it('contain 使用透明留白并保留 1x1 像素透明度', () => {
    const result = resizeImage(rgba(1, 1, [10, 20, 30, 77]), { width: 3, height: 2, fit: 'contain' });

    expect(result).toMatchObject({ width: 3, height: 2 });
    expect(pixels(result)).toEqual([
      10, 20, 30, 77, 10, 20, 30, 77, 0, 0, 0, 0,
      10, 20, 30, 77, 10, 20, 30, 77, 0, 0, 0, 0,
    ]);
  });

  it('cover 从中心裁切 2x2 像素到目标比例', () => {
    const source = rgba(2, 1, [255, 0, 0, 255, 0, 0, 255, 127]);
    const result = resizeImage(source, { width: 1, height: 1, fit: 'cover' });

    expect(result).toMatchObject({ width: 1, height: 1 });
    expect(pixels(result)).toEqual([0, 0, 255, 127]);
  });

  it('stretch 将每个输出像素按最近邻映射', () => {
    const result = resizeImage(quad, { width: 1, height: 2, fit: 'stretch' });

    expect(pixels(result)).toEqual([0, 255, 0, 128, 255, 255, 255, 0]);
  });

  it.each([
    [0, 2, 2, pixels(quad)],
    [90, 2, 2, [0, 0, 255, 64, 255, 0, 0, 255, 255, 255, 255, 0, 0, 255, 0, 128]],
    [180, 2, 2, [255, 255, 255, 0, 0, 0, 255, 64, 0, 255, 0, 128, 255, 0, 0, 255]],
    [270, 2, 2, [0, 255, 0, 128, 255, 255, 255, 0, 255, 0, 0, 255, 0, 0, 255, 64]],
  ] as const)('旋转 %s 度保持像素坐标和透明度', (degrees, width, height, expected) => {
    const result = rotateImage(quad, degrees);
    expect(result).toMatchObject({ width, height });
    expect(pixels(result)).toEqual(expected);
  });

  it('裁切将越界矩形钳制到有效像素范围', () => {
    const result = cropImage(quad, { x: 1, y: 0, width: 9, height: 2 });
    expect(result).toMatchObject({ width: 1, height: 2 });
    expect(pixels(result)).toEqual([0, 255, 0, 128, 255, 255, 255, 0]);
  });

  it('2x2 九宫格切分返回原始像素顺序', () => {
    const parts = splitImage(quad, 2, 2);
    expect(parts).toHaveLength(4);
    expect(parts.map((part) => pixels(part))).toEqual([
      [255, 0, 0, 255], [0, 255, 0, 128], [0, 0, 255, 64], [255, 255, 255, 0],
    ]);
  });

  it('拼接以透明背景保留间隙和每张图的透明度', () => {
    const left = rgba(1, 1, [255, 0, 0, 100]);
    const right = rgba(1, 1, [0, 0, 255, 200]);
    const result = stitchImages([left, right], 'horizontal', 1);
    expect(result).toMatchObject({ width: 3, height: 1 });
    expect(pixels(result)).toEqual([255, 0, 0, 100, 0, 0, 0, 0, 0, 0, 255, 200]);
  });

  it('水印以透明度进行 alpha 合成并支持九宫格右下位置', () => {
    const result = drawWatermark(
      rgba(2, 2, [0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255]),
      rgba(1, 1, [255, 255, 255, 255]),
      { opacity: 0.5, position: 'bottom-right', scale: 1 },
    );
    expect(pixels(result)).toEqual([
      0, 0, 0, 255, 0, 0, 0, 255,
      0, 0, 0, 255, 128, 128, 128, 255,
    ]);
  });

  it('水印与半透明底图合成时保留预乘透明度', () => {
    const result = drawWatermark(
      rgba(1, 1, [0, 0, 255, 128]),
      rgba(1, 1, [255, 0, 0, 255]),
      { opacity: 0.5, position: 'center', scale: 1 },
    );

    expect(pixels(result)).toEqual([170, 0, 85, 192]);
  });

  it('对无效尺寸、切分参数和透明度返回中文错误', () => {
    expect(() => resizeImage(quad, { width: 0, height: 1, fit: 'stretch' })).toThrow('宽度必须是大于 0 的整数');
    expect(() => splitImage(quad, 0, 1)).toThrow('切分行数必须是大于 0 的整数');
    expect(() => drawWatermark(quad, rgba(1, 1, [1, 1, 1, 1]), { opacity: 2, position: 'center', scale: 1 })).toThrow('水印透明度必须在 0 到 1 之间');
  });
});
