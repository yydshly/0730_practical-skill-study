import { describe, expect, it } from 'vitest';

import {
  contrastRatio,
  convertColor,
  convertColorCoordinates,
  extractPalette,
  generateGradientCss,
  generateHarmony,
  generatePalette,
  generateTailwindScale,
  formatTailwindConfig,
  formatTailwindCssVariables,
  parseColor,
  rectangularToPolar,
  samplePixel,
  simulateColorVision,
  wcagGrade,
} from '../src/engines/color';

// W3C CSS Color 4 sample conversion code: https://www.w3.org/TR/css-color-4/#color-conversion-code
function expectVectorClose(actual: readonly number[], expected: readonly number[]) {
  actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 6));
}

describe('颜色引擎', () => {
  it('黑白对比度为 21', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2);
  });

  it('红色转换为 RGB', () => {
    expect(convertColor('#ff0000').rgb).toBe('rgb(255, 0, 0)');
    expect(convertColor('#f00').hsl).toBe('hsl(0, 100%, 50%)');
  });

  it('输出 Decimal RGB、Lab/LCH 与 OKLab/OKLCH', () => {
    const red = convertColor('#ff0000');
    expect(red.decimalRgb).toBe('rgb(1, 0, 0)');
    expect(red.lab).toMatch(/^lab\(54\.29% 80\.8 69\.89\)$/u);
    expect(red.lch).toMatch(/^lch\(54\.29% 106\.84 40\.86\)$/u);
    expect(red.oklab).toMatch(/^oklab\(62\.8% 0\.225 0\.126\)$/u);
    expect(red.oklch).toMatch(/^oklch\(62\.8% 0\.258 29\.23\)$/u);
  });

  it('将低色度 LCH 色相序列化为 none', () => {
    const gray = convertColor('#808080');
    expect(gray.decimalRgb).toBe('rgb(0.502, 0.502, 0.502)');
    expect(gray.lch).toMatch(/^lch\([\d.]+% [\d.]+ none\)$/u);
    expect(gray.oklch).toMatch(/^oklch\([\d.]+% [\d.]+ none\)$/u);
  });

  it('使用 W3C 64 位参考值输出红色原始坐标', () => {
    const red = convertColorCoordinates('#ff0000');
    expectVectorClose(red.lab, [54.29054140467193, 80.80492817043522, 69.89096476862429]);
    expectVectorClose([red.lch[0], red.lch[1]], [54.29054140467193, 106.83718160321469]);
    expect(red.lch[2]).toBeCloseTo(40.85765650501162, 6);
    expectVectorClose(red.oklab, [0.6279553639214313, 0.22486306842627424, 0.12584627733058495]);
    expectVectorClose([red.oklch[0], red.oklch[1]], [0.6279553639214313, 0.25768330380536064]);
    expect(red.oklch[2]).toBeCloseTo(29.233880279627897, 6);
  });

  it('为白色、黑色与中性灰保留原始坐标并省略色相', () => {
    const references = [
      ['#ffffff', [100, 0, 0], [100, 0], [1, 0, 0], [1, 0]],
      ['#000000', [0, 0, 0], [0, 0], [0, 0, 0], [0, 0]],
      ['#808080', [53.58501345216902, 0, 0], [53.58501345216902, 0], [0.5998708056221469, 0, 0], [0.5998708056221469, 0]],
    ] as const;

    references.forEach(([input, lab, lch, oklab, oklch]) => {
      const coordinates = convertColorCoordinates(input);
      expectVectorClose(coordinates.lab, lab);
      expectVectorClose([coordinates.lch[0], coordinates.lch[1]], lch);
      expect(coordinates.lch[2]).toBeNull();
      expectVectorClose(coordinates.oklab, oklab);
      expectVectorClose([coordinates.oklch[0], coordinates.oklch[1]], oklch);
      expect(coordinates.oklch[2]).toBeNull();
    });
  });

  it('在 Lab/LCH 色度等于阈值时省略色相，高于阈值时保留角度', () => {
    const atThreshold = rectangularToPolar(0.0015, 0, 0.0015);
    const aboveThreshold = rectangularToPolar(0.001500001, 0, 0.0015);
    expect(atThreshold.chroma).toBeCloseTo(0.0015, 12);
    expect(atThreshold.hue).toBeNull();
    expect(aboveThreshold.hue).toBeCloseTo(0, 6);
  });

  it('在 OKLab/OKLCH 色度等于阈值时省略色相，高于阈值时保留角度', () => {
    const atThreshold = rectangularToPolar(0.000004, 0, 0.000004);
    const aboveThreshold = rectangularToPolar(0.000004001, 0, 0.000004);
    expect(atThreshold.chroma).toBeCloseTo(0.000004, 12);
    expect(atThreshold.hue).toBeNull();
    expect(aboveThreshold.hue).toBeCloseTo(0, 6);
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

  it('十二种和谐方案都生成合法 HEX，且方形方案按 90 度间隔', () => {
    const schemes = {
      complementary: 2, analogous: 3, triadic: 3, 'split-complementary': 3,
      tetradic: 4, square: 4, monochromatic: 5, shades: 5, tints: 5,
      tones: 5, 'double-split': 6, 'accented-analogous': 4,
    } as const;

    Object.entries(schemes).forEach(([scheme, count]) => {
      const colors = generateHarmony('#ff0000', scheme as keyof typeof schemes);
      expect(colors).toHaveLength(count);
      expect(colors.every((color) => /^#[0-9a-f]{6}$/u.test(color))).toBe(true);
    });

    expect(generateHarmony('#ff0000', 'square').map((color) => parseColor(color).hsl.h)).toEqual([0, 90, 180, 270]);
  });

  it('单色方案只改变饱和度或明度而不改变色相', () => {
    const baseHue = parseColor('#ff0000').hsl.h;
    ['monochromatic', 'shades', 'tints', 'tones'].forEach((scheme) => {
      expect(generateHarmony('#ff0000', scheme as 'monochromatic' | 'shades' | 'tints' | 'tones')
        .map((color) => parseColor(color).hsl.h)).toEqual([baseHue, baseHue, baseHue, baseHue, baseHue]);
    });
  });

  it('三种 Tailwind 模式都生成完整色阶，并按模式调节饱和度', () => {
    const balanced = generateTailwindScale('#6699cc', 'balanced');
    const vivid = generateTailwindScale('#6699cc', 'vivid');
    const muted = generateTailwindScale('#6699cc', 'muted');

    [balanced, vivid, muted].forEach((scale) => expect(Object.keys(scale)).toEqual(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']));
    expect(balanced['500']).toBe('#6699cc');
    expect(parseColor(vivid['500']).hsl.s).toBeGreaterThan(parseColor(balanced['500']).hsl.s);
    expect(parseColor(muted['500']).hsl.s).toBeLessThan(parseColor(balanced['500']).hsl.s);
  });

  it('将中文色阶名稳定规范化为 CSS 变量和可导入的 Tailwind 配置模块', async () => {
    const scale = { 50: '#ffffff', 500: '#000000', 950: '#112233' };
    const moduleText = formatTailwindConfig('品牌 蓝', scale);

    expect(formatTailwindCssVariables('品牌 蓝', scale)).toBe(':root {\n  --品牌-蓝-50: #ffffff;\n  --品牌-蓝-500: #000000;\n  --品牌-蓝-950: #112233;\n}');

    const imported = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(moduleText)}`);
    expect(imported.default).toHaveProperty('品牌-蓝');
    expect(imported.default['品牌-蓝']).toMatchObject({ 50: '#ffffff', 500: '#000000', 950: '#112233' });

    const legacyJson = JSON.stringify({ '品牌-蓝': scale });
    await expect(import(`data:text/javascript;charset=utf-8,${encodeURIComponent(legacyJson)}`)).rejects.toThrow();
  });

  it('生成各类渐变 CSS 和精确像素采样', () => {
    expect(generateGradientCss(['#ff0000', '#0000ff'], 'linear')).toBe('linear-gradient(135deg, #ff0000 0%, #0000ff 100%)');
    expect(generateGradientCss(['#ff0000', '#0000ff'], 'corner')).toBe('radial-gradient(circle at top left, #ff0000 0%, transparent 58%), radial-gradient(circle at bottom right, #0000ff 0%, transparent 58%)');
    const imageData = { width: 2, height: 1, data: new Uint8ClampedArray([1, 2, 3, 255, 9, 8, 7, 255]) };
    expect(samplePixel(imageData, 1, 0)).toEqual({ r: 9, g: 8, b: 7, hex: '#090807' });
  });
});
