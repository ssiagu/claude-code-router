# 技术实现细节

## 模型验证机制

### 验证策略

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

## 错误处理架构

### 错误分类系统

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

### 用户友好错误消息

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

## 性能优化设计

### 缓存策略

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

## 输入验证安全

### 参数验证

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

## 代码结构实现

### 完整的 modeCommand.ts 结构

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

### 配置示例

**目标配置结构:**
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