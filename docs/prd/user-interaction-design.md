# 用户交互设计

## 命令行界面设计

### 视觉设计原则

**颜色和符号使用:**
- ✅ 绿色：成功操作
- ❌ 红色：错误信息  
- 💡 黄色：提示建议
- 📋 蓝色：信息展示
- 📝 紫色：列表内容

### 成功场景设计

```bash
$ ccr mode deepseek,deepseek-chat
✅ 默认模型已成功切换为: deepseek,deepseek-chat
   之前的配置: openrouter,anthropic/claude-3.5-sonnet

💡 提示: 使用 'ccr mode' 查看当前配置
```

## 帮助信息设计

### 更新后的帮助信息

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