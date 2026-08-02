import { FormEvent, useMemo, useState } from 'react';

import { StatusMessage } from '../components/StatusMessage';
import { ToolLayout } from '../components/ToolLayout';
import type { ToolDefinition, ToolId } from '../core/types';
import {
  buildPlotSeries,
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
  UNIT_CATEGORY_LABELS,
  UNIT_DEFINITIONS,
  type DateUnit,
  type PlotPoint,
  type UnitCategory,
  type UnixTimestampUnit,
} from '../engines/calculator';

type CalculatorWorkspaceProps = { tool: ToolDefinition };

const CALCULATOR_TOOL_IDS: readonly ToolId[] = [
  'algebra-calc', 'graph-calc', 'sci-calc', 'time-calc', 'unit-converter',
];

export function isCalculatorToolId(toolId: ToolId): boolean {
  return CALCULATOR_TOOL_IDS.includes(toolId);
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : '计算失败，请检查输入后重试';
}

function safeText(operation: () => string): { value: string; error: string } {
  try { return { value: operation(), error: '' }; }
  catch (reason) { return { value: '', error: errorMessage(reason) }; }
}

function AlgebraCalculator() {
  const [source, setSource] = useState('x^2 - 5x + 6 = 0');
  const results = useMemo(() => ({
    simplify: safeText(() => simplifyAlgebra(source)),
    factor: safeText(() => factorAlgebra(source)),
    solve: safeText(() => `x = ${solveAlgebra(source).join('、')}`),
    derivative: safeText(() => differentiate(source)),
  }), [source]);

  const cards = [
    ['化简结果', results.simplify],
    ['因式分解结果', results.factor],
    ['方程解', results.solve],
    ['求导结果', results.derivative],
  ] as const;

  return <div className="text-tool-stack">
    <label className="text-area-field">代数表达式或方程
      <input aria-label="代数表达式或方程" value={source} onChange={(event) => setSource(event.target.value)} />
    </label>
    <p className="format-limit">中文示例：输入 <code>2x + 3x - 4 + 1</code> 可合并同类项；输入 <code>x^2 - 5x + 6 = 0</code> 可分解并求解。当前支持变量 x、括号和最高 12 次多项式。</p>
    <div className="download-pair">
      {cards.map(([label, result]) => <section key={label} className="result-panel" role="region" aria-label={label}>
        <h2>{label}</h2>
        {result.error ? <StatusMessage status="error" message={result.error} /> : <output>{result.value}</output>}
      </section>)}
    </div>
  </div>;
}

type KeyDefinition = { text: string; label: string; value: string };

const NUMBER_AND_OPERATOR_KEYS: readonly KeyDefinition[] = [
  { text: '7', label: '数字 7', value: '7' }, { text: '8', label: '数字 8', value: '8' }, { text: '9', label: '数字 9', value: '9' }, { text: '÷', label: '除号', value: '/' },
  { text: '4', label: '数字 4', value: '4' }, { text: '5', label: '数字 5', value: '5' }, { text: '6', label: '数字 6', value: '6' }, { text: '×', label: '乘号', value: '*' },
  { text: '1', label: '数字 1', value: '1' }, { text: '2', label: '数字 2', value: '2' }, { text: '3', label: '数字 3', value: '3' }, { text: '−', label: '减号', value: '-' },
  { text: '0', label: '数字 0', value: '0' }, { text: '.', label: '小数点', value: '.' }, { text: 'xʸ', label: '幂 xʸ', value: '^' }, { text: '+', label: '加号', value: '+' },
  { text: '(', label: '左括号', value: '(' }, { text: ')', label: '右括号', value: ')' }, { text: ',', label: '逗号', value: ',' }, { text: 'mod', label: '取模 mod', value: '%' },
];

const SCIENTIFIC_FUNCTION_KEYS: readonly KeyDefinition[] = [
  { text: 'sin', label: '正弦 sin', value: 'sin(' }, { text: 'cos', label: '余弦 cos', value: 'cos(' }, { text: 'tan', label: '正切 tan', value: 'tan(' },
  { text: 'sin⁻¹', label: '反正弦', value: 'asin(' }, { text: 'cos⁻¹', label: '反余弦', value: 'acos(' }, { text: 'tan⁻¹', label: '反正切', value: 'atan(' },
  { text: 'log', label: '常用对数 log', value: 'log(' }, { text: 'ln', label: '自然对数 ln', value: 'ln(' }, { text: 'x!', label: '阶乘', value: '!' },
  { text: '|x|', label: '绝对值', value: 'abs(' }, { text: 'π', label: '圆周率 π', value: 'pi' }, { text: 'e', label: '自然常数 e', value: 'e' },
  { text: 'Ans', label: '上次结果 Ans', value: 'ans' }, { text: 'EE', label: '科学计数法 EE', value: 'e' }, { text: 'ʸ√x', label: 'n 次方根', value: 'root(' },
];

function ScientificCalculator() {
  const [expression, setExpression] = useState('sin(pi / 2) + sqrt(16)');
  const [result, setResult] = useState<number | null>(null);
  const [ans, setAns] = useState<number | null>(null);
  const [angleMode, setAngleMode] = useState<'rad' | 'deg'>('rad');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<readonly string[]>([]);

  const calculate = () => {
    try {
      const value = evaluateScientific(expression, { angleMode, ans: ans ?? undefined });
      const normalized = Number(value.toPrecision(12));
      setResult(normalized);
      setAns(normalized);
      setError('');
      setHistory((items) => [`${expression} = ${normalized}`, ...items].slice(0, 12));
    } catch (reason) {
      setResult(null);
      setError(errorMessage(reason));
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    calculate();
  };

  return <div className="text-tool-stack">
    <form onSubmit={submit}>
      <label>科学计算表达式
        <input aria-label="科学计算表达式" value={expression} onChange={(event) => setExpression(event.target.value)} placeholder="例如 sin(pi / 2) + sqrt(16)" autoComplete="off" />
      </label>
      <div className="inline-actions">
        <button type="submit" aria-label="计算结果">计算</button>
        <button type="button" aria-label="删除一位" onClick={() => setExpression((value) => value.slice(0, -1))}>删除一位</button>
        <button type="button" aria-label="清空表达式" onClick={() => { setExpression(''); setError(''); }}>清空</button>
      </div>
    </form>
    <div className="inline-actions" role="group" aria-label="角度模式">
      <button type="button" aria-label="角度制 DEG" aria-pressed={angleMode === 'deg'} onClick={() => setAngleMode('deg')}>DEG</button>
      <button type="button" aria-label="弧度制 RAD" aria-pressed={angleMode === 'rad'} onClick={() => setAngleMode('rad')}>RAD</button>
    </div>
    <div role="group" aria-label="数字与运算键盘" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))', gap: 8 }}>
      {NUMBER_AND_OPERATOR_KEYS.map((key) => <button key={key.label} type="button" aria-label={key.label} onClick={() => setExpression((value) => value + key.value)}>{key.text}</button>)}
    </div>
    <div role="group" aria-label="科学函数键盘" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))', gap: 8 }}>
      {SCIENTIFIC_FUNCTION_KEYS.map((key) => <button key={key.label} type="button" aria-label={key.label} onClick={() => setExpression((value) => value + key.value)}>{key.text}</button>)}
    </div>
    {error && <StatusMessage status="error" message={error} />}
    {result !== null && <section className="result-panel" aria-label="科学计算结果"><output>{result}</output></section>}
    <section aria-label="计算历史">
      <h2>历史记录</h2>
      <button type="button" aria-label="清空历史" onClick={() => setHistory([])}>清空历史</button>
      {history.length ? <ol>{history.map((item, index) => <li key={`${item}-${index}`}><code>{item}</code></li>)}</ol> : <p>完成一次计算后会显示在这里。</p>}
    </section>
  </div>;
}

function splitSegments(points: readonly (PlotPoint | null)[]): PlotPoint[][] {
  const segments: PlotPoint[][] = [];
  let current: PlotPoint[] = [];
  for (const point of points) {
    if (point) current.push(point);
    else if (current.length) { segments.push(current); current = []; }
  }
  if (current.length) segments.push(current);
  return segments.filter((segment) => segment.length > 1);
}

const GRAPH_COLORS = ['#2563eb', '#dc2626', '#059669', '#9333ea', '#d97706'];

function GraphCalculator() {
  const [source, setSource] = useState('sin(x)\nx^2 / 10');
  const [minimum, setMinimum] = useState(-10);
  const [maximum, setMaximum] = useState(10);
  const [samples, setSamples] = useState(321);
  const width = 640;
  const height = 360;
  const yMinimum = -10;
  const yMaximum = 10;

  const chart = useMemo(() => {
    const expressions = source.split(/\r?\n/u).map((value) => value.trim()).filter(Boolean).slice(0, 5);
    if (!expressions.length) return { series: [] as { expression: string; segments: PlotPoint[][] }[], error: '请至少输入一个函数表达式' };
    try {
      return {
        series: expressions.map((expression) => ({ expression, segments: splitSegments(buildPlotSeries(expression, [minimum, maximum], samples)) })),
        error: '',
      };
    } catch (reason) {
      return { series: [] as { expression: string; segments: PlotPoint[][] }[], error: errorMessage(reason) };
    }
  }, [maximum, minimum, samples, source]);

  const pointToSvg = (point: PlotPoint) => {
    const x = (point.x - minimum) / (maximum - minimum) * width;
    const y = height - (point.y - yMinimum) / (yMaximum - yMinimum) * height;
    return `${Number(x.toFixed(2))},${Number(y.toFixed(2))}`;
  };
  const xAxis = height - (0 - yMinimum) / (yMaximum - yMinimum) * height;
  const yAxis = (0 - minimum) / (maximum - minimum) * width;

  return <div className="text-tool-stack">
    <label className="text-area-field">函数表达式（每行一个）
      <textarea aria-label="函数表达式（每行一个）" value={source} onChange={(event) => setSource(event.target.value)} />
    </label>
    <div className="text-controls text-controls--three">
      <label>定义域起点<input aria-label="定义域起点" type="number" value={minimum} onChange={(event) => setMinimum(Number(event.target.value))} /></label>
      <label>定义域终点<input aria-label="定义域终点" type="number" value={maximum} onChange={(event) => setMaximum(Number(event.target.value))} /></label>
      <label>采样点数量<input aria-label="采样点数量" type="number" min="2" max="5000" value={samples} onChange={(event) => setSamples(Number(event.target.value))} /></label>
    </div>
    <p className="format-limit">定义域：{minimum} 到 {maximum}。每行绘制一个表达式，最多五条；渐近线和未定义点会自动断开，不跨断点连线。纵轴预览范围为 -10 到 10。</p>
    {chart.error ? <StatusMessage status="error" message={chart.error} /> : <svg role="img" aria-label="函数曲线图" viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minHeight: 280, background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: 10 }}>
      <defs><clipPath id="plot-clip"><rect width={width} height={height} /></clipPath></defs>
      {xAxis >= 0 && xAxis <= height && <line x1="0" x2={width} y1={xAxis} y2={xAxis} stroke="currentColor" opacity="0.5" />}
      {yAxis >= 0 && yAxis <= width && <line x1={yAxis} x2={yAxis} y1="0" y2={height} stroke="currentColor" opacity="0.5" />}
      <text x={width - 18} y={Math.max(18, Math.min(height - 8, xAxis - 8))}>x</text>
      <text x={Math.max(8, Math.min(width - 18, yAxis + 8))} y="18">y</text>
      <g clipPath="url(#plot-clip)">{chart.series.flatMap((item, seriesIndex) => item.segments.map((segment, segmentIndex) => <path key={`${item.expression}-${segmentIndex}`} data-expression={item.expression} d={`M ${segment.map(pointToSvg).join(' L ')}`} fill="none" stroke={GRAPH_COLORS[seriesIndex]} strokeWidth="2.5" />))}</g>
    </svg>}
    {!chart.error && <ul>{chart.series.map((item, index) => <li key={item.expression}><span style={{ color: GRAPH_COLORS[index] }}>●</span> <code>{item.expression}</code></li>)}</ul>}
  </div>;
}

function utcInput(value: string): string {
  const time = value.split('T')[1] ?? '';
  return time.split(':').length >= 3 ? `${value}Z` : `${value}:00.000Z`;
}

function TimeCalculator() {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '系统本地时区';
  const [timestamp, setTimestamp] = useState('0');
  const [timestampUnit, setTimestampUnit] = useState<UnixTimestampUnit>('seconds');
  const [timestampResult, setTimestampResult] = useState('');
  const [unixDateInput, setUnixDateInput] = useState('1970-01-01T00:00:00.000');
  const [outputTimestampUnit, setOutputTimestampUnit] = useState<Exclude<UnixTimestampUnit, 'auto'>>('seconds');
  const [dateTimestampResult, setDateTimestampResult] = useState('');
  const [dateInput, setDateInput] = useState('2024-02-28T00:00');
  const [dateAmount, setDateAmount] = useState(1);
  const [dateUnit, setDateUnit] = useState<DateUnit>('day');
  const [dateResult, setDateResult] = useState('');
  const [timezoneInput, setTimezoneInput] = useState('2024-01-01T00:00');
  const [targetTimezone, setTargetTimezone] = useState('Asia/Shanghai');
  const [timezoneResult, setTimezoneResult] = useState('');
  const [error, setError] = useState('');

  const run = (operation: () => string, setter: (value: string) => void) => {
    try { setter(operation()); setError(''); }
    catch (reason) { setter(''); setError(errorMessage(reason)); }
  };

  return <div className="text-tool-stack">
    {error && <StatusMessage status="error" message={error} />}
    <section className="result-panel">
      <h2>Unix 时间戳与日期</h2>
      <div className="text-controls text-controls--two">
        <label>Unix 时间戳<input aria-label="Unix 时间戳" inputMode="numeric" value={timestamp} onChange={(event) => setTimestamp(event.target.value)} /></label>
        <label>时间戳单位<select aria-label="时间戳单位" value={timestampUnit} onChange={(event) => setTimestampUnit(event.target.value as UnixTimestampUnit)}><option value="seconds">秒</option><option value="milliseconds">毫秒</option><option value="auto">自动判断</option></select></label>
      </div>
      <button type="button" onClick={() => run(() => parseUnixTimestamp(timestamp, timestampUnit).toISOString(), setTimestampResult)}>转换时间戳</button>
      {timestampResult && <output aria-label="时间戳转换结果">{timestampResult}</output>}
      <div className="text-controls text-controls--two">
        <label>日期转时间戳输入<input aria-label="日期转时间戳输入" type="datetime-local" step="0.001" value={unixDateInput} onChange={(event) => { setUnixDateInput(event.target.value); setDateTimestampResult(''); }} /></label>
        <label>输出时间戳单位<select aria-label="输出时间戳单位" value={outputTimestampUnit} onChange={(event) => { setOutputTimestampUnit(event.target.value as Exclude<UnixTimestampUnit, 'auto'>); setDateTimestampResult(''); }}><option value="seconds">秒（保留毫秒精度）</option><option value="milliseconds">毫秒（整数）</option></select></label>
      </div>
      <button type="button" onClick={() => run(() => {
        const value = formatUnixTimestamp(utcInput(unixDateInput), outputTimestampUnit);
        return `${value} ${outputTimestampUnit === 'seconds' ? '秒' : '毫秒'}`;
      }, setDateTimestampResult)}>日期转 Unix 时间戳</button>
      {dateTimestampResult && <output aria-label="日期转时间戳结果">{dateTimestampResult}</output>}
    </section>
    <section className="result-panel">
      <h2>日期加减</h2>
      <div className="text-controls text-controls--three">
        <label>起始日期时间<input aria-label="起始日期时间" type="datetime-local" value={dateInput} onChange={(event) => setDateInput(event.target.value)} /></label>
        <label>增减数量<input aria-label="增减数量" type="number" value={dateAmount} onChange={(event) => setDateAmount(Number(event.target.value))} /></label>
        <label>日期单位<select aria-label="日期单位" value={dateUnit} onChange={(event) => setDateUnit(event.target.value as DateUnit)}><option value="day">天</option><option value="hour">小时</option><option value="minute">分钟</option><option value="month">月</option><option value="year">年</option></select></label>
      </div>
      <button type="button" onClick={() => run(() => calculateDate(utcInput(dateInput), dateAmount, dateUnit).toISOString(), setDateResult)}>计算日期</button>
      {dateResult && <output aria-label="日期计算结果">{dateResult}</output>}
    </section>
    <section className="result-panel">
      <h2>时区转换</h2>
      <p>本地时区：<strong>{localTimeZone}</strong>；输入按 UTC 解释，目标时区需使用 IANA 名称。</p>
      <div className="text-controls text-controls--two">
        <label>UTC 日期时间<input aria-label="UTC 日期时间" type="datetime-local" value={timezoneInput} onChange={(event) => setTimezoneInput(event.target.value)} /></label>
        <label>目标时区<input aria-label="目标时区" value={targetTimezone} onChange={(event) => setTargetTimezone(event.target.value)} placeholder="例如 Asia/Shanghai" /></label>
      </div>
      <button type="button" onClick={() => run(() => convertTimezone(utcInput(timezoneInput), targetTimezone), setTimezoneResult)}>转换时区</button>
      {timezoneResult && <output aria-label="时区转换结果">{timezoneResult}</output>}
    </section>
  </div>;
}

const UNIT_CATEGORIES = Object.keys(UNIT_CATEGORY_LABELS) as UnitCategory[];

function unitsFor(category: UnitCategory) {
  return UNIT_DEFINITIONS.filter((unit) => unit.category === category);
}

function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [value, setValue] = useState('1000');
  const [from, setFrom] = useState('meter');
  const [to, setTo] = useState('kilometer');
  const units = unitsFor(category);
  const result = useMemo(() => {
    try {
      if (!value.trim()) throw new Error('请输入换算数值');
      return { value: convertUnit(Number(value), from, to), error: '' };
    } catch (reason) {
      return { value: null, error: errorMessage(reason) };
    }
  }, [from, to, value]);
  const targetLabel = units.find((unit) => unit.id === to)?.label ?? to;

  const changeCategory = (next: UnitCategory) => {
    const nextUnits = unitsFor(next);
    setCategory(next);
    setFrom(nextUnits[0].id);
    setTo(nextUnits[1]?.id ?? nextUnits[0].id);
  };

  return <div className="text-tool-stack">
    <label>单位类别<select aria-label="单位类别" value={category} onChange={(event) => changeCategory(event.target.value as UnitCategory)}>{UNIT_CATEGORIES.map((item) => <option key={item} value={item}>{UNIT_CATEGORY_LABELS[item]}</option>)}</select></label>
    <div className="text-controls text-controls--three">
      <label>换算数值<input aria-label="换算数值" type="number" value={value} onChange={(event) => setValue(event.target.value)} /></label>
      <label>原始单位<select aria-label="原始单位" value={from} onChange={(event) => setFrom(event.target.value)}>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}</select></label>
      <label>目标单位<select aria-label="目标单位" value={to} onChange={(event) => setTo(event.target.value)}>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}</select></label>
    </div>
    <p className="format-limit">十进制 KB 按 1000 字节计算，二进制 KiB 按 1024 字节计算。切换类别或单位不会清空当前数值。</p>
    {result.error ? <StatusMessage status="error" message={result.error} /> : <section className="result-panel" aria-label="单位换算结果"><output>{result.value} {targetLabel}</output></section>}
  </div>;
}

function ToolContent({ toolId }: { toolId: ToolId }) {
  if (toolId === 'algebra-calc') return <AlgebraCalculator />;
  if (toolId === 'graph-calc') return <GraphCalculator />;
  if (toolId === 'sci-calc') return <ScientificCalculator />;
  if (toolId === 'time-calc') return <TimeCalculator />;
  return <UnitConverter />;
}

export function CalculatorWorkspace({ tool }: CalculatorWorkspaceProps) {
  return <ToolLayout tool={tool} localNote="数学表达式、日期和换算数据只在你的设备本地计算，不会发送到服务器。">
    <div className="calculator-workspace text-workspace" aria-label={`${tool.title} 工作区`}>
      <ToolContent toolId={tool.id} />
    </div>
  </ToolLayout>;
}
