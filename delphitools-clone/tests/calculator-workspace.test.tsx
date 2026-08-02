/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ToolPage } from '../src/app/ToolPage';
import { renderAfterLazy } from './render-after-lazy';

afterEach(cleanup);

async function renderTool(toolId: string) {
  return renderAfterLazy(<ToolPage toolId={toolId} />);
}

describe('五个计算入口', () => {
  it.each([
    ['algebra-calc', '代数表达式或方程'],
    ['graph-calc', '函数表达式（每行一个）'],
    ['sci-calc', '科学计算表达式'],
    ['time-calc', 'Unix 时间戳'],
    ['unit-converter', '单位类别'],
  ])('%s 显示专属中文控件', async (toolId, label) => {
    const { unmount } = await renderTool(toolId);
    expect(screen.getByLabelText(label)).toBeVisible();
    expect(document.querySelector('.calculator-workspace')).not.toBeNull();
    unmount();
  });

  it('只接管五个计算入口，PDF 工具使用高级工作区', async () => {
    await renderTool('pdf-preflight');
    expect(screen.getByLabelText('PDF 印刷预检 工作区')).toBeVisible();
    expect(document.querySelector('.calculator-workspace')).toBeNull();
  });
});

describe('计算工作台关键交互', () => {
  it('科学计算器支持键盘输入、数字键盘、历史、删除与清空', async () => {
    const user = userEvent.setup();
    await renderTool('sci-calc');

    const input = screen.getByLabelText('科学计算表达式');
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: '数字 2' }));
    await user.click(screen.getByRole('button', { name: '加号' }));
    await user.click(screen.getByRole('button', { name: '数字 3' }));
    await user.click(screen.getByRole('button', { name: '计算结果' }));
    expect(screen.getByLabelText('科学计算结果')).toHaveTextContent('5');
    expect(screen.getByLabelText('计算历史')).toHaveTextContent('2+3 = 5');

    await user.type(input, '4');
    await user.click(screen.getByRole('button', { name: '删除一位' }));
    expect(input).toHaveValue('2+3');
    await user.click(screen.getByRole('button', { name: '清空表达式' }));
    expect(input).toHaveValue('');
  });

  it('科学计算失败时显示中文错误并清除旧结果', async () => {
    const user = userEvent.setup();
    await renderTool('sci-calc');
    const input = screen.getByLabelText('科学计算表达式');
    await user.clear(input);
    await user.type(input, '2+2');
    await user.click(screen.getByRole('button', { name: '计算结果' }));
    expect(screen.getByLabelText('科学计算结果')).toHaveTextContent('4');

    await user.clear(input);
    await user.type(input, '1/0');
    await user.click(screen.getByRole('button', { name: '计算结果' }));
    expect(screen.getByRole('alert')).toHaveTextContent('除数不能为零');
    expect(screen.queryByLabelText('科学计算结果')).not.toBeInTheDocument();
  });

  it('科学计算器提供角度、Ans 和完整科学键盘', async () => {
    const user = userEvent.setup();
    await renderTool('sci-calc');

    const degree = screen.getByRole('button', { name: '角度制 DEG' });
    const radians = screen.getByRole('button', { name: '弧度制 RAD' });
    expect(degree).toHaveAttribute('aria-pressed', 'false');
    expect(radians).toHaveAttribute('aria-pressed', 'true');
    await user.click(degree);
    expect(degree).toHaveAttribute('aria-pressed', 'true');

    for (const name of ['正弦 sin', '余弦 cos', '正切 tan', '反正弦', '反余弦', '反正切', '常用对数 log', '自然对数 ln', '阶乘', '绝对值', '圆周率 π', '自然常数 e', '上次结果 Ans', '科学计数法 EE', '取模 mod', '幂 xʸ', 'n 次方根']) {
      expect(screen.getByRole('button', { name })).toBeVisible();
    }

    const input = screen.getByLabelText('科学计算表达式');
    await user.clear(input);
    await user.type(input, '3+4');
    await user.click(screen.getByRole('button', { name: '计算结果' }));
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: '上次结果 Ans' }));
    await user.click(screen.getByRole('button', { name: '乘号' }));
    await user.click(screen.getByRole('button', { name: '数字 2' }));
    await user.click(screen.getByRole('button', { name: '计算结果' }));
    expect(screen.getByLabelText('科学计算结果')).toHaveTextContent('14');

    await user.click(screen.getByRole('button', { name: '清空历史' }));
    expect(screen.getByLabelText('计算历史')).toHaveTextContent('完成一次计算后会显示在这里');
  });

  it('代数工具分开展示化简、因式分解、解方程和求导', async () => {
    await renderTool('algebra-calc');
    fireEvent.change(screen.getByLabelText('代数表达式或方程'), { target: { value: 'x^2 - 5x + 6 = 0' } });
    expect(screen.getByRole('region', { name: '化简结果' })).toBeVisible();
    expect(screen.getByRole('region', { name: '因式分解结果' })).toHaveTextContent('(x - 2)(x - 3)');
    expect(screen.getByRole('region', { name: '方程解' })).toHaveTextContent('x = 2、3');
    expect(screen.getByRole('region', { name: '求导结果' })).toBeVisible();
    expect(screen.getByText(/中文示例/)).toBeVisible();
  });

  it('函数绘图显示坐标轴、多条曲线，并按断点拆分路径', async () => {
    await renderTool('graph-calc');
    fireEvent.change(screen.getByLabelText('函数表达式（每行一个）'), { target: { value: 'x\n1/x' } });
    const chart = screen.getByRole('img', { name: '函数曲线图' });
    expect(within(chart).getByText('x')).toBeVisible();
    expect(within(chart).getByText('y')).toBeVisible();
    expect(chart.querySelectorAll('path[data-expression="x"]')).toHaveLength(1);
    expect(chart.querySelectorAll('path[data-expression="1/x"]')).toHaveLength(2);
    expect(screen.getByText(/定义域：/)).toBeVisible();
  });

  it('函数绘图不会把超限常量投影为伪曲线或非有限 SVG 坐标', async () => {
    await renderTool('graph-calc');
    fireEvent.change(screen.getByLabelText('函数表达式（每行一个）'), { target: { value: '1e308' } });
    const chart = screen.getByRole('img', { name: '函数曲线图' });
    expect(chart.querySelector('path[data-expression="1e308"]')).toBeNull();
    expect(chart.innerHTML).not.toMatch(/Infinity|NaN/u);
  });

  it('时间工具完成时间戳转换、日期加减与时区转换', async () => {
    const user = userEvent.setup();
    await renderTool('time-calc');

    const timestamp = screen.getByLabelText('Unix 时间戳');
    await user.clear(timestamp);
    await user.type(timestamp, '-1');
    await user.click(screen.getByRole('button', { name: '转换时间戳' }));
    expect(screen.getByLabelText('时间戳转换结果')).toHaveTextContent('1969-12-31T23:59:59.000Z');

    fireEvent.change(screen.getByLabelText('起始日期时间'), { target: { value: '2024-02-28T00:00' } });
    fireEvent.change(screen.getByLabelText('增减数量'), { target: { value: '1' } });
    await user.click(screen.getByRole('button', { name: '计算日期' }));
    expect(screen.getByLabelText('日期计算结果')).toHaveTextContent('2024-02-29');

    fireEvent.change(screen.getByLabelText('目标时区'), { target: { value: 'Asia/Shanghai' } });
    await user.click(screen.getByRole('button', { name: '转换时区' }));
    expect(screen.getByLabelText('时区转换结果')).toHaveTextContent('08:00:00');
    expect(screen.getByText(/本地时区/)).toBeVisible();
  });

  it('时间工具把日期双向转换为带精度的 Unix 秒和整数毫秒', async () => {
    const user = userEvent.setup();
    await renderTool('time-calc');

    fireEvent.change(screen.getByLabelText('日期转时间戳输入'), { target: { value: '1969-12-31T23:59:59.999' } });
    await user.click(screen.getByRole('button', { name: '日期转 Unix 时间戳' }));
    expect(screen.getByLabelText('日期转时间戳结果')).toHaveTextContent('-0.001 秒');

    await user.selectOptions(screen.getByLabelText('输出时间戳单位'), 'milliseconds');
    await user.click(screen.getByRole('button', { name: '日期转 Unix 时间戳' }));
    expect(screen.getByLabelText('日期转时间戳结果')).toHaveTextContent('-1 毫秒');
  });

  it('单位换算按类别更新单位并保留输入数值', async () => {
    const user = userEvent.setup();
    await renderTool('unit-converter');
    const value = screen.getByLabelText('换算数值');
    await user.clear(value);
    await user.type(value, '1');
    await user.selectOptions(screen.getByLabelText('单位类别'), 'data');
    await user.selectOptions(screen.getByLabelText('原始单位'), 'mebibyte');
    await user.selectOptions(screen.getByLabelText('目标单位'), 'byte');
    expect(value).toHaveValue(1);
    expect(screen.getByLabelText('单位换算结果')).toHaveTextContent('1048576 字节');
  });
});
