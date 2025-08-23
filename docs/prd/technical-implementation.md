# 技术实现规格

## 实现架构

### 涉及的文件模块

| 文件路径 | 职责 | 修改类型 |
|---------|------|----------|
| `src/cli.ts` | 添加 mode 命令处理逻辑 | 新增功能 |
| `src/utils/modeCommand.ts` | 模式管理核心逻辑 | 新建文件 |
| `src/utils/router.ts` | 复用模型验证逻辑 | 无修改 |
| `src/middleware/commandParser.ts` | 复用验证函数 | 格式优化 |
| `src/utils/index.ts` | 复用配置读写 | 无修改 |

## 关键技术实现

### 配置文件管理

**配置读取策略:**
```typescript
// 安全的配置读取，支持格式验证
const config = await readConfigFile();
if (!config?.Router) {
  config.Router = {};
}
```

**配置写入策略:**
```typescript
// 原子性写入，确保数据完整性
await writeConfigFile(config);
```

### 模型验证机制

**验证规则:**
1. 提供商名称验证（不区分大小写）
2. 模型名称验证（不区分大小写）
3. 配置完整性验证
4. 格式规范验证

## 代码结构设计

### 新增接口定义

```typescript
/**
 * 模式命令执行结果接口
 */
export interface ModeCommandResult {
  success: boolean;          // 执行是否成功
  message: string;           // 用户提示信息
  previousModel?: string;    // 之前的模型配置
  newModel?: string;         // 新的模型配置
  availableModels?: string;  // 可用模型列表
}
```

### 核心函数设计

```typescript
// 主要导出函数
export async function executeModeCommand(args: string[]): Promise<ModeCommandResult>;
export async function showCurrentMode(): Promise<ModeCommandResult>;
export async function updateDefaultModel(provider: string, model: string): Promise<ModeCommandResult>;

// 辅助工具函数
export function parseModelString(modelString: string): ModelParsed | null;
export function getCurrentDefaultModel(config: any): string;
```