# Claude Code Router - ccr mode 命令架构文档

## 📋 文档信息

- **文档版本**: v1.0
- **创建日期**: 2025-01-23
- **最后更新**: 2025-01-23
- **架构师**: Winston
- **项目**: Claude Code Router - ccr mode 功能
- **基于**: docs/pro.md (PRD v1.0)

---

## 1. 架构概述

### 1.1 设计原则

#### 1.1.1 核心架构原则
- **单一职责原则**: 每个模块专注于单一功能
- **开闭原则**: 对扩展开放，对修改封闭
- **依赖倒置原则**: 依赖抽象而非具体实现
- **最小影响原则**: 新功能对现有系统的影响最小化

#### 1.1.2 性能与安全原则
- **响应时间优先**: 命令执行 < 500ms
- **数据完整性**: 配置文件原子性操作
- **错误恢复**: 完整的错误处理和回滚机制
- **向后兼容**: 不破坏现有API和功能

### 1.2 架构目标

#### 1.2.1 功能目标
- 实现 `ccr mode` 命令的完整功能集
- 提供安全的配置管理机制
- 建立可扩展的命令处理框架

#### 1.2.2 质量目标
- 代码覆盖率 > 90%
- 命令执行成功率 > 99%
- 配置完整性保证 100%

## 2. 系统架构

### 2.1 整体架构图

```
                    ┌─────────────────┐
                    │   CLI Interface │
                    │    (cli.ts)     │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │ Command Router  │
                    │ (mode command)  │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │  Mode Command   │
                    │    Handler      │
                    │(modeCommand.ts) │
                    └─────┬─────┬─────┘
                          │     │
              ┌───────────▼─┐ ┌─▼─────────────┐
              │ Config Mgr  │ │ Model Validator│
              │(index.ts)   │ │(router.ts)     │
              └─────────────┘ └────────────────┘
                          │
                    ┌─────▼─────┐
                    │config.json│
                    │   File    │
                    └───────────┘
```

### 2.2 模块责任矩阵

| 模块 | 职责 | 输入 | 输出 | 依赖 |
|------|------|------|------|------|
| CLI Interface | 命令解析和路由 | 用户命令 | 执行结果 | Command Router |
| Mode Command Handler | 模式管理逻辑 | 解析后的参数 | 操作结果 | Config Manager, Validator |
| Config Manager | 配置文件管理 | 配置操作请求 | 操作状态 | File System |
| Model Validator | 模型验证 | 模型标识 | 验证结果 | 配置数据 |

## 3. 详细设计

### 3.1 核心模块设计

#### 3.1.1 CLI 命令扩展 (cli.ts)

**现有架构集成:**
```typescript
// 在现有的 CLI 命令处理器中添加 mode 命令
const commands = {
  start: startCommand,
  stop: stopCommand,
  restart: restartCommand,
  status: statusCommand,
  statusline: statuslineCommand,
  code: codeCommand,
  ui: uiCommand,
  mode: modeCommand,        // 🆕 新增
  version: versionCommand,
  help: helpCommand
};
```

**设计要点:**
- 复用现有的命令处理框架
- 保持与其他命令的一致性
- 最小化对现有代码的修改

#### 3.1.2 模式命令处理器 (modeCommand.ts)

**核心接口设计:**
```typescript
/**
 * 模式命令执行结果
 */
export interface ModeCommandResult {
  success: boolean;
  message: string;
  previousModel?: string;
  newModel?: string;
  availableModels?: string[];
}

/**
 * 解析后的模型信息
 */
export interface ModelParsed {
  provider: string;
  model: string;
  original: string;
}
```

**主要函数架构:**
```typescript
/**
 * 主入口函数 - 处理所有 mode 命令变体
 */
export async function executeModeCommand(args: string[]): Promise<ModeCommandResult>

/**
 * 显示当前模式信息
 */
export async function showCurrentMode(): Promise<ModeCommandResult>

/**
 * 更新默认模型配置
 */
export async function updateDefaultModel(
  provider: string, 
  model: string
): Promise<ModeCommandResult>

/**
 * 解析模型字符串 "provider,model"
 */
export function parseModelString(modelString: string): ModelParsed | null

/**
 * 获取当前默认模型
 */
export function getCurrentDefaultModel(config: any): string
```

### 3.2 数据流设计

#### 3.2.1 命令执行流程

```
用户输入
    │
    ▼
┌─────────────────┐
│ CLI 参数解析    │
│ (cli.ts)        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 命令类型判断    │
│ mode/mode --show│
└─────────┬───────┘
          │
    ┌─────▼─────┐
    │ 参数验证  │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ 模型验证  │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ 配置更新  │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ 结果返回  │
    └───────────┘
```

#### 3.2.2 错误处理流程

```
输入验证失败
    │
    ▼
┌─────────────────┐
│ 错误类型识别    │
└─────────┬───────┘
          │
    ┌─────▼─────┐
    │ 格式错误  │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ 提供商不存在│
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ 模型不存在 │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ 错误信息格式化│
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ 帮助信息显示│
    └───────────┘
```

### 3.3 配置管理架构

#### 3.3.1 配置文件结构

**现有配置结构 (config.json):**
```json
{
  "Router": {
    "default": "provider,model",
    "background": "provider,model",
    "reasoning": "provider,model",
    // ... 其他路由配置
  },
  "Providers": {
    "provider_name": {
      "models": ["model1", "model2"],
      // ... 其他配置
    }
  }
}
```

**修改目标:**
- 只修改 `Router.default` 字段
- 保持其他配置不变
- 确保配置文件格式完整性

#### 3.3.2 配置操作安全性

**原子性操作设计:**
```typescript
async function updateConfigSafely(updateFn: (config: any) => void): Promise<boolean> {
  // 1. 读取当前配置
  const config = await readConfigFile();
  
  // 2. 创建备份
  const backup = JSON.parse(JSON.stringify(config));
  
  try {
    // 3. 执行更新
    updateFn(config);
    
    // 4. 验证配置完整性
    validateConfig(config);
    
    // 5. 写入文件
    await writeConfigFile(config);
    
    return true;
  } catch (error) {
    // 6. 错误恢复
    await writeConfigFile(backup);
    throw error;
  }
}
```

## 4. 技术实现细节

### 4.1 模型验证机制

#### 4.1.1 验证策略

**复用现有验证逻辑:**
- 利用 `src/utils/router.ts` 中的模型验证函数
- 复用 `src/middleware/commandParser.ts` 中的格式化逻辑
- 保持验证规则的一致性

**验证步骤:**
```typescript
function validateModel(provider: string, model: string): ValidationResult {
  // 1. 提供商存在性验证
  if (!providers[provider]) {
    return { valid: false, error: 'PROVIDER_NOT_FOUND' };
  }
  
  // 2. 模型存在性验证
  const providerModels = providers[provider].models;
  if (!providerModels.includes(model)) {
    return { valid: false, error: 'MODEL_NOT_FOUND' };
  }
  
  // 3. 格式规范验证
  if (!isValidFormat(`${provider},${model}`)) {
    return { valid: false, error: 'INVALID_FORMAT' };
  }
  
  return { valid: true };
}
```

### 4.2 错误处理架构

#### 4.2.1 错误分类系统

```typescript
enum ModeCommandError {
  INVALID_FORMAT = 'INVALID_FORMAT',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  CONFIG_READ_ERROR = 'CONFIG_READ_ERROR',
  CONFIG_WRITE_ERROR = 'CONFIG_WRITE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}
```

#### 4.2.2 用户友好错误消息

```typescript
const ERROR_MESSAGES = {
  [ModeCommandError.INVALID_FORMAT]: {
    message: '❌ 错误: 命令格式不正确。',
    hint: '💡 提示: 使用 \'ccr mode <provider>,<model>\' 格式来指定模型'
  },
  [ModeCommandError.PROVIDER_NOT_FOUND]: {
    message: (provider: string) => `❌ 错误: 提供商 '${provider}' 在配置中不存在。`,
    hint: '💡 可用提供商: {availableProviders}'
  },
  [ModeCommandError.MODEL_NOT_FOUND]: {
    message: (provider: string, model: string) => 
      `❌ 错误: 模型 '${provider},${model}' 在配置中不存在。`,
    hint: '💡 该提供商的可用模型: {availableModels}'
  }
};
```

### 4.3 性能优化设计

#### 4.3.1 缓存策略

**配置缓存:**
- 避免重复读取配置文件
- 监听配置文件变化
- 智能缓存失效

**模型列表缓存:**
- 缓存可用模型列表
- 减少重复计算
- 内存优化

```typescript
class ConfigCache {
  private static cache: any = null;
  private static lastModified: number = 0;
  
  static async getConfig(): Promise<any> {
    const currentModified = await getConfigFileModified();
    
    if (!this.cache || currentModified > this.lastModified) {
      this.cache = await readConfigFile();
      this.lastModified = currentModified;
    }
    
    return this.cache;
  }
  
  static invalidate(): void {
    this.cache = null;
    this.lastModified = 0;
  }
}
```

## 5. 集成架构

### 5.1 与现有系统集成

#### 5.1.1 CLI 命令系统集成

**最小修改原则:**
- 在现有 `cli.ts` 中添加 mode 命令入口
- 复用现有的命令处理框架
- 保持命令行参数解析的一致性

**集成点:**
```typescript
// cli.ts 中的修改
import { executeModeCommand } from './utils/modeCommand';

// 在命令处理器中添加
case 'mode':
  result = await executeModeCommand(args);
  break;
```

#### 5.1.2 配置系统集成

**复用现有工具:**
- 使用 `src/utils/index.ts` 中的配置读写函数
- 保持配置文件格式的兼容性
- 集成现有的错误处理机制

### 5.2 服务生命周期集成

#### 5.2.1 热更新支持

**配置更新后的服务同步:**
```typescript
async function updateDefaultModel(provider: string, model: string): Promise<ModeCommandResult> {
  // 1. 更新配置文件
  await updateConfig(provider, model);
  
  // 2. 通知运行中的服务 (如果存在)
  if (await isServerRunning()) {
    await notifyServerConfigChanged();
  }
  
  // 3. 返回操作结果
  return {
    success: true,
    message: `✅ 默认模型已成功切换为: ${provider},${model}`,
    newModel: `${provider},${model}`
  };
}
```

## 6. 安全架构

### 6.1 配置文件安全

#### 6.1.1 文件权限控制

**安全措施:**
- 配置文件读写权限验证
- 临时文件安全处理
- 备份文件权限控制

```typescript
async function secureConfigOperation<T>(operation: () => Promise<T>): Promise<T> {
  // 1. 验证文件权限
  await validateFilePermissions();
  
  // 2. 获取文件锁
  const lock = await acquireFileLock();
  
  try {
    // 3. 执行操作
    return await operation();
  } finally {
    // 4. 释放文件锁
    await lock.release();
  }
}
```

#### 6.1.2 并发控制

**防止配置冲突:**
- 文件锁机制
- 原子性操作保证
- 冲突检测和恢复

### 6.2 输入验证安全

#### 6.2.1 参数验证

**防护措施:**
- 严格的参数格式验证
- 特殊字符过滤
- 长度限制检查

```typescript
function validateUserInput(provider: string, model: string): ValidationResult {
  // 1. 基本格式检查
  if (!provider || !model) {
    return { valid: false, error: 'MISSING_PARAMETERS' };
  }
  
  // 2. 长度限制
  if (provider.length > 50 || model.length > 100) {
    return { valid: false, error: 'PARAMETER_TOO_LONG' };
  }
  
  // 3. 特殊字符检查
  if (!/^[a-zA-Z0-9_\-\.\/]+$/.test(provider) || !/^[a-zA-Z0-9_\-\.\/\:]+$/.test(model)) {
    return { valid: false, error: 'INVALID_CHARACTERS' };
  }
  
  return { valid: true };
}
```

## 7. 监控与日志架构

### 7.1 操作审计

#### 7.1.1 日志记录策略

**日志内容:**
- 命令执行时间戳
- 用户操作详情
- 配置变更记录
- 错误和异常信息

```typescript
class ModeCommandLogger {
  static async logOperation(operation: {
    command: string;
    args: string[];
    result: ModeCommandResult;
    duration: number;
  }): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      command: 'ccr mode',
      arguments: operation.args,
      success: operation.result.success,
      duration: operation.duration,
      previousModel: operation.result.previousModel,
      newModel: operation.result.newModel
    };
    
    await writeLog('mode-command', logEntry);
  }
}
```

### 7.2 性能监控

#### 7.2.1 关键指标跟踪

**监控指标:**
- 命令执行时间
- 配置文件操作延迟
- 错误率统计
- 用户操作频次

```typescript
class PerformanceMonitor {
  static async trackCommandExecution<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      await this.recordMetric('mode_command_success', duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      await this.recordMetric('mode_command_error', duration);
      throw error;
    }
  }
}
```

## 8. 测试架构

### 8.1 测试策略

#### 8.1.1 测试层级

**单元测试 (80% 覆盖率目标):**
- 模型解析函数测试
- 配置操作函数测试
- 验证逻辑测试
- 错误处理测试

**集成测试 (15% 覆盖率目标):**
- CLI 命令端到端测试
- 配置文件操作集成测试
- 与现有系统集成测试

**端到端测试 (5% 覆盖率目标):**
- 完整用户场景测试
- 错误恢复测试
- 性能基准测试

#### 8.1.2 测试环境架构

```typescript
describe('Mode Command Tests', () => {
  beforeEach(async () => {
    // 1. 创建测试配置文件
    await createTestConfig();
    
    // 2. 初始化测试环境
    await initTestEnvironment();
  });
  
  afterEach(async () => {
    // 3. 清理测试资源
    await cleanupTestEnvironment();
  });
  
  describe('Model Switching', () => {
    it('should successfully switch default model', async () => {
      // 测试逻辑
    });
  });
});
```

## 9. 部署与运维架构

### 9.1 向后兼容性

#### 9.1.1 兼容性保证

**API 兼容性:**
- 不修改现有 API 接口
- 新增功能不影响现有功能
- 配置文件格式保持兼容

**数据迁移:**
- 无需数据迁移
- 现有配置自动兼容
- 渐进式功能启用

### 9.2 升级策略

#### 9.2.1 功能发布

**分阶段发布:**
1. **Alpha 版本**: 基础功能实现
2. **Beta 版本**: 用户体验优化
3. **正式版本**: 完整功能和文档

**回滚策略:**
- 功能开关控制
- 配置文件版本控制
- 快速回滚机制

## 10. 扩展性架构

### 10.1 未来扩展点

#### 10.1.1 功能扩展

**潜在扩展方向:**
- 多配置文件支持
- 配置模板管理
- 批量操作支持
- 配置导入导出

**架构预留:**
```typescript
// 为未来扩展预留的接口
interface ModeCommandExtension {
  name: string;
  version: string;
  handler: (args: string[]) => Promise<ModeCommandResult>;
}

class ModeCommandRegistry {
  private static extensions: Map<string, ModeCommandExtension> = new Map();
  
  static registerExtension(extension: ModeCommandExtension): void {
    this.extensions.set(extension.name, extension);
  }
}
```

### 10.2 插件架构

#### 10.2.1 插件系统集成

**与现有插件系统的集成:**
- 利用现有的 transformer 系统
- 扩展 custom-router 功能
- 插件配置管理统一

## 11. 关键决策记录

### 11.1 技术决策

| 决策ID | 决策内容 | 理由 | 影响 |
|--------|----------|------|------|
| TD001 | 复用现有配置管理系统 | 保持系统一致性 | 低：无需重新实现 |
| TD002 | 新建独立的 modeCommand.ts | 功能模块化 | 中：新增文件但隔离好 |
| TD003 | 采用原子性配置更新 | 保证数据完整性 | 低：使用现有工具 |
| TD004 | 复用现有模型验证逻辑 | 避免重复实现 | 低：保持验证一致性 |

### 11.2 设计权衡

| 权衡点 | 选择方案 | 替代方案 | 权衡理由 |
|--------|----------|----------|----------|
| 配置存储 | 继续使用 config.json | 单独配置文件 | 保持现有系统一致性 |
| 验证逻辑 | 复用现有函数 | 重新实现 | 减少代码重复，保持一致性 |
| 错误处理 | 详细错误信息 | 简单错误码 | 提升用户体验 |
| 性能优化 | 配置缓存 | 每次读取 | 平衡性能和资源使用 |

---

## 附录

### A. 代码示例

#### A.1 完整的 modeCommand.ts 结构

```typescript
/**
 * Mode Command Implementation
 * 处理 ccr mode 命令的所有逻辑
 */

import { readConfigFile, writeConfigFile } from './index';
import { validateModelInConfig } from './router';

export interface ModeCommandResult {
  success: boolean;
  message: string;
  previousModel?: string;
  newModel?: string;
  availableModels?: string[];
}

export interface ModelParsed {
  provider: string;
  model: string;
  original: string;
}

// 主入口函数
export async function executeModeCommand(args: string[]): Promise<ModeCommandResult> {
  // 实现细节...
}

// 其他函数实现...
```

### B. 配置示例

#### B.1 目标配置结构

```json
{
  "Router": {
    "default": "deepseek,deepseek-chat",
    "background": "openrouter,anthropic/claude-3.5-sonnet",
    "reasoning": "openrouter,o1-mini"
  },
  "Providers": {
    "deepseek": {
      "models": ["deepseek-chat", "deepseek-coder"]
    },
    "openrouter": {
      "models": ["anthropic/claude-3.5-sonnet", "o1-mini"]
    }
  }
}
```

---

**文档结束**

*本架构文档由架构师 Winston 基于 PRD v1.0 设计，用于指导 ccr mode 命令的技术实现和系统集成。*