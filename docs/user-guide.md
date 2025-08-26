# Claude Code Router 产品使用文档

## 📖 目录

1. [产品概述](#产品概述)
2. [快速开始](#快速开始)
3. [安装与配置](#安装与配置)
4. [核心功能使用](#核心功能使用)
5. [高级功能](#高级功能)
6. [命令行工具](#命令行工具)
7. [Web管理界面](#web管理界面)
8. [配置管理](#配置管理)
9. [故障排除](#故障排除)
10. [最佳实践](#最佳实践)

---

## 产品概述

### 什么是 Claude Code Router？

Claude Code Router 是一个强大的AI模型路由系统，专为使用 Claude Code 的开发者设计。它解决了 Claude Code 默认只能使用 Anthropic 模型的限制，让您可以：

- 🔄 **灵活切换模型**：支持多种AI模型提供商
- 💰 **成本控制**：根据任务类型选择性价比最高的模型
- 🎯 **智能路由**：自动根据任务特性选择最适合的模型
- ⚡ **无缝集成**：在 Claude Code 中透明工作，无需改变使用习惯

### 核心优势

| 特性 | 说明 | 价值 |
|------|------|------|
| **多提供商支持** | OpenRouter、DeepSeek、Ollama、Gemini等 | 降低成本，提高可用性 |
| **智能路由** | 根据任务类型自动选择模型 | 最优性价比 |
| **动态切换** | 实时切换模型，无需重启 | 工作流不中断 |
| **可视化管理** | Web UI 配置管理 | 简化操作 |
| **CI/CD 集成** | 支持 GitHub Actions 等 | 自动化部署 |

---

## 快速开始

### 5分钟快速体验

#### 1. 安装

```bash
# 使用 npm 安装
npm install -g claude-code-router

# 或使用 pnpm
pnpm add -g claude-code-router
```

#### 2. 启动服务

```bash
# 启动 Claude Code Router
ccr start

# 输出示例:
✅ Claude Code Router 已启动
🌐 服务地址: http://localhost:3456
📝 配置文件: ~/.claude-code-router/config.json
```

#### 3. 配置 Claude Code

在 Claude Code 中设置 API 端点：
```
API 端点: http://localhost:3456/v1/messages
```

#### 4. 开始使用

现在您可以在 Claude Code 中正常使用，系统会自动路由到配置的模型！

---

## 安装与配置

### 系统要求

- **Node.js**: v20.0.0 或更高版本
- **操作系统**: Windows 10+、macOS 10.15+、Linux（Ubuntu 18.04+）
- **内存**: 512MB 可用内存
- **网络**: 互联网连接（用于访问AI模型API）

### 详细安装步骤

#### 方法一：NPM 安装（推荐）

```bash
# 全局安装
npm install -g claude-code-router

# 验证安装
ccr --version
# 输出: claude-code-router version: 1.0.43
```

#### 方法二：源码安装

```bash
# 克隆仓库
git clone https://github.com/user/claude-code-router.git
cd claude-code-router

# 安装依赖
pnpm install --frozen-lockfile

# 构建项目
pnpm run build

# 启动服务
node dist/cli.js start
```

#### 方法三：Docker 部署

```bash
# 拉取镜像
docker pull claude-code-router:latest

# 运行容器
docker run -d \
  --name ccr \
  -p 3456:3456 \
  -v ~/.claude-code-router:/app/config \
  claude-code-router:latest
```

### 初始配置

#### 1. 生成配置文件

```bash
# 首次启动会自动生成配置文件
ccr start

# 配置文件位置: ~/.claude-code-router/config.json
```

#### 2. 配置API密钥

编辑配置文件或使用Web UI添加您的API密钥：

```json
{
  "Router": {
    "default": "deepseek,deepseek-chat",
    "providers": {
      "deepseek": {
        "apiKey": "${DEEPSEEK_API_KEY}",
        "baseURL": "https://api.deepseek.com",
        "models": ["deepseek-chat", "deepseek-coder"]
      },
      "openrouter": {
        "apiKey": "${OPENROUTER_API_KEY}",
        "baseURL": "https://openrouter.ai/api/v1",
        "models": ["anthropic/claude-3.5-sonnet"]
      }
    }
  }
}
```

#### 3. 设置环境变量

```bash
# Linux/macOS
export DEEPSEEK_API_KEY="your-deepseek-api-key"
export OPENROUTER_API_KEY="your-openrouter-api-key"

# Windows
set DEEPSEEK_API_KEY=your-deepseek-api-key
set OPENROUTER_API_KEY=your-openrouter-api-key
```

---

## 核心功能使用

### 模型切换

#### 临时切换（当前会话）

在 Claude Code 中使用 `/model` 命令进行会话级别的模型切换：

```
/model deepseek,deepseek-chat
```

**功能特点：**
- ✅ **会话持久化**：模型切换在整个会话中保持有效，直到手动更改或会话结束
- ✅ **即时反馈**：切换成功后立即显示确认消息
- ✅ **错误处理**：无效模型会显示友好的错误信息和可用模型列表
- ✅ **多会话支持**：不同会话可以使用不同的模型，互不影响

**支持的模型格式：**
```
/model deepseek,deepseek-chat                # DeepSeek 聊天模型
/model modelscope,deepseek-ai/DeepSeek-V3.1   # modelscope DeepSeek 模型
/model gemini,gemini-2.5-flash        # Gemini Flash 模型
/model openrouter,meta-llama/llama-3.2-3b-instruct:free  # OpenRouter 免费模型
```

**使用示例：**

1. **切换到 DeepSeek 代码模型**
   ```
   /model deepseek,deepseek-coder
   ```
   响应：`✅ 已成功切换到模型: deepseek/deepseek-coder`

2. **切换到 Gemini Flash 进行快速响应**
   ```
   /model gemini,gemini-2.5-flash
   ```
   响应：`✅ 已成功切换到模型: gemini/gemini-2.5-flash`

3. **查看可用模型（当输入无效模型时）**
   ```
   /model invalid,model
   ```
   响应：`❌ 模型 invalid,model 在配置中不存在。`
   
   并会显示完整的可用模型列表。

#### 永久切换（默认模型）

使用 CLI 命令修改默认配置：

```bash
# 切换默认模型
ccr mode deepseek,deepseek-chat

# 输出:
✅ 默认模型已成功切换为: deepseek,deepseek-chat
   之前的配置: openrouter,anthropic/claude-3.5-sonnet

💡 提示: 使用 'ccr mode' 查看当前配置
```

#### 查看当前配置

```bash
# 查看当前默认模型
ccr mode

# 输出:
📋 当前默认模型: deepseek,deepseek-chat
📝 配置文件: ~/.claude-code-router/config.json
⚙️  配置状态: 正常
```

#### 查看所有可用模型

```bash
ccr mode --show

# 输出:
📋 当前默认模型: deepseek,deepseek-chat

📝 可用模型列表:
deepseek:
  • deepseek-chat
  • deepseek-coder

openrouter:
  • anthropic/claude-3.5-sonnet
  • anthropic/claude-3-haiku
```

### 智能路由策略

系统支持基于任务类型的智能路由：

| 路由类型 | 触发条件 | 推荐模型 | 使用场景 |
|----------|----------|----------|----------|
| **默认路由** | 一般任务 | Claude 3.5 Sonnet | 代码编写、问答 |
| **后台任务** | 长时间运行 | DeepSeek Chat | 批处理、自动化 |
| **推理任务** | 复杂逻辑 | Claude 3 Opus | 算法设计、架构 |
| **长上下文** | 大量文本 | Claude 3 Haiku | 文档分析、总结 |

### 子代理模型指定

在请求中使用特殊标签指定特定模型：

```markdown
<CCR-SUBAGENT-MODEL>deepseek,deepseek-coder</CCR-SUBAGENT-MODEL>
请帮我写一个Python函数来处理文件上传
```

---

## 高级功能

### 自定义路由逻辑

创建 `custom-router.js` 文件实现复杂路由规则：

```javascript
// ~/.claude-code-router/custom-router.js
module.exports = {
  // 自定义路由函数
  route: function(request, config) {
    // 根据请求内容判断
    if (request.messages.some(msg => 
      msg.content.includes('performance') || 
      msg.content.includes('optimization'))) {
      return 'deepseek,deepseek-coder'; // 性能相关用 DeepSeek
    }
    
    // 根据消息长度判断
    const totalLength = request.messages.reduce((sum, msg) => 
      sum + msg.content.length, 0);
    
    if (totalLength > 50000) {
      return 'anthropic,claude-3-haiku'; // 长文本用 Haiku
    }
    
    // 默认策略
    return config.Router.default;
  }
};
```

### Transformer 插件系统

#### 内置 Transformer

| Transformer | 功能 | 使用场景 |
|-------------|------|----------|
| **anthropic** | Anthropic协议适配 | 使用Anthropic模型时 |
| **deepseek** | DeepSeek协议适配 | 使用DeepSeek模型时 |
| **maxtoken** | 最大token限制 | 控制生成长度 |
| **tooluse** | 工具使用增强 | 函数调用场景 |
| **reasoning** | 推理增强 | 复杂逻辑任务 |

#### 配置 Transformer

```json
{
  "Router": {
    "transformers": [
      {
        "name": "maxtoken",
        "config": {
          "maxTokens": 4096
        }
      },
      {
        "name": "tooluse",
        "enabled": true
      }
    ]
  }
}
```

### 状态行监控

启用状态行工具监控运行状态：

```bash
# 启动状态行监控
ccr statusline

# 输出实时状态信息:
🟢 CCR | Model: deepseek,deepseek-chat | Requests: 15 | Uptime: 2h 15m
```

---

## 命令行工具

### 基础命令

```bash
# 启动服务
ccr start

# 停止服务
ccr stop

# 重启服务
ccr restart

# 查看状态
ccr status

# 打开Web UI
ccr ui

# 执行Claude命令
ccr code "写一个Hello World程序"

# 查看版本
ccr --version

# 查看帮助
ccr --help
```

### 模型管理命令

```bash
# 查看当前默认模型
ccr mode

# 查看详细信息和可用模型
ccr mode --show
ccr mode -s

# 切换默认模型
ccr mode deepseek,deepseek-chat
ccr mode openrouter,anthropic/claude-3.5-sonnet
ccr mode ollama,qwen2.5:32b

# 查看可用模型列表
ccr mode --list
```

### 高级命令选项

```bash
# 指定配置文件路径
ccr start --config /path/to/config.json

# 指定端口
ccr start --port 8080

# 启用调试模式
ccr start --debug

# 非交互模式（适用于CI/CD）
NON_INTERACTIVE_MODE=true ccr start
```

---

## Web管理界面

### 访问Web UI

```bash
# 启动服务后自动打开浏览器
ccr ui

# 或手动访问
# http://localhost:3456
```

### 主要功能区域

#### 1. 模型提供商管理

- **添加提供商**：配置新的AI模型提供商
- **编辑配置**：修改API密钥、端点等信息
- **测试连接**：验证配置是否正确

#### 2. 路由策略配置

- **默认模型**：设置系统默认使用的模型
- **智能路由**：配置基于任务类型的路由规则
- **自定义规则**：创建复杂的路由逻辑

#### 3. Transformer 管理

- **插件列表**：查看所有可用的Transformer
- **配置管理**：启用/禁用特定插件
- **参数设置**：调整插件运行参数

#### 4. 系统监控

- **运行状态**：查看服务运行状态
- **请求统计**：分析使用情况和性能
- **日志查看**：查看系统和错误日志

### 导入/导出配置

```bash
# 导出当前配置
# Web UI -> 设置 -> 导出配置

# 导入配置文件
# Web UI -> 设置 -> 导入配置
```

---

## 配置管理

### 配置文件结构

```json
{
  "Router": {
    "default": "deepseek,deepseek-chat",
    "backgroundTask": "deepseek,deepseek-chat",
    "reasoning": "openrouter,anthropic/claude-3.5-sonnet",
    "longContext": "anthropic,claude-3-haiku",
    "longContextThreshold": 30000,
    "providers": {
      "deepseek": {
        "apiKey": "${DEEPSEEK_API_KEY}",
        "baseURL": "https://api.deepseek.com",
        "models": ["deepseek-chat", "deepseek-coder"]
      },
      "openrouter": {
        "apiKey": "${OPENROUTER_API_KEY}",
        "baseURL": "https://openrouter.ai/api/v1",
        "models": ["anthropic/claude-3.5-sonnet"]
      },
      "ollama": {
        "baseURL": "http://localhost:11434",
        "models": ["qwen2.5:32b", "llama3.1:8b"]
      }
    },
    "transformers": [
      {
        "name": "maxtoken",
        "config": {
          "maxTokens": 4096
        }
      }
    ]
  },
  "Server": {
    "port": 3456,
    "host": "localhost",
    "apiKey": "your-api-key"
  },
  "Logging": {
    "level": "info",
    "file": "~/.claude-code-router/logs/app.log"
  }
}
```

### 环境变量支持

配置文件支持环境变量插值，使用 `${VARIABLE_NAME}` 语法：

```json
{
  "Router": {
    "providers": {
      "deepseek": {
        "apiKey": "${DEEPSEEK_API_KEY}",
        "baseURL": "${DEEPSEEK_BASE_URL:-https://api.deepseek.com}"
      }
    }
  }
}
```

### 配置验证

```bash
# 验证配置文件格式
ccr config validate

# 测试提供商连接
ccr config test deepseek

# 重载配置（无需重启）
ccr config reload
```

---

## 故障排除

### 常见问题

#### 1. 服务启动失败

**问题**：运行 `ccr start` 后服务无法启动

**解决方案**：
```bash
# 检查端口是否被占用
lsof -i :3456  # macOS/Linux
netstat -ano | findstr :3456  # Windows

# 使用其他端口启动
ccr start --port 8080

# 查看详细错误信息
ccr start --debug
```

#### 2. API密钥配置错误

**问题**：提示API密钥无效

**解决方案**：
```bash
# 检查环境变量
echo $DEEPSEEK_API_KEY

# 测试API连接
ccr config test deepseek

# 重新设置环境变量
export DEEPSEEK_API_KEY="your-correct-api-key"
```

#### 3. 模型切换失败

**问题**：`ccr mode` 命令报错

**解决方案**：
```bash
# 检查模型是否在配置中
ccr mode --show

# 验证配置文件格式
ccr config validate

# 查看具体错误信息
ccr mode deepseek,deepseek-chat --verbose
```

#### 4. Claude Code 连接问题

**问题**：Claude Code 无法连接到 CCR

**解决方案**：
1. 确认服务正在运行：`ccr status`
2. 检查端点配置：`http://localhost:3456/v1/messages`
3. 验证网络连接：`curl http://localhost:3456/health`

### 调试工具

```bash
# 启用调试模式
ccr start --debug

# 查看日志文件
tail -f ~/.claude-code-router/logs/app.log

# 检查配置状态
ccr status --verbose

# 测试API连接
ccr config test --all
```

### 日志分析

日志文件位置：`~/.claude-code-router/logs/`

**日志级别**：
- `error`：错误信息
- `warn`：警告信息  
- `info`：一般信息
- `debug`：调试信息

```bash
# 查看错误日志
grep "ERROR" ~/.claude-code-router/logs/app.log

# 查看最近的请求
grep "REQUEST" ~/.claude-code-router/logs/app.log | tail -20
```

### 模型切换故障排除

#### 问题 1：`/model` 命令没有效果

**症状**：在 Claude Code 中输入 `/model provider,model` 后，模型没有切换或显示错误响应。

**可能原因**：
- 服务未启动或配置错误
- 命令格式错误
- 模型不在配置文件中
- 网络连接问题

**解决方案**：
```bash
# 1. 检查服务状态
ccr status

# 2. 重启服务
ccr restart

# 3. 查看可用模型
ccr mode --list

# 4. 检查日志
ccr logs | grep -i "model\|error"
```

#### 问题 2：显示"模型不存在"错误

**症状**：`❌ 模型 provider,model 在配置中不存在`

**原因**：指定的模型未在 `config.json` 中配置。

**解决方案**：
1. 查看错误消息中显示的可用模型列表
2. 使用正确的模型标识符
3. 或在 Web 界面中添加新模型：
   ```bash
   ccr ui
   ```

#### 问题 3：模型切换后又恢复了

**症状**：切换成功但下一个请求又回到原来的模型。

**原因**：这个问题在新版本中已修复（会话级持久化）。如果仍遇到：

1. 确保使用最新版本：
   ```bash
   ccr --version
   npm update -g @musistudio/claude-code-router
   ```

2. 检查会话状态：
   ```bash
   ccr mode  # 查看当前模型状态
   ```

#### 问题 4：命令格式错误

**症状**：`❌ 命令格式错误。正确格式：/model provider,model_name`

**解决方案**：
- 正确格式：`/model provider,model` （注意逗号前后不要有空格）
- 示例：`/model deepseek,deepseek-chat`
- 错误格式：`/model deepseek deepseek-chat`（缺少逗号）

#### 问题 5：在 GitHub Actions 中使用

**症状**：CI/CD 环境中模型切换不工作。

**解决方案**：
在 CI/CD 环境中需要设置非交互模式：

```yaml
env:
  NON_INTERACTIVE_MODE: "true"
```

#### 常见错误码对照表

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| `命令格式错误` | `/model` 命令格式不正确 | 使用正确格式：`/model provider,model` |
| `模型在配置中不存在` | 指定模型未配置 | 检查可用模型列表或添加模型 |
| `连接失败` | 网络或服务问题 | 检查网络连接和服务状态 |
| `API 密钥错误` | 提供商 API 密钥不正确 | 更新配置文件中的 API 密钥 |
| `服务未响应` | CCR 服务未运行 | 运行 `ccr start` 启动服务 |

#### 调试技巧

1. **启用详细日志**：
   ```bash
   ccr start --debug
   ```

2. **实时监控日志**：
   ```bash
   tail -f ~/.claude-code-router/logs/app.log
   ```

3. **测试模型连通性**：
   ```bash
   ccr test-model provider,model
   ```

4. **验证配置文件**：
   ```bash
   ccr config --validate
   ```

---

## 最佳实践

### 模型选择建议

#### 代码开发场景

| 任务类型 | 推荐模型 | 理由 |
|----------|----------|------|
| **代码编写** | DeepSeek Coder | 专门针对代码优化 |
| **代码审查** | Claude 3.5 Sonnet | 平衡性能和成本 |
| **架构设计** | Claude 3 Opus | 复杂推理能力强 |
| **文档编写** | Claude 3 Haiku | 成本低，速度快 |

#### 成本优化策略

```javascript
// 基于任务类型的成本优化路由
module.exports = {
  route: function(request, config) {
    const content = request.messages[0].content.toLowerCase();
    
    // 简单问答用便宜的模型
    if (content.length < 1000 && 
        !content.includes('complex') && 
        !content.includes('architecture')) {
      return 'deepseek,deepseek-chat';  // 成本低
    }
    
    // 复杂任务用高级模型
    if (content.includes('architecture') || 
        content.includes('system design')) {
      return 'openrouter,anthropic/claude-3-opus';  // 能力强
    }
    
    // 默认平衡选择
    return 'openrouter,anthropic/claude-3.5-sonnet';
  }
};
```

### 配置管理建议

#### 1. 环境隔离

```bash
# 开发环境
cp config.example.json config.dev.json
ccr start --config config.dev.json

# 生产环境
cp config.example.json config.prod.json
ccr start --config config.prod.json
```

#### 2. 安全配置

```json
{
  "Server": {
    "apiKey": "${CCR_API_KEY}",  // 使用环境变量
    "cors": {
      "origin": ["http://localhost:3000"],  // 限制来源
      "credentials": true
    }
  }
}
```

#### 3. 备份策略

```bash
# 定期备份配置
cp ~/.claude-code-router/config.json \
   ~/.claude-code-router/config.backup.$(date +%Y%m%d).json

# 自动备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp ~/.claude-code-router/config.json \
   ~/.claude-code-router/backups/config.$DATE.json
```

### 性能优化

#### 1. 缓存配置

```json
{
  "Router": {
    "cache": {
      "enabled": true,
      "ttl": 3600,  // 1小时
      "maxSize": 100  // 最大缓存条目
    }
  }
}
```

#### 2. 并发控制

```json
{
  "Server": {
    "maxConcurrency": 10,  // 最大并发请求
    "timeout": 30000,      // 30秒超时
    "keepAlive": true
  }
}
```

### CI/CD 集成

#### GitHub Actions 示例

```yaml
name: Deploy with CCR
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup CCR
        run: |
          npm install -g claude-code-router
          export DEEPSEEK_API_KEY=${{ secrets.DEEPSEEK_API_KEY }}
          ccr start --port 3456
          
      - name: Deploy with AI assistance
        run: |
          ccr code "请分析这个项目并生成部署脚本"
```

---

## 附录

### API 参考

详细的API文档请参考：[API 参考文档](./api-reference.md)

### 更新日志

查看最新功能和修复：[更新日志](./CHANGELOG.md)

### 社区资源

- **GitHub 仓库**：[claude-code-router](https://github.com/user/claude-code-router)
- **问题反馈**：[Issues](https://github.com/user/claude-code-router/issues)
- **功能建议**：[Discussions](https://github.com/user/claude-code-router/discussions)

### 技术支持

如需技术支持，请：
1. 查看本文档的[故障排除](#故障排除)部分
2. 搜索已有的[GitHub Issues](https://github.com/user/claude-code-router/issues)
3. 创建新的Issue并提供详细信息

---

**文档版本**: v1.0  
**最后更新**: 2025-08-25  
**维护者**: Claude Code Router 开发团队

> 💡 **提示**: 本文档持续更新中，如发现问题或有改进建议，请通过GitHub提交反馈。