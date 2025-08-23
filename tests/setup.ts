/**
 * Jest 测试环境设置
 * 
 * 配置全局测试环境和公共Mock设置
 */

// 设置测试超时
jest.setTimeout(10000);

// 抑制console.log在测试中的输出（除非测试失败）
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// 每个测试后清理模拟
afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});