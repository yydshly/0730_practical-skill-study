export type PlotPoint = { x: number; y: number };
export type PlotSample = PlotPoint | null;
export type DateUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';
export type UnixTimestampUnit = 'auto' | 'seconds' | 'milliseconds';
export type UnitCategory = 'length' | 'mass' | 'temperature' | 'data' | 'area' | 'volume' | 'speed';

type Token =
  | { type: 'number'; value: number }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' | '^' }
  | { type: 'left-paren' | 'right-paren' | 'end' };

const CONSTANTS: Readonly<Record<string, number>> = {
  pi: Math.PI,
  e: Math.E,
};

const FUNCTIONS: Readonly<Record<string, (value: number) => number>> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: (value) => {
    if (Math.abs(Math.cos(value)) < 1e-12) throw new Error('tan 的输入超出定义域：cos(x) 接近零');
    return Math.tan(value);
  },
  asin: (value) => {
    if (value < -1 || value > 1) throw new Error('asin 的输入超出定义域 [-1, 1]');
    return Math.asin(value);
  },
  acos: (value) => {
    if (value < -1 || value > 1) throw new Error('acos 的输入超出定义域 [-1, 1]');
    return Math.acos(value);
  },
  atan: Math.atan,
  sqrt: (value) => {
    if (value < 0) throw new Error('sqrt 的输入超出定义域，不能小于零');
    return Math.sqrt(value);
  },
  abs: Math.abs,
  ln: (value) => {
    if (value <= 0) throw new Error('ln 的输入超出定义域，必须大于零');
    return Math.log(value);
  },
  log: (value) => {
    if (value <= 0) throw new Error('log 的输入超出定义域，必须大于零');
    return Math.log10(value);
  },
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
};

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < expression.length) {
    const character = expression[index];
    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }
    if (/[0-9.]/u.test(character)) {
      const match = expression.slice(index).match(/^(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?/u);
      if (!match) throw new Error(`数字格式无效，位置 ${index + 1}`);
      const value = Number(match[0]);
      if (!Number.isFinite(value)) throw new Error('数字必须是有限值');
      tokens.push({ type: 'number', value });
      index += match[0].length;
      continue;
    }
    if (/[A-Za-z_]/u.test(character)) {
      const match = expression.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/u)!;
      tokens.push({ type: 'identifier', value: match[0].toLowerCase() });
      index += match[0].length;
      continue;
    }
    if (character === '(') tokens.push({ type: 'left-paren' });
    else if (character === ')') tokens.push({ type: 'right-paren' });
    else if (character === '+' || character === '-' || character === '*' || character === '/' || character === '^') {
      tokens.push({ type: 'operator', value: character });
    } else {
      throw new Error(`表达式包含非法字符“${character}”，位置 ${index + 1}`);
    }
    index += 1;
  }
  tokens.push({ type: 'end' });
  return tokens;
}

class NumericParser {
  private index = 0;

  constructor(private readonly tokens: readonly Token[], private readonly variables: Readonly<Record<string, number>>) {}

  parse(): number {
    if (this.current().type === 'end') throw new Error('请输入要计算的表达式');
    const result = this.parseAdditive();
    if (this.current().type !== 'end') throw new Error('表达式结构无效，请检查括号和运算符');
    return ensureFinite(result);
  }

  private current(): Token {
    return this.tokens[this.index];
  }

  private consume(): Token {
    const token = this.current();
    this.index += 1;
    return token;
  }

  private matchesOperator(value: string): boolean {
    const token = this.current();
    return token.type === 'operator' && token.value === value;
  }

  private parseAdditive(): number {
    let value = this.parseMultiplicative();
    while (this.matchesOperator('+') || this.matchesOperator('-')) {
      const operator = (this.consume() as Extract<Token, { type: 'operator' }>).value;
      const right = this.parseMultiplicative();
      value = operator === '+' ? value + right : value - right;
    }
    return ensureFinite(value);
  }

  private parseMultiplicative(): number {
    let value = this.parseUnary();
    while (this.matchesOperator('*') || this.matchesOperator('/')) {
      const operator = (this.consume() as Extract<Token, { type: 'operator' }>).value;
      const right = this.parseUnary();
      if (operator === '/' && right === 0) throw new Error('除数不能为零');
      value = operator === '*' ? value * right : value / right;
    }
    return ensureFinite(value);
  }

  private parseUnary(): number {
    if (this.matchesOperator('+')) {
      this.consume();
      return this.parseUnary();
    }
    if (this.matchesOperator('-')) {
      this.consume();
      return -this.parseUnary();
    }
    return this.parsePower();
  }

  private parsePower(): number {
    const base = this.parsePrimary();
    if (!this.matchesOperator('^')) return base;
    this.consume();
    return ensureFinite(Math.pow(base, this.parseUnary()));
  }

  private parsePrimary(): number {
    const token = this.consume();
    if (token.type === 'number') return token.value;
    if (token.type === 'left-paren') {
      const value = this.parseAdditive();
      if (this.current().type !== 'right-paren') throw new Error('表达式括号不匹配');
      this.consume();
      return value;
    }
    if (token.type === 'identifier') {
      if (this.current().type === 'left-paren') {
        this.consume();
        const argument = this.parseAdditive();
        if (this.current().type !== 'right-paren') throw new Error('函数调用缺少右括号');
        this.consume();
        if (!Object.prototype.hasOwnProperty.call(FUNCTIONS, token.value)) throw new Error(`不支持的函数或常量：${token.value}`);
        const fn = FUNCTIONS[token.value];
        return ensureFinite(fn(argument));
      }
      if (Object.prototype.hasOwnProperty.call(this.variables, token.value)) return ensureFinite(this.variables[token.value]);
      if (Object.prototype.hasOwnProperty.call(CONSTANTS, token.value)) return CONSTANTS[token.value];
      throw new Error(`不支持的函数或常量：${token.value}`);
    }
    throw new Error('表达式结构无效，请检查数字、括号和运算符');
  }
}

function ensureFinite(value: number): number {
  if (!Number.isFinite(value)) throw new Error('计算结果超出定义域或数值范围');
  return Object.is(value, -0) ? 0 : value;
}

function evaluateWithVariables(expression: string, variables: Readonly<Record<string, number>>): number {
  return new NumericParser(tokenize(expression), variables).parse();
}

export function evaluateScientific(expression: string): number {
  return evaluateWithVariables(expression, {});
}

type Polynomial = Map<number, number>;

function ensureFiniteCoefficient(value: number): number {
  if (!Number.isFinite(value)) throw new Error('多项式系数必须是有限数字，计算结果超出数值范围');
  return value;
}

function polynomial(entries: readonly (readonly [number, number])[] = []): Polynomial {
  const result = new Map<number, number>();
  for (const [degree, rawCoefficient] of entries) {
    const coefficient = ensureFiniteCoefficient(rawCoefficient);
    if (Math.abs(coefficient) > 1e-12) result.set(degree, ensureFiniteCoefficient(normalizeNumber(coefficient)));
  }
  return result;
}

function addPolynomials(left: Polynomial, right: Polynomial, direction = 1): Polynomial {
  const result = new Map(left);
  for (const [degree, coefficient] of right) {
    result.set(degree, ensureFiniteCoefficient((result.get(degree) ?? 0) + direction * coefficient));
  }
  return polynomial([...result]);
}

function multiplyPolynomials(left: Polynomial, right: Polynomial): Polynomial {
  const result = new Map<number, number>();
  for (const [leftDegree, leftCoefficient] of left) {
    for (const [rightDegree, rightCoefficient] of right) {
      const degree = leftDegree + rightDegree;
      if (degree > 12) throw new Error('仅支持次数不超过 12 的多项式');
      const product = ensureFiniteCoefficient(leftCoefficient * rightCoefficient);
      result.set(degree, ensureFiniteCoefficient((result.get(degree) ?? 0) + product));
    }
  }
  return polynomial([...result]);
}

function powerPolynomial(base: Polynomial, exponent: number): Polynomial {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 12) throw new Error('多项式幂必须是 0 到 12 的整数');
  let result = polynomial([[0, 1]]);
  for (let count = 0; count < exponent; count += 1) result = multiplyPolynomials(result, base);
  return result;
}

class PolynomialParser {
  private index = 0;

  constructor(private readonly tokens: readonly Token[]) {}

  parse(): Polynomial {
    if (this.current().type === 'end') throw new Error('请输入代数表达式');
    const result = this.parseAdditive();
    if (this.current().type !== 'end') throw new Error('仅支持由 x、数字、括号和四则运算组成的多项式');
    return result;
  }

  private current(): Token { return this.tokens[this.index]; }
  private consume(): Token { const token = this.current(); this.index += 1; return token; }
  private operator(value: string): boolean { const token = this.current(); return token.type === 'operator' && token.value === value; }

  private parseAdditive(): Polynomial {
    let value = this.parseMultiplicative();
    while (this.operator('+') || this.operator('-')) {
      const operator = (this.consume() as Extract<Token, { type: 'operator' }>).value;
      value = addPolynomials(value, this.parseMultiplicative(), operator === '+' ? 1 : -1);
    }
    return value;
  }

  private startsPrimary(token: Token): boolean {
    return token.type === 'number' || token.type === 'identifier' || token.type === 'left-paren';
  }

  private parseMultiplicative(): Polynomial {
    let value = this.parseUnary();
    while (this.operator('*') || this.operator('/') || this.startsPrimary(this.current())) {
      if (this.operator('/')) {
        this.consume();
        const divisor = this.parseUnary();
        if (divisor.size !== 1 || !divisor.has(0)) throw new Error('多项式只支持除以非零常数');
        const constant = divisor.get(0)!;
        if (constant === 0) throw new Error('除数不能为零');
        value = polynomial([...value].map(([degree, coefficient]) => [degree, coefficient / constant] as const));
      } else {
        if (this.operator('*')) this.consume();
        value = multiplyPolynomials(value, this.parseUnary());
      }
    }
    return value;
  }

  private parseUnary(): Polynomial {
    if (this.operator('+')) { this.consume(); return this.parseUnary(); }
    if (this.operator('-')) {
      this.consume();
      return polynomial([...this.parseUnary()].map(([degree, coefficient]) => [degree, -coefficient] as const));
    }
    return this.parsePower();
  }

  private parsePower(): Polynomial {
    const base = this.parsePrimary();
    if (!this.operator('^')) return base;
    this.consume();
    const exponent = this.consume();
    if (exponent.type !== 'number') throw new Error('多项式幂必须使用非负整数');
    return powerPolynomial(base, exponent.value);
  }

  private parsePrimary(): Polynomial {
    const token = this.consume();
    if (token.type === 'number') return polynomial([[0, token.value]]);
    if (token.type === 'identifier') {
      if (token.value !== 'x') throw new Error('仅支持多项式，变量必须是 x');
      return polynomial([[1, 1]]);
    }
    if (token.type === 'left-paren') {
      const value = this.parseAdditive();
      if (this.current().type !== 'right-paren') throw new Error('代数表达式括号不匹配');
      this.consume();
      return value;
    }
    throw new Error('仅支持多项式，不能使用函数或其他符号');
  }
}

function parsePolynomialPart(expression: string): Polynomial {
  try {
    return new PolynomialParser(tokenize(expression)).parse();
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : '';
    if (/仅支持|多项式|代数/u.test(message)) throw reason;
    throw new Error(`仅支持多项式：${message || '表达式无效'}`);
  }
}

function parsePolynomialExpression(expression: string): Polynomial {
  const parts = expression.split('=');
  if (parts.length > 2) throw new Error('方程只能包含一个等号');
  const left = parsePolynomialPart(parts[0]);
  return parts.length === 1 ? left : addPolynomials(left, parsePolynomialPart(parts[1]), -1);
}

function polynomialDegree(value: Polynomial): number {
  return value.size ? Math.max(...value.keys()) : 0;
}

function normalizeNumber(value: number): number {
  const finiteValue = ensureFinite(value);
  const rounded = Math.round(finiteValue);
  const result = Math.abs(finiteValue - rounded) < 1e-10 ? rounded : Number(finiteValue.toPrecision(12));
  return Object.is(result, -0) ? 0 : result;
}

function formatNumber(value: number): string {
  return String(normalizeNumber(value));
}

function formatPolynomial(value: Polynomial): string {
  const entries = [...value].map(([degree, coefficient]) => [degree, ensureFiniteCoefficient(coefficient)] as const).filter(([, coefficient]) => Math.abs(coefficient) > 1e-12).sort(([a], [b]) => b - a);
  if (!entries.length) return '0';
  return entries.map(([degree, rawCoefficient], index) => {
    const coefficient = normalizeNumber(rawCoefficient);
    const absolute = Math.abs(coefficient);
    const variable = degree === 0 ? '' : degree === 1 ? 'x' : `x^${degree}`;
    const magnitude = degree > 0 && absolute === 1 ? variable : `${formatNumber(absolute)}${variable}`;
    if (index === 0) return coefficient < 0 ? `-${magnitude}` : magnitude;
    return coefficient < 0 ? ` - ${magnitude}` : ` + ${magnitude}`;
  }).join('');
}

export function simplifyAlgebra(expression: string): string {
  return formatPolynomial(parsePolynomialExpression(expression));
}

function formatLinearFactor(root: number): string {
  const normalized = normalizeNumber(root);
  return normalized < 0 ? `(x + ${formatNumber(-normalized)})` : `(x - ${formatNumber(normalized)})`;
}

export function factorAlgebra(expression: string): string {
  const value = parsePolynomialExpression(expression);
  const degree = polynomialDegree(value);
  if (degree < 2) return formatPolynomial(value);
  if (degree !== 2) throw new Error('当前因式分解支持一次式和二次式');
  const a = value.get(2) ?? 0;
  const b = value.get(1) ?? 0;
  const c = value.get(0) ?? 0;
  const discriminant = ensureFiniteCoefficient(b * b - 4 * a * c);
  if (discriminant < -1e-12) throw new Error('该二次式没有实数因式');
  const squareRoot = Math.sqrt(Math.max(0, discriminant));
  const roots = [(-b - squareRoot) / (2 * a), (-b + squareRoot) / (2 * a)].map(normalizeNumber).sort((left, right) => left - right);
  const prefix = a === 1 ? '' : a === -1 ? '-' : formatNumber(a);
  return `${prefix}${formatLinearFactor(roots[0])}${formatLinearFactor(roots[1])}`;
}

export function solveAlgebra(equation: string): number[] {
  if (!equation.includes('=')) throw new Error('解方程时需要输入等号');
  const value = parsePolynomialExpression(equation);
  const degree = polynomialDegree(value);
  if (degree === 0) throw new Error((value.get(0) ?? 0) === 0 ? '方程有无穷多个解' : '方程没有解');
  if (degree === 1) return [normalizeNumber(ensureFiniteCoefficient(-(value.get(0) ?? 0) / value.get(1)!))];
  if (degree !== 2) throw new Error('当前仅支持一次和二次方程');
  const a = value.get(2)!;
  const b = value.get(1) ?? 0;
  const c = value.get(0) ?? 0;
  const discriminant = ensureFiniteCoefficient(b * b - 4 * a * c);
  if (discriminant < -1e-12) throw new Error('方程没有实数解');
  const squareRoot = Math.sqrt(Math.max(0, discriminant));
  return [...new Set([normalizeNumber((-b - squareRoot) / (2 * a)), normalizeNumber((-b + squareRoot) / (2 * a))])].sort((left, right) => left - right);
}

export function differentiate(expression: string): string {
  const value = parsePolynomialExpression(expression);
  return formatPolynomial(polynomial([...value].filter(([degree]) => degree > 0).map(([degree, coefficient]) => [degree - 1, ensureFiniteCoefficient(degree * coefficient)] as const)));
}

function isSamplingDomainError(reason: unknown): boolean {
  return reason instanceof Error && /除数不能为零|定义域|数值范围/u.test(reason.message);
}

function evaluatePlotPoint(expression: string, x: number): PlotPoint | null {
  try {
    const y = evaluateWithVariables(expression, { x });
    return Number.isFinite(y) && Math.abs(y) <= 1_000_000 ? { x, y: normalizeNumber(y) } : null;
  } catch (reason) {
    if (!isSamplingDomainError(reason)) throw reason;
    return null;
  }
}

function intervalHasDiscontinuity(expression: string, left: PlotPoint, right: PlotPoint, depth = 6): boolean {
  const middleX = (left.x + right.x) / 2;
  const middle = evaluatePlotPoint(expression, middleX);
  if (!middle) return true;

  const endpointScale = Math.max(1, Math.abs(left.y), Math.abs(right.y));
  const middleMagnitude = Math.abs(middle.y);
  if (middleMagnitude > Math.max(50, endpointScale * 8)) return true;

  const largeSignChange = Math.sign(left.y) !== Math.sign(right.y)
    && Math.min(Math.abs(left.y), Math.abs(right.y)) > 10;
  const linearMiddle = (left.y + right.y) / 2;
  const visiblyCurved = Math.abs(middle.y - linearMiddle) > Math.max(10, endpointScale * 0.5);
  if (depth === 0) return largeSignChange;
  if (!largeSignChange && !visiblyCurved) return false;
  return intervalHasDiscontinuity(expression, left, middle, depth - 1)
    || intervalHasDiscontinuity(expression, middle, right, depth - 1);
}

export function buildPlotSeries(expression: string, domain: readonly [number, number], samples: number): PlotSample[] {
  const [minimum, maximum] = domain;
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum >= maximum) throw new Error('定义域必须是从小到大的有限数字');
  if (!Number.isInteger(samples) || samples < 2 || samples > 5000) throw new Error('采样点数量必须是 2 到 5000 的整数');
  tokenize(expression);
  const sampled: PlotSample[] = [];
  const step = (maximum - minimum) / (samples - 1);
  for (let index = 0; index < samples; index += 1) {
    const rawX = index === samples - 1 ? maximum : minimum + index * step;
    const x = Math.abs(rawX) < 1e-12 ? 0 : normalizeNumber(rawX);
    sampled.push(evaluatePlotPoint(expression, x));
  }
  const result: PlotSample[] = [];
  for (let index = 0; index < sampled.length; index += 1) {
    const point = sampled[index];
    const previous = sampled[index - 1];
    if (point && previous && intervalHasDiscontinuity(expression, previous, point) && result[result.length - 1] !== null) result.push(null);
    if (point !== null || result[result.length - 1] !== null) result.push(point);
  }
  while (result[0] === null) result.shift();
  while (result[result.length - 1] === null) result.pop();
  if (!result.some((point) => point !== null)) throw new Error('表达式在当前定义域内没有可绘制的有限结果');
  return result;
}

function validDate(input: Date | string | number): Date {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  if (!Number.isFinite(date.getTime())) throw new Error('日期无效，请检查日期和时间');
  return date;
}

export function calculateDate(input: Date | string | number, amount: number, unit: DateUnit): Date {
  const date = validDate(input);
  if (!Number.isFinite(amount)) throw new Error('日期增减数量必须是有限数字');
  if (unit === 'second') date.setUTCSeconds(date.getUTCSeconds() + amount);
  else if (unit === 'minute') date.setUTCMinutes(date.getUTCMinutes() + amount);
  else if (unit === 'hour') date.setUTCHours(date.getUTCHours() + amount);
  else if (unit === 'day') date.setUTCDate(date.getUTCDate() + amount);
  else if (unit === 'month') date.setUTCMonth(date.getUTCMonth() + amount);
  else if (unit === 'year') date.setUTCFullYear(date.getUTCFullYear() + amount);
  else throw new Error('不支持的日期单位');
  return validDate(date);
}

export function parseUnixTimestamp(value: number | string, unit: UnixTimestampUnit = 'auto'): Date {
  if (typeof value === 'string' && !value.trim()) throw new Error('Unix 时间戳不能为空');
  const numeric = typeof value === 'string' ? Number(value.trim()) : value;
  if (!Number.isFinite(numeric)) throw new Error('Unix 时间戳必须是有限数字');
  const milliseconds = unit === 'milliseconds' || (unit === 'auto' && Math.abs(numeric) >= 100_000_000_000) ? numeric : numeric * 1000;
  return validDate(milliseconds);
}

export function formatUnixTimestamp(input: Date | string | number, unit: Exclude<UnixTimestampUnit, 'auto'> = 'seconds'): number {
  const milliseconds = validDate(input).getTime();
  return unit === 'milliseconds' ? milliseconds : milliseconds / 1000;
}

export function convertTimezone(input: Date | string | number, timeZone: string): string {
  const date = validDate(input);
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
  } catch {
    throw new Error(`无效时区：${timeZone}`);
  }
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export type UnitDefinition = {
  id: string;
  label: string;
  category: UnitCategory;
  factor?: number;
};

export const UNIT_CATEGORY_LABELS: Readonly<Record<UnitCategory, string>> = {
  length: '长度', mass: '质量', temperature: '温度', data: '数据容量', area: '面积', volume: '体积', speed: '速度',
};

export const UNIT_DEFINITIONS: readonly UnitDefinition[] = [
  { id: 'meter', label: '米', category: 'length', factor: 1 },
  { id: 'kilometer', label: '千米', category: 'length', factor: 1000 },
  { id: 'centimeter', label: '厘米', category: 'length', factor: 0.01 },
  { id: 'millimeter', label: '毫米', category: 'length', factor: 0.001 },
  { id: 'inch', label: '英寸', category: 'length', factor: 0.0254 },
  { id: 'foot', label: '英尺', category: 'length', factor: 0.3048 },
  { id: 'yard', label: '码', category: 'length', factor: 0.9144 },
  { id: 'mile', label: '英里', category: 'length', factor: 1609.344 },
  { id: 'gram', label: '克', category: 'mass', factor: 1 },
  { id: 'kilogram', label: '千克', category: 'mass', factor: 1000 },
  { id: 'milligram', label: '毫克', category: 'mass', factor: 0.001 },
  { id: 'tonne', label: '吨', category: 'mass', factor: 1_000_000 },
  { id: 'ounce', label: '盎司', category: 'mass', factor: 28.349523125 },
  { id: 'pound', label: '磅', category: 'mass', factor: 453.59237 },
  { id: 'celsius', label: '摄氏度', category: 'temperature' },
  { id: 'fahrenheit', label: '华氏度', category: 'temperature' },
  { id: 'kelvin', label: '开尔文', category: 'temperature' },
  { id: 'byte', label: '字节', category: 'data', factor: 1 },
  { id: 'kilobyte', label: '千字节（KB）', category: 'data', factor: 1000 },
  { id: 'megabyte', label: '兆字节（MB）', category: 'data', factor: 1_000_000 },
  { id: 'gigabyte', label: '吉字节（GB）', category: 'data', factor: 1_000_000_000 },
  { id: 'kibibyte', label: '二进制千字节（KiB）', category: 'data', factor: 1024 },
  { id: 'mebibyte', label: '二进制兆字节（MiB）', category: 'data', factor: 1_048_576 },
  { id: 'gibibyte', label: '二进制吉字节（GiB）', category: 'data', factor: 1_073_741_824 },
  { id: 'square-meter', label: '平方米', category: 'area', factor: 1 },
  { id: 'square-kilometer', label: '平方千米', category: 'area', factor: 1_000_000 },
  { id: 'hectare', label: '公顷', category: 'area', factor: 10_000 },
  { id: 'acre', label: '英亩', category: 'area', factor: 4046.8564224 },
  { id: 'square-foot', label: '平方英尺', category: 'area', factor: 0.09290304 },
  { id: 'liter', label: '升', category: 'volume', factor: 1 },
  { id: 'milliliter', label: '毫升', category: 'volume', factor: 0.001 },
  { id: 'cubic-meter', label: '立方米', category: 'volume', factor: 1000 },
  { id: 'gallon-us', label: '美制加仑', category: 'volume', factor: 3.785411784 },
  { id: 'cup-us', label: '美制杯', category: 'volume', factor: 0.2365882365 },
  { id: 'meter-per-second', label: '米/秒', category: 'speed', factor: 1 },
  { id: 'kilometer-per-hour', label: '千米/小时', category: 'speed', factor: 1 / 3.6 },
  { id: 'mile-per-hour', label: '英里/小时', category: 'speed', factor: 0.44704 },
  { id: 'knot', label: '节', category: 'speed', factor: 0.5144444444444445 },
];

function toCelsius(value: number, unit: string): number {
  if (unit === 'celsius') return value;
  if (unit === 'fahrenheit') return (value - 32) * 5 / 9;
  return value - 273.15;
}

function fromCelsius(value: number, unit: string): number {
  if (unit === 'celsius') return value;
  if (unit === 'fahrenheit') return value * 9 / 5 + 32;
  return value + 273.15;
}

export function convertUnit(value: number, from: string, to: string): number {
  if (!Number.isFinite(value)) throw new Error('换算数值必须是有限数字');
  const source = UNIT_DEFINITIONS.find((unit) => unit.id === from);
  const target = UNIT_DEFINITIONS.find((unit) => unit.id === to);
  if (!source || !target) throw new Error(`未知单位：${!source ? from : to}`);
  if (source.category !== target.category) throw new Error('不同类别的单位不能直接换算');
  if (source.category === 'temperature') return normalizeNumber(fromCelsius(toCelsius(value, source.id), target.id));
  return normalizeNumber(value * source.factor! / target.factor!);
}
