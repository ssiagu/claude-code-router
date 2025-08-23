# ccr mode 命令产品需求文档 (PRD)

## 📋 文档信息

- **文档版本**: v1.0
- **创建日期**: 2025-01-23
- **最后更新**: 2025-01-23
- **负责人**: 业务分析师 Mary
- **项目**: Claude Code Router

---

## 1. 产品背景与动机

### 1.1 当前情况

Claude Code Router 是一个强大的AI模型路由系统，目前已经支持：

- 通过 `/model` 命令在 Claude Code 中临时切换模型
- 通过 Web UI 管理和编辑配置文件
- 支持多种模型提供商（OpenRouter、DeepSeek、Ollama等）
- 智能路由策略（默认、后台、思考、长上下文等）

### 1.2 用户痛点分析

#### 1.2.1 临时性问题
- **痛点描述**: `/model` 命令只在当前会话生效，重新启动服务后失效
- **影响程度**: 高 - 用户需要重复设置
- **用户反馈**: "每次重启都要重新设置模型，很麻烦"

#### 1.2.2 操作复杂性
- **痛点描述**: 修改默认模型需要打开 Web UI 或手动编辑配置文件
- **影响程度**: 中 - 影响工作流效率
- **用户反馈**: "希望能在命令行直接修改默认配置"

#### 1.2.3 工作流中断
- **痛点描述**: 在命令行工作时，需要切换到浏览器或编辑器
- **影响程度**: 中 - 打断开发节奏
- **用户反馈**: "切换工具很影响专注度"

### 1.3 目标用户画像

**开发者 (70%)**
- 特征：频繁使用命令行，追求效率
- 需求：在不同项目间快速切换适合的默认模型
- 场景：开发不同类型的应用，需要不同的AI模型支持

**重度用户 (20%)**
- 特征：深度使用 Claude Code Router 的高级功能
- 需求：灵活的模型管理和配置能力
- 场景：需要精细化的模型配置和快速调整

**自动化用户 (10%)**
- 特征：在脚本和CI/CD环境中使用
- 需求：程序化修改默认模型配置
- 场景：根据不同的部署环境自动配置模型

## 2. 产品目标与价值

### 2.1 核心目标

#### 2.1.1 提升用户体验
- **目标**: 将默认模型切换操作从 3-5 步减少到 1 步
- **指标**: 用户满意度从 7.2 提升到 8.5+ (10分制)
- **时间**: 操作时间从 30-60秒 降低到 5秒以内

#### 2.1.2 增强CLI功能完整性
- **目标**: 实现CLI配置管理功能的完整覆盖
- **指标**: CLI功能覆盖率从 60% 提升到 85%
- **价值**: 减少对Web UI的依赖，提升工具的专业性

### 2.2 业务价值

#### 2.2.1 用户留存价值
- **短期**: 提升用户日活跃度 15%
- **长期**: 增加用户粘性，降低流失率 20%
- **ROI**: 预期用户生命周期价值提升 25%

#### 2.2.2 竞争优势价值
- **差异化**: 提供业界领先的CLI配置管理体验
- **技术壁垒**: 完善的工具链生态
- **市场定位**: 专业开发者首选工具

## 3. 功能需求规格

### 3.1 核心功能：ccr mode 命令

#### 3.1.1 基础命令格式

```bash
ccr mode <provider_name>,<model_name>
```

**功能描述:**
- 永久修改 config.json 中的 Router.default 配置
- 立即生效，无需重启服务
- 支持模型验证，确保指定的模型在配置中存在
- 提供操作前后的状态对比

**技术要求:**
- 命令响应时间 < 500ms
- 配置文件完整性保证 100%
- 支持配置备份和回滚机制

#### 3.1.2 示例用法

```bash
# 切换默认模型为 OpenRouter 的 Claude 3.5 Sonnet
ccr mode openrouter,anthropic/claude-3.5-sonnet

# 切换为本地 Ollama 模型
ccr mode ollama,qwen2.5:32b

# 切换为 DeepSeek 模型
ccr mode deepseek,deepseek-chat
```

### 3.2 扩展功能：查看当前默认模型

#### 3.2.1 命令格式

```bash
ccr mode
# 或
ccr mode --show
```

#### 3.2.2 功能描述

- 显示当前的默认模型配置
- 显示所有可用的模型列表
- 提供使用提示和帮助信息

### 3.3 功能约束与验证

#### 3.3.1 错误处理机制

**错误类型1: 命令格式错误**
```bash
$ ccr mode invalid_format
❌ 错误: 命令格式不正确。
💡 提示: 使用 'ccr mode <provider>,<model>' 格式来指定模型
```

**错误类型2: 提供商不存在**
```bash
$ ccr mode invalid_provider,some_model
❌ 错误: 提供商 'invalid_provider' 在配置中不存在。
```

**错误类型3: 模型不存在**
```bash
$ ccr mode deepseek,invalid_model
❌ 错误: 模型 'deepseek,invalid_model' 在配置中不存在。
```

## 4. 技术实现规格

### 4.1 实现架构

#### 4.1.1 涉及的文件模块

| 文件路径 | 职责 | 修改类型 |
|---------|------|----------|
| `src/cli.ts` | 添加 mode 命令处理逻辑 | 新增功能 |
| `src/utils/modeCommand.ts` | 模式管理核心逻辑 | 新建文件 |
| `src/utils/router.ts` | 复用模型验证逻辑 | 无修改 |
| `src/middleware/commandParser.ts` | 复用验证函数 | 格式优化 |
| `src/utils/index.ts` | 复用配置读写 | 无修改 |

### 4.2 关键技术实现

#### 4.2.1 配置文件管理

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

#### 4.2.2 模型验证机制

**验证规则:**
1. 提供商名称验证（不区分大小写）
2. 模型名称验证（不区分大小写）
3. 配置完整性验证
4. 格式规范验证

### 4.3 代码结构设计

#### 4.3.1 新增接口定义

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

#### 4.3.2 核心函数设计

```typescript
// 主要导出函数
export async function executeModeCommand(args: string[]): Promise<ModeCommandResult>;
export async function showCurrentMode(): Promise<ModeCommandResult>;
export async function updateDefaultModel(provider: string, model: string): Promise<ModeCommandResult>;

// 辅助工具函数
export function parseModelString(modelString: string): ModelParsed | null;
export function getCurrentDefaultModel(config: any): string;
```

## 5. 用户交互设计

### 5.1 命令行界面设计

#### 5.1.1 视觉设计原则

**颜色和符号使用:**
- ✅ 绿色：成功操作
- ❌ 红色：错误信息  
- 💡 黄色：提示建议
- 📋 蓝色：信息展示
- 📝 紫色：列表内容

#### 5.1.2 成功场景设计

```bash
$ ccr mode deepseek,deepseek-chat
✅ 默认模型已成功切换为: deepseek,deepseek-chat
   之前的配置: openrouter,anthropic/claude-3.5-sonnet

💡 提示: 使用 'ccr mode' 查看当前配置
```

### 5.2 帮助信息设计

#### 5.2.1 更新后的帮助信息

```bash
$ ccr --help
Usage: ccr [command]

Commands:
  start         Start server 
  stop          Stop server
  restart       Restart server
  status        Show server status
  statusline    Integrated statusline
  code          Execute claude command
  ui            Open the web UI in browser
  mode          Set or show default model        # 🆕 新增
  -v, version   Show version information
  -h, help      Show help information

Example:
  ccr start
  ccr code "Write a Hello World"
  ccr ui
  ccr mode                                       # 🆕 查看当前默认模型
  ccr mode --show                               # 🆕 显示详细信息
  ccr mode deepseek,deepseek-chat               # 🆕 切换默认模型
```

## 6. 测试策略

### 6.1 功能测试计划

#### 6.1.1 核心功能测试用例

| 测试ID | 测试场景 | 输入 | 期望输出 | 优先级 |
|-------|----------|------|----------|--------|
| TC001 | 正常模型切换 | `ccr mode deepseek,deepseek-chat` | 成功切换并显示确认信息 | P0 |
| TC002 | 查看当前模式 | `ccr mode` | 显示当前默认模型 | P0 |
| TC003 | 显示详细信息 | `ccr mode --show` | 显示当前模型和所有可用模型 | P0 |
| TC004 | 无效提供商 | `ccr mode invalid,model` | 显示错误和可用提供商列表 | P0 |
| TC005 | 无效模型 | `ccr mode deepseek,invalid` | 显示错误和该提供商的可用模型 | P0 |

## 7. 项目计划

### 7.1 开发里程碑

**第一阶段：基础功能（1-2天）**
- 实现 `ccr mode <provider>,<model>` 基础功能
- 添加模型验证逻辑
- 更新帮助信息

**第二阶段：用户体验优化（1天）**
- 实现 `ccr mode` 查看功能
- 优化错误提示和用户交互
- 添加详细的可用模型展示

**第三阶段：测试与完善（1天）**
- 编写单元测试和集成测试
- 错误场景处理完善
- 文档更新

### 7.2 技术依赖

**现有代码复用：**
- `src/utils/router.ts` - 模型验证逻辑
- `src/utils/index.ts` - 配置文件读写
- `src/cli.ts` - CLI 命令框架

**新增开发：**
- 模型管理工具函数
- CLI 命令处理逻辑
- 用户交互界面

## 8. 风险评估

### 8.1 技术风险
- **配置文件冲突**：并发修改可能导致配置丢失
- **服务同步**：配置更新后服务状态同步问题
- **向后兼容**：确保不影响现有功能

### 8.2 缓解措施
- 实现配置文件锁机制
- 添加配置备份功能
- 充分的回归测试

## 9. 成功指标

### 9.1 功能指标
- 命令执行成功率 > 99%
- 模型验证准确率 100%
- 配置文件完整性保持 100%

### 9.2 用户体验指标
- 命令响应时间 < 500ms
- 错误信息清晰度（用户反馈）
- 功能使用率（通过日志统计）

---

**文档结束**

*本文档由业务分析师 Mary 编写，用于指导 ccr mode 命令的产品开发和实现。*