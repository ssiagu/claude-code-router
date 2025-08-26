# Claude Code Router 本地使用示例

## 🚀 快速开始示例

### 1. 全局安装和基础配置

```bash
# 1. 安装 Claude Code Router
npm install -g @musistudio/claude-code-router

# 2. 验证安装
ccr --version
# 输出: claude-code-router version: 1.0.43

# 3. 首次启动（会自动生成配置文件）
ccr start
# 输出:
# ✅ Claude Code Router 已启动
# 🌐 服务地址: http://localhost:3456
# 📝 配置文件: ~/.claude-code-router/config.json
```

### 2. 配置 API 密钥

```bash
# 设置环境变量
export DEEPSEEK_API_KEY="your-deepseek-api-key"
export OPENROUTER_API_KEY="your-openrouter-api-key"

# Windows 用户
set DEEPSEEK_API_KEY=your-deepseek-api-key
set OPENROUTER_API_KEY=your-openrouter-api-key
```

## 📋 详细使用场景

### 场景1: 开发环境配置

```bash
# 1. 启动开发服务
ccr start --port 3456

# 2. 配置 Claude Code
# 在 Claude Code 设置中：
# API Endpoint: http://localhost:3456/v1/messages

# 3. 设置默认模型
ccr mode deepseek,deepseek-chat

# 4. 验证配置
ccr mode --show
```

**预期输出：**
```
📋 当前默认模型: deepseek,deepseek-chat
📝 配置文件: ~/.claude-code-router/config.json
⚙️  配置状态: 正常

📝 可用模型列表:
deepseek:
  • deepseek-chat
  • deepseek-coder

openrouter:
  • anthropic/claude-3.5-sonnet
  • anthropic/claude-3-haiku
```

### 场景2: 多项目环境管理

```bash
# 项目A - 使用 DeepSeek 进行代码开发
cd /path/to/project-a
ccr mode deepseek,deepseek-coder
ccr start --port 3456

# 项目B - 使用 Claude 进行文档编写
cd /path/to/project-b
ccr mode openrouter,anthropic/claude-3.5-sonnet
ccr start --port 3457  # 不同端口
```

### 场景3: 成本优化配置

**创建自定义路由文件：**
```javascript
// ~/.claude-code-router/custom-router.js
module.exports = {
  route: function(request, config) {
    const content = request.messages[0].content.toLowerCase();
    
    // 简单问答 - 使用便宜模型
    if (content.length < 500) {
      return 'deepseek,deepseek-chat';
    }
    
    // 代码相关 - 使用代码专用模型
    if (content.includes('code') || content.includes('function') || content.includes('class')) {
      return 'deepseek,deepseek-coder';
    }
    
    // 复杂任务 - 使用高级模型
    if (content.includes('architecture') || content.includes('design') || content.length > 2000) {
      return 'openrouter,anthropic/claude-3.5-sonnet';
    }
    
    // 默认
    return config.Router.default;
  }
};
```

**配置文件示例：**
```json
{
  "Router": {
    "default": "deepseek,deepseek-chat",
    "backgroundTask": "deepseek,deepseek-chat",
    "reasoning": "openrouter,anthropic/claude-3.5-sonnet",
    "longContext": "openrouter,anthropic/claude-3-haiku",
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
        "models": [
          "anthropic/claude-3.5-sonnet",
          "anthropic/claude-3-haiku"
        ]
      }
    }
  },
  "Server": {
    "port": 3456,
    "host": "localhost"
  }
}
```

### 场景4: Web UI 管理

```bash
# 启动 Web UI 模式
ccr ui

# 浏览器会自动打开：http://localhost:3456
# 如果没有自动打开，手动访问该地址
```

**Web UI 功能演示：**
1. **提供商管理**：添加/编辑 API 密钥
2. **模型配置**：可视化选择默认模型
3. **路由策略**：配置智能路由规则
4. **监控面板**：查看请求统计和日志

### 场景5: CI/CD 环境使用

```yaml
# .github/workflows/ai-assist.yml
name: AI 辅助开发

on: [push]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: 安装 Claude Code Router
        run: |
          npm install -g @musistudio/claude-code-router
          
      - name: 配置环境
        env:
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
          NON_INTERACTIVE_MODE: true
        run: |
          ccr start --port 3456 &
          sleep 5  # 等待服务启动
          
      - name: AI 代码审查
        env:
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
        run: |
          ccr mode deepseek,deepseek-coder
          ccr code "请审查这次提交的代码变更"
```

## 🔧 高级配置示例

### 1. 本地 Ollama 配置

```bash
# 1. 启动 Ollama
ollama serve

# 2. 下载模型
ollama pull qwen2.5:32b

# 3. 配置 CCR
ccr mode ollama,qwen2.5:32b
```

**配置文件添加：**
```json
{
  "Router": {
    "providers": {
      "ollama": {
        "baseURL": "http://localhost:11434",
        "models": ["qwen2.5:32b", "llama3.1:8b"]
      }
    }
  }
}
```

### 2. 多模型负载均衡

```javascript
// custom-router.js - 负载均衡示例
module.exports = {
  route: function(request, config) {
    const models = [
      'deepseek,deepseek-chat',
      'openrouter,anthropic/claude-3-haiku'
    ];
    
    // 简单轮询
    const index = Math.floor(Math.random() * models.length);
    return models[index];
  }
};
```

### 3. 状态监控配置

```bash
# 启动状态行监控
ccr statusline

# 实时查看状态
# 输出: 🟢 CCR | Model: deepseek,deepseek-chat | Requests: 15 | Uptime: 2h 15m

# 查看详细状态
ccr status

# 输出:
# 📊 Claude Code Router 状态
# 🚀 服务状态: 运行中
# 🌐 监听地址: http://localhost:3456
# 📈 处理请求: 156 次
# ⏱️  运行时间: 3 小时 25 分钟
# 💾 内存使用: 45.2 MB
```

## 📱 命令行工具完整示例

```bash
# 基础命令
ccr start              # 启动服务
ccr stop               # 停止服务
ccr restart            # 重启服务
ccr status             # 查看状态
ccr ui                 # 打开 Web UI

# 模型管理
ccr mode                           # 查看当前模型
ccr mode --show                   # 显示详细信息
ccr mode deepseek,deepseek-chat   # 切换模型
ccr mode ollama,qwen2.5:32b      # 切换到本地模型

# 直接执行命令
ccr code "写一个 Python 函数计算斐波那契数列"

# 版本和帮助
ccr --version          # 查看版本
ccr --help            # 查看帮助
```

## 🔍 故障排除示例

```bash
# 1. 检查服务状态
ccr status

# 2. 验证配置
cat ~/.claude-code-router/config.json

# 3. 测试网络连接
curl http://localhost:3456/health

# 4. 查看日志
tail -f ~/.claude-code-router/logs/app.log

# 5. 重置配置
mv ~/.claude-code-router/config.json ~/.claude-code-router/config.json.bak
ccr start  # 重新生成配置

# 6. 调试模式
ccr start --debug
```

## 📚 更多示例

更多使用示例请参考：
- [用户指南](./user-guide.md) - 完整使用文档
- [API 参考](./api-reference.md) - API 接口文档
- [配置参考](./config-reference.md) - 配置选项说明

---

**提示**：如果遇到问题，请查看 [故障排除指南](./user-guide.md#故障排除) 或在 GitHub 上提交 Issue。