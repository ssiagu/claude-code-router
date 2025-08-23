/**
 * 测试工具函数
 * 
 * 提供通用的测试辅助功能和Mock数据
 */

/**
 * 有效的测试配置对象
 */
export const validConfig = {
  Providers: [
    {
      name: 'deepseek',
      models: ['deepseek-chat', 'deepseek-coder'],
      apiKey: 'test-deepseek-key'
    },
    {
      name: 'openrouter',
      models: ['gpt-4', 'claude-3-sonnet'],
      apiKey: 'test-openrouter-key'
    },
    {
      name: 'anthropic',
      models: ['claude-3-haiku', 'claude-3-sonnet'],
      apiKey: 'test-anthropic-key'
    }
  ],
  Router: {
    default: 'deepseek,deepseek-chat',
    background: 'openrouter,gpt-4',
    reasoning: 'anthropic,claude-3-sonnet'
  }
};

/**
 * 无效的测试配置对象（缺少必要字段）
 */
export const invalidConfig = {
  Providers: [
    {
      // 缺少name字段
      models: ['test-model']
    }
  ]
  // 缺少Router字段
};

/**
 * 空的测试配置对象
 */
export const emptyConfig = {
  Providers: [],
  Router: {}
};

/**
 * 配置缺少默认模型的测试配置
 */
export const configWithoutDefault = {
  Providers: [
    {
      name: 'deepseek',
      models: ['deepseek-chat']
    }
  ],
  Router: {
    // 缺少default字段
    background: 'deepseek,deepseek-chat'
  }
};

/**
 * 创建Mock的fs统计对象
 */
export function createMockStats(mtime: Date = new Date()): any {
  return {
    mtime,
    atime: mtime,
    ctime: mtime,
    birthtime: mtime,
    size: 1024,
    mode: 33188,
    uid: 0,
    gid: 0,
    ino: 1,
    dev: 1,
    nlink: 1,
    rdev: 0,
    blksize: 4096,
    blocks: 8,
    isFile: jest.fn().mockReturnValue(true),
    isDirectory: jest.fn().mockReturnValue(false),
    isSymbolicLink: jest.fn().mockReturnValue(false),
    isBlockDevice: jest.fn().mockReturnValue(false),
    isCharacterDevice: jest.fn().mockReturnValue(false),
    isFIFO: jest.fn().mockReturnValue(false),
    isSocket: jest.fn().mockReturnValue(false)
  };
}

/**
 * 创建文件不存在的错误对象
 */
export function createFileNotFoundError() {
  const error = new Error('ENOENT: no such file or directory') as any;
  error.code = 'ENOENT';
  error.errno = -2;
  error.syscall = 'open';
  return error;
}

/**
 * 创建权限错误对象
 */
export function createPermissionError() {
  const error = new Error('EACCES: permission denied') as any;
  error.code = 'EACCES';
  error.errno = -13;
  error.syscall = 'open';
  return error;
}

/**
 * 创建JSON解析错误对象
 */
export function createJsonParseError() {
  const error = new Error('Unexpected token in JSON at position 0');
  error.name = 'SyntaxError';
  return error;
}

/**
 * 等待指定毫秒数（用于异步测试）
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 断言结果对象的基本结构
 */
export function expectModeCommandResult(result: any) {
  expect(result).toBeDefined();
  expect(typeof result.success).toBe('boolean');
  expect(typeof result.message).toBe('string');
}

/**
 * 断言成功结果的结构
 */
export function expectSuccessResult(result: any) {
  expectModeCommandResult(result);
  expect(result.success).toBe(true);
  expect(result.message.length).toBeGreaterThan(0);
}

/**
 * 断言失败结果的结构
 */
export function expectFailureResult(result: any) {
  expectModeCommandResult(result);
  expect(result.success).toBe(false);
  expect(result.message.length).toBeGreaterThan(0);
}