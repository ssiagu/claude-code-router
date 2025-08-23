# 详细设计

## 核心模块设计

### CLI 命令扩展 (cli.ts)

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

### 模式命令处理器 (modeCommand.ts)

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

## 数据流设计

### 命令执行流程

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

### 错误处理流程

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

## 配置管理架构

### 配置文件结构

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

### 配置操作安全性

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