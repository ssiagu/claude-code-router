# 功能需求规格

## 核心功能：ccr mode 命令

### 基础命令格式

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

### 示例用法

```bash
# 切换默认模型为 OpenRouter 的 Claude 3.5 Sonnet
ccr mode openrouter,anthropic/claude-3.5-sonnet

# 切换为本地 Ollama 模型
ccr mode ollama,qwen2.5:32b

# 切换为 DeepSeek 模型
ccr mode deepseek,deepseek-chat
```

## 扩展功能：查看当前默认模型

### 命令格式

```bash
ccr mode
# 或
ccr mode --show
```

### 功能描述

- 显示当前的默认模型配置
- 显示所有可用的模型列表
- 提供使用提示和帮助信息

## 功能约束与验证

### 错误处理机制

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