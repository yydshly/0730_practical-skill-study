import { describe, expect, it } from 'vitest';

import {
  buildPlotSeries,
  buildPlotSeriesWithDiagnostics,
  calculateDate,
  convertTimezone,
  convertUnit,
  differentiate,
  evaluateScientific,
  factorAlgebra,
  formatUnixTimestamp,
  parseUnixTimestamp,
  simplifyAlgebra,
  solveAlgebra,
  MAX_DEEP_PLOT_EVALUATIONS,
  MAX_PLOT_MAGNITUDE,
} from '../src/engines/calculator';

describe('安全科学计算器', () => {
  it('科学计算器遵守运算优先级', () => {
    expect(evaluateScientific('2 + 3 * 4')).toBe(14);
  });

  it('一元负号低于幂，并支持右结合幂与函数调用', () => {
    expect(evaluateScientific('-2^2 + sqrt(16)')).toBe(0);
    expect(evaluateScientific('2^3^2')).toBe(512);
    expect(evaluateScientific('sin(pi / 2)')).toBeCloseTo(1, 12);
  });

  it('拒绝非法字符、未知标识符和代码注入', () => {
    expect(() => evaluateScientific('2; globalThis.hacked = true')).toThrow(/非法字符/);
    expect(() => evaluateScientific('constructor(1)')).toThrow(/不支持的函数或常量/);
    expect((globalThis as { hacked?: boolean }).hacked).toBeUndefined();
  });

  it('对除零和函数定义域给出中文错误', () => {
    expect(() => evaluateScientific('1 / 0')).toThrow(/除数不能为零/);
    expect(() => evaluateScientific('sqrt(-1)')).toThrow(/定义域/);
    expect(() => evaluateScientific('ln(0)')).toThrow(/定义域/);
  });

  it('tan 在 pi/2 加任意整数倍 pi 处拒绝求值', () => {
    expect(() => evaluateScientific('tan(pi / 2)')).toThrow(/tan.*定义域/);
    expect(() => evaluateScientific('tan(pi / 2 + pi)')).toThrow(/tan.*定义域/);
    expect(() => evaluateScientific('tan(-pi / 2 + 2 * pi)')).toThrow(/tan.*定义域/);
    expect(() => evaluateScientific('tan(pi / 2 + 1000000 * pi)')).toThrow(/tan.*定义域/);
    expect(() => evaluateScientific('tan(pi / 2 + 1000000000 * pi)')).toThrow(/tan.*定义域/);
  });

  it('tan 接近远周期奇点但超过浮点容差时仍可求值', () => {
    expect(Number.isFinite(evaluateScientific('tan(pi / 2 + 1000000000 * pi + 0.00001)'))).toBe(true);
  });
});

describe('代数工具', () => {
  it('合并同类项并规范化常数', () => {
    expect(simplifyAlgebra('2x + 3x - 4 + 1')).toBe('5x - 3');
  });

  it('分解首项系数为一且有整数根的二次式', () => {
    expect(factorAlgebra('x^2 - 5x + 6')).toBe('(x - 2)(x - 3)');
  });

  it('求解一次和二次方程', () => {
    expect(solveAlgebra('2x + 4 = 0')).toEqual([-2]);
    expect(solveAlgebra('x^2 - 5x + 6 = 0')).toEqual([2, 3]);
  });

  it('对多项式逐项求导', () => {
    expect(differentiate('3x^2 + 2x - 5')).toBe('6x + 2');
  });

  it('拒绝非多项式代数输入和无实数解', () => {
    expect(() => simplifyAlgebra('sin(x)')).toThrow(/仅支持多项式/);
    expect(() => solveAlgebra('x^2 + 1 = 0')).toThrow(/没有实数解/);
  });

  it('多项式加法、乘法和求导溢出时拒绝非有限系数', () => {
    expect(() => simplifyAlgebra('1e308x + 1e308x')).toThrow(/系数.*有限|数值范围/);
    expect(() => simplifyAlgebra('1e200x * 1e200x')).toThrow(/系数.*有限|数值范围/);
    expect(() => differentiate('1e308x^2')).toThrow(/系数.*有限|数值范围/);
  });
});

describe('函数绘图采样', () => {
  it('返回定义域内的有限抛物线采样点', () => {
    const points = buildPlotSeries('x^2', [-2, 2], 5);
    expect(points).toEqual([
      { x: -2, y: 4 },
      { x: -1, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 4 },
    ]);
  });

  it('在渐近线处插入断点，避免跨断点连线', () => {
    const points = buildPlotSeries('1 / x', [-1, 1], 101);
    const breakIndex = points.findIndex((point) => point === null);
    expect(breakIndex).toBeGreaterThan(0);
    expect(points.slice(0, breakIndex).every((point) => point !== null && Number.isFinite(point.y))).toBe(true);
    expect(points.slice(breakIndex + 1).some((point) => point !== null && Number.isFinite(point.y))).toBe(true);
  });

  it('偶数采样未命中零点时仍为同号渐近线插入断点', () => {
    const points = buildPlotSeries('1 / x^2', [-1, 1], 100);
    expect(points.some((point) => point === null)).toBe(true);
    expect(points.filter((point) => point !== null).some((point) => point.x < 0)).toBe(true);
    expect(points.filter((point) => point !== null).some((point) => point.x > 0)).toBe(true);
  });

  it('偏移奇点未命中采样点时通过区间探测插入断点', () => {
    const points = buildPlotSeries('1 / (x - 0.123)^2', [-1, 1], 100);
    const breakIndex = points.findIndex((point) => point === null);
    expect(breakIndex).toBeGreaterThan(0);
    expect(points.slice(0, breakIndex).some((point) => point !== null && point.x < 0.123)).toBe(true);
    expect(points.slice(breakIndex + 1).some((point) => point !== null && point.x > 0.123)).toBe(true);
  });

  it('普通陡峭连续函数不会被误判为断点', () => {
    const points = buildPlotSeries('1000 * x', [-1, 1], 100);
    expect(points).toHaveLength(100);
    expect(points.every((point) => point !== null)).toBe(true);
  });

  it.each([
    '1 / (x^2 + 0.000001)',
    '1000000 / (1 + 1000000 * x^2)',
  ])('连续有限尖峰 %s 在偶数采样下不插入断点', (expression) => {
    const points = buildPlotSeries(expression, [-1, 1], 100);
    expect(points).toHaveLength(100);
    expect(points.every((point) => point !== null)).toBe(true);
  });

  it.each(['x', 'sin(1000 * x)'])('5000 点连续函数 %s 仅做每区间一次中点预检', (expression) => {
    const { points, diagnostics } = buildPlotSeriesWithDiagnostics(expression, [-1, 1], 5000);
    expect(points).toHaveLength(5000);
    expect(points.every((point) => point !== null)).toBe(true);
    expect(diagnostics.baseEvaluations).toBe(5000);
    expect(diagnostics.midpointEvaluations).toBe(4999);
    expect(diagnostics.deepEvaluations).toBe(0);
    expect(diagnostics.totalEvaluations).toBe(9999);
  });

  it('所有疑似区间共享每条曲线的深探测求值预算', () => {
    const { diagnostics } = buildPlotSeriesWithDiagnostics(
      '1000000 / (1 + 1000000 * sin(2000 * x)^2)',
      [-1, 1],
      5000,
    );
    expect(diagnostics.deepEvaluations).toBe(MAX_DEEP_PLOT_EVALUATIONS);
    expect(diagnostics.totalEvaluations)
      .toBeLessThanOrEqual(5000 + 4999 + MAX_DEEP_PLOT_EVALUATIONS);
  });

  it('超出安全投影上限的有限常量返回 gap 而不是伪曲线', () => {
    const boundaryPoints = buildPlotSeries('1000000', [-1, 1], 5);
    expect(boundaryPoints.every((point) => point !== null && Math.abs(point.y) <= MAX_PLOT_MAGNITUDE)).toBe(true);
    expect(buildPlotSeries('1000001', [-1, 1], 5)).toEqual([null]);
    expect(buildPlotSeries('1e308', [-1, 1], 5)).toEqual([null]);
  });

  it('拒绝反向定义域和过少采样点', () => {
    expect(() => buildPlotSeries('x', [2, -2], 100)).toThrow(/定义域/);
    expect(() => buildPlotSeries('x', [-2, 2], 1)).toThrow(/采样点/);
  });

  it('整个定义域都无有效点时给出中文错误', () => {
    expect(() => buildPlotSeries('sqrt(-1)', [-2, 2], 21)).toThrow(/没有可绘制/);
  });
});

describe('日期、Unix 时间戳和时区', () => {
  it('闰年二月日期加一天得到二月二十九日', () => {
    expect(calculateDate('2024-02-28T00:00:00.000Z', 1, 'day').toISOString())
      .toBe('2024-02-29T00:00:00.000Z');
  });

  it('支持负数 Unix 秒时间戳及往返转换', () => {
    const date = parseUnixTimestamp(-1, 'seconds');
    expect(date.toISOString()).toBe('1969-12-31T23:59:59.000Z');
    expect(formatUnixTimestamp(date, 'seconds')).toBe(-1);
  });

  it('秒时间戳保留毫秒精度并正确处理负纪元', () => {
    const beforeEpoch = new Date(-1);
    expect(formatUnixTimestamp(beforeEpoch, 'seconds')).toBe(-0.001);
    expect(formatUnixTimestamp(beforeEpoch, 'milliseconds')).toBe(-1);

    const seconds = 1_700_000_000.123;
    expect(formatUnixTimestamp(parseUnixTimestamp(seconds, 'seconds'), 'seconds')).toBe(seconds);
  });

  it('以确定格式转换时区并拒绝无效时区', () => {
    expect(convertTimezone('2024-01-01T00:00:00.000Z', 'Asia/Shanghai'))
      .toBe('2024-01-01 08:00:00');
    expect(() => convertTimezone('2024-01-01T00:00:00.000Z', 'Mars/Olympus'))
      .toThrow(/无效时区/);
  });

  it('拒绝无效日期和非有限时间戳', () => {
    expect(() => calculateDate('不是日期', 1, 'day')).toThrow(/日期无效/);
    expect(() => parseUnixTimestamp(Number.POSITIVE_INFINITY)).toThrow(/时间戳/);
    expect(() => parseUnixTimestamp('   ', 'seconds')).toThrow(/时间戳.*不能为空/);
  });
});

describe('七类单位换算', () => {
  it('1000 米等于 1 千米', () => {
    expect(convertUnit(1000, 'meter', 'kilometer')).toBe(1);
  });

  it('转换摄氏、华氏和开尔文温度', () => {
    expect(convertUnit(32, 'fahrenheit', 'celsius')).toBeCloseTo(0, 12);
    expect(convertUnit(0, 'celsius', 'kelvin')).toBeCloseTo(273.15, 12);
    expect(convertUnit(-273.15, 'celsius', 'kelvin')).toBeCloseTo(0, 12);
    expect(() => convertUnit(-1, 'kelvin', 'celsius')).toThrow('温度不能低于绝对零度');
  });

  it('区分十进制和二进制字节单位', () => {
    expect(convertUnit(1, 'kilobyte', 'byte')).toBe(1000);
    expect(convertUnit(1, 'mebibyte', 'byte')).toBe(1_048_576);
  });

  it('覆盖质量、面积、体积和速度', () => {
    expect(convertUnit(1, 'kilogram', 'gram')).toBe(1000);
    expect(convertUnit(1, 'hectare', 'square-meter')).toBe(10_000);
    expect(convertUnit(1, 'liter', 'milliliter')).toBe(1000);
    expect(convertUnit(36, 'kilometer-per-hour', 'meter-per-second')).toBeCloseTo(10, 12);
  });

  it('拒绝跨类别、未知单位和非有限数值', () => {
    expect(() => convertUnit(1, 'meter', 'kilogram')).toThrow(/不同类别/);
    expect(() => convertUnit(1, 'unknown', 'meter')).toThrow(/未知单位/);
    expect(() => convertUnit(Number.NaN, 'meter', 'kilometer')).toThrow(/有限数字/);
  });
});
