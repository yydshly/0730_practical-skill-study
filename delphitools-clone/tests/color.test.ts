import { describe, expect, it } from 'vitest';

import {
  contrastRatio,
  convertColor,
  extractPalette,
  generateGradientCss,
  generateHarmony,
  generatePalette,
  generateTailwindScale,
  samplePixel,
  simulateColorVision,
  wcagGrade,
} from '../src/engines/color';

describe('颜色引擎', () => {
  it('黑白对比度为 21', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2);
  });

  it('红色转换为 RGB', () => {
    expect(convertColor('#ff0000').rgb).toBe('rgb(255, 0, 0)');
    expect(convertColor('#f00').hsl).toBe('hsl(0, 100%, 50%)');
  });

  it('无效颜色返回中文错误', () => {
    expect(() => convertColor('不是颜色')).toThrow('无法识别颜色');
  });

  it('WCAG 等级在手工阈值处正确分档', () => {
    expect(wcagGrade(7)).toEqual({ normal: 'AAA', large: 'AAA' });
    expect(wcagGrade(4.5)).toEqual({ normal: 'AA', large: 'AAA' });
    expect(wcagGrade(3)).toEqual({ normal: '不通过', large: 'AA' });
    expect(wcagGrade(2.99)).toEqual({ normal: '不通过', large: '不通过' });
  });

  it('三角色和谐色生成三个落在 RGB 范围内的颜色', () => {
    const colors = generateHarmony('#ff0000', 'triadic');
    expect(colors).toHaveLength(3);
    expect(colors).toEqual(['#ff0000', '#00ff00', '#0000ff']);
    expect(colors.every((color) => /^#[0-9a-f]{6}$/.test(color))).toBe(true);
  });

  it('同一种子和数量生成确定的调色板', () => {
    expect(generatePalette('ocean', 4)).toEqual(['#06122a', '#3b73eb', '#70d4ac', '#a5356d']);
    expect(generatePalette('ocean', 4)).toEqual(generatePalette('ocean', 4));
  });

  it('提取调色板按最常出现的精确像素颜色排序', () => {
    const imageData = {
      width: 3,
      height: 2,
      data: new Uint8ClampedArray([
        255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 255, 255,
        255, 0, 0, 255, 0, 0, 255, 255, 0, 0, 255, 255,
      ]),
    };
    expect(extractPalette(imageData, 2)).toEqual(['#0000ff', '#ff0000']);
  });

  it('色觉模拟将输出限制在 0 到 255', () => {
    expect(simulateColorVision({ r: 255, g: 0, b: 0 }, 'protanopia')).toEqual({ r: 145, g: 142, b: 0 });
    expect(simulateColorVision({ r: 255, g: 255, b: 255 }, 'tritanopia')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('Tailwind 色阶包含 50 到 950 的完整键集', () => {
    const shades = generateTailwindScale('#3b82f6');
    expect(Object.keys(shades)).toEqual(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']);
    expect(shades['500']).toBe('#3b82f6');
  });

  it('生成各类渐变 CSS 和精确像素采样', () => {
    expect(generateGradientCss(['#ff0000', '#0000ff'], 'linear')).toBe('linear-gradient(135deg, #ff0000 0%, #0000ff 100%)');
    expect(generateGradientCss(['#ff0000', '#0000ff'], 'corner')).toBe('radial-gradient(circle at top left, #ff0000 0%, transparent 58%), radial-gradient(circle at bottom right, #0000ff 0%, transparent 58%)');
    const imageData = { width: 2, height: 1, data: new Uint8ClampedArray([1, 2, 3, 255, 9, 8, 7, 255]) };
    expect(samplePixel(imageData, 1, 0)).toEqual({ r: 9, g: 8, b: 7, hex: '#090807' });
  });
});
