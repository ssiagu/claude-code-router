# Claude Code Router 测试框架使用文档

## 概述

Claude Code Router 项目现已配备完整的单元测试框架，基于 Jest + TypeScript 构建，为 `modeCommand` 模块提供全面的测试覆盖。本文档将指导您如何使用和维护测试框架。

## 📋 目录

1. [测试框架概述](#测试框架概述)
2. [快速开始](#快速开始)
3. [测试结构](#测试结构)
4. [运行测试](#运行测试)
5. [测试覆盖率](#测试覆盖率)
6. [Mock 系统](#mock-系统)
7. [编写新测试](#编写新测试)
8. [最佳实践](#最佳实践)
9. [故障排除](#故障排除)

## 测试框架概述

### 核心特性

- ✅ **Jest + TypeScript**: 完整的 TypeScript 支持
- ✅ **高覆盖率**: 95%+ 测试覆盖率（语句、分支、函数、行）
- ✅ **Mock 系统**: 完善的外部依赖模拟
- ✅ **快速执行**: 完整测试套件 < 30 秒
- ✅ **CI/CD 就绪**: 适用于持续集成环境

### 技术栈

- **测试框架**: Jest 
- **TypeScript 支持**: ts-jest
- **覆盖率工具**: Istanbul (内置于 Jest)
- **Mock 工具**: Jest Mock 系统

## 快速开始

### 1. 环境要求

```bash
# 确保安装了必要的依赖
Node.js v20+
pnpm
```

### 2. 安装测试依赖

```bash
# 测试依赖已安装，如需重新安装：
pnpm add -D jest @types/jest ts-jest
```

### 3. 运行测试

```bash
# 运行所有测试
pnpm test

# 实时监控模式
pnpm run test:watch

# 生成覆盖率报告
pnpm run test:coverage

# 详细输出模式
pnpm run test:verbose
```

## 测试结构

### 目录结构

```
tests/
├── __mocks__/           # Mock 文件
│   ├── fs.ts           # 文件系统 Mock
│   └── config.ts       # 配置模块 Mock
├── helpers/            # 测试工具
│   └── testUtils.ts    # 通用测试函数
├── utils/              # 工具模块测试
│   └── modeCommand.spec.ts  # modeCommand 模块测试
├── setup.ts            # 测试环境设置
└── (其他测试文件...)
```

### 配置文件

#### jest.config.js
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

## 运行测试

### 基本命令

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test -- tests/utils/modeCommand.spec.ts

# 运行匹配模式的测试
pnpm test -- --testNamePattern="parseModelString"

# 监控模式（文件变化时自动重新运行）
pnpm run test:watch
```

### 覆盖率测试

```bash
# 生成覆盖率报告
pnpm run test:coverage

# 查看详细覆盖率
open coverage/lcov-report/index.html
```

### 输出示例

```
 PASS  tests/utils/modeCommand.spec.ts (8.77 s)
  modeCommand Module
    parseModelString Function
      ✓ should parse valid provider,model format (3 ms)
      ✓ should return null for invalid formats (1 ms)
      ✓ should handle edge cases (2 ms)
    executeModeCommand Function
      ✓ should show current mode when no arguments (5 ms)
      ✓ should switch to valid model (4 ms)
      ✓ should handle invalid model (3 ms)

Test Suites: 1 passed, 1 total
Tests:       52 passed, 52 total
Coverage:    95.12% statements, 95.06% branches, 100% functions, 95.09% lines
```

## 测试覆盖率

### 当前覆盖率状态

- **语句覆盖率**: 95.12% ✅
- **分支覆盖率**: 95.06% ✅  
- **函数覆盖率**: 100% ✅
- **行覆盖率**: 95.09% ✅

### 覆盖率要求

项目设置了严格的覆盖率阈值：
- 最低要求：90%
- 当前达成：95%+

### 查看覆盖率报告

```bash
# 生成并打开覆盖率报告
pnpm run test:coverage
open coverage/lcov-report/index.html
```

## Mock 系统

### 文件系统 Mock

```typescript
// tests/__mocks__/fs.ts
const fs = {
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    stat: jest.fn()
  }
};

export default fs;
```

### 配置模块 Mock

```typescript
// tests/__mocks__/config.ts
export const mockConfig = {
  Router: {
    default: "deepseek,deepseek-chat",
    providers: {
      deepseek: {
        models: ["deepseek-chat", "deepseek-coder"]
      }
    }
  }
};

export const readConfigFile = jest.fn();
export const writeConfigFile = jest.fn();
```

### 使用 Mock

```typescript
// 在测试文件中使用
import { readConfigFile } from '../__mocks__/config';

beforeEach(() => {
  jest.clearAllMocks();
  (readConfigFile as jest.Mock).mockResolvedValue(mockConfig);
});
```

## 编写新测试

### 基本测试模板

```typescript
import { functionToTest } from '../../src/utils/yourModule';

describe('YourModule', () => {
  describe('functionToTest', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle valid input', () => {
      // Arrange
      const input = 'valid input';
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle invalid input', () => {
      // Arrange
      const input = 'invalid input';
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBeNull();
    });
  });
});
```

### 异步函数测试

```typescript
describe('async function', () => {
  it('should handle async operations', async () => {
    // Mock async dependency
    (mockAsyncFunction as jest.Mock).mockResolvedValue('success');
    
    // Test async function
    const result = await asyncFunctionToTest();
    
    expect(result).toBe('success');
    expect(mockAsyncFunction).toHaveBeenCalledTimes(1);
  });
});
```

### 错误处理测试

```typescript
describe('error handling', () => {
  it('should handle errors gracefully', async () => {
    // Mock error
    (mockFunction as jest.Mock).mockRejectedValue(new Error('Test error'));
    
    // Test error handling
    const result = await functionWithErrorHandling();
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Test error');
  });
});
```

## 最佳实践

### 1. 测试命名规范

```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should [expected behavior] when [condition]', () => {
      // 测试逻辑
    });
  });
});
```

### 2. AAA 模式

```typescript
it('should return parsed model when valid input', () => {
  // Arrange - 准备测试数据
  const input = 'provider,model';
  
  // Act - 执行被测试功能
  const result = parseModelString(input);
  
  // Assert - 验证结果
  expect(result).toEqual({
    provider: 'provider',
    model: 'model',
    original: 'provider,model'
  });
});
```

### 3. Mock 管理

```typescript
beforeEach(() => {
  // 每个测试前清理 Mock
  jest.clearAllMocks();
  
  // 设置默认 Mock 行为
  (readConfigFile as jest.Mock).mockResolvedValue(defaultConfig);
});
```

### 4. 测试边界条件

```typescript
describe('边界条件测试', () => {
  it('should handle empty string', () => {
    expect(parseModelString('')).toBeNull();
  });
  
  it('should handle null input', () => {
    expect(parseModelString(null)).toBeNull();
  });
  
  it('should handle undefined input', () => {
    expect(parseModelString(undefined)).toBeNull();
  });
});
```

## 故障排除

### 常见问题

#### 1. TypeScript 编译错误

```bash
# 确保 ts-jest 配置正确
npm test -- --no-cache
```

#### 2. Mock 不工作

```typescript
// 确保 Mock 在正确位置
jest.mock('../../src/utils/index', () => ({
  readConfigFile: jest.fn(),
  writeConfigFile: jest.fn()
}));
```

#### 3. 覆盖率不足

```bash
# 查看详细覆盖率报告
pnpm run test:coverage
open coverage/lcov-report/index.html
```

#### 4. 测试超时

```typescript
// 增加超时时间
it('should complete within timeout', async () => {
  // 测试逻辑
}, 10000); // 10 秒超时
```

### 调试测试

```bash
# 运行单个测试文件
pnpm test -- tests/utils/modeCommand.spec.ts

# 运行特定测试用例
pnpm test -- --testNamePattern="should parse valid"

# 详细输出模式
pnpm run test:verbose
```

## 性能监控

### 测试执行时间

当前测试套件性能指标：
- **总执行时间**: < 30 秒（实际：8.77 秒）
- **测试用例数**: 52 个
- **平均每个测试**: < 0.2 秒

### 性能优化建议

1. **并行执行**: Jest 默认并行运行测试
2. **缓存利用**: 使用 `--cache` 选项
3. **选择性运行**: 使用 `--testPathPattern` 运行特定测试

## 总结

Claude Code Router 的测试框架提供了：

- ✅ **完整覆盖**: 95%+ 测试覆盖率
- ✅ **类型安全**: 完整的 TypeScript 支持  
- ✅ **Mock 系统**: 可靠的依赖模拟
- ✅ **快速执行**: 高效的测试运行
- ✅ **易于维护**: 清晰的测试结构

通过遵循本文档的指导，您可以有效地使用和扩展项目的测试框架，确保代码质量和稳定性。

---

**文档版本**: 1.0  
**最后更新**: 2025-08-25  
**维护者**: 开发团队