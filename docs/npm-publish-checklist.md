# NPM 发布检查清单

## 📋 发布前检查

### 1. 代码质量检查
- [ ] 所有测试通过：`pnpm test`
- [ ] 测试覆盖率达标：`pnpm run test:coverage` (>90%)
- [ ] 代码构建成功：`pnpm run build`
- [ ] TypeScript 编译无错误
- [ ] ESLint 检查通过

### 2. 版本管理
- [ ] 更新版本号：`npm version [patch|minor|major]`
- [ ] 更新 CHANGELOG.md
- [ ] 提交所有更改：`git add . && git commit -m "Release v1.x.x"`
- [ ] 创建 Git 标签：`git tag v1.x.x`

### 3. 包配置检查
- [ ] package.json 信息正确
  - [ ] name: `@musistudio/claude-code-router`
  - [ ] version: 正确的版本号
  - [ ] description: 描述准确
  - [ ] keywords: 关键词完整
  - [ ] bin: CLI 入口正确
- [ ] dist/ 目录包含构建文件
- [ ] README.md 文档更新
- [ ] LICENSE 文件存在

### 4. 功能验证
- [ ] CLI 命令正常工作：`node dist/cli.js --help`
- [ ] 核心功能测试：启动服务、模型切换等
- [ ] 配置文件生成正常

### 5. 发布配置
- [ ] NPM 账户登录：`npm whoami`
- [ ] 发布权限确认
- [ ] 网络连接正常

## 🚀 发布命令

### 标准发布流程（推荐）

```bash
# 1. 最终测试
pnpm test && pnpm run build

# 2. 版本升级
npm version patch  # 或 minor/major

# 3. 发布
pnpm run release

# 4. 推送到 Git
git push origin main --tags
```

### 本机手动发布流程

#### 环境准备

```bash
# 1. 检查 NPM 登录状态
npm whoami

# 2. 如果未登录，执行登录
npm login
# 输入用户名、密码、邮箱、OTP（如果启用2FA）

# 3. 检查当前 NPM 源
npm config get registry
# 确保是 https://registry.npmjs.org/

# 4. 如果使用了 cnpm 或其他源，切换回官方源
npm config set registry https://registry.npmjs.org/
```

#### 完整本机发布命令

```bash
# === 发布前准备 ===

# 1. 确保在主分支
git checkout main
git pull origin main

# 2. 清理构建缓存
rm -rf dist/ node_modules/.cache/

# 3. 重新安装依赖
pnpm install --frozen-lockfile

# 4. 运行完整测试套件
pnpm test
pnpm run test:coverage

# 5. 构建项目
pnpm run build

# 6. 验证构建文件
ls -la dist/
node dist/cli.js --version

# === 版本管理 ===

# 7. 更新版本号（选择其中一种）
npm version patch    # 修订版本 1.0.0 -> 1.0.1
npm version minor    # 次版本 1.0.0 -> 1.1.0
npm version major    # 主版本 1.0.0 -> 2.0.0
# 或手动指定版本
npm version 1.2.3

# 8. 查看生成的版本
echo "新版本: $(node -p "require('./package.json').version")"

# === 发布操作 ===

# 9. 执行发布（二选一）

# 方式一：使用项目脚本（推荐）
pnpm run release

# 方式二：直接使用 npm publish
npm publish --access public

# === 发布后处理 ===

# 10. 推送代码和标签
git push origin main
git push origin --tags

# 11. 创建 GitHub Release（可选）
gh release create v$(node -p "require('./package.json').version") \
  --title "Release v$(node -p "require('./package.json').version")" \
  --notes "详见 CHANGELOG.md"
```

#### 快速发布脚本

创建 `scripts/publish.sh` 文件：

```bash
# 给脚本执行权限（Linux/macOS）
chmod +x scripts/publish.sh

# 运行发布脚本
./scripts/publish.sh

# Windows 环境
bash scripts/publish.sh
```

**脚本功能特性：**
- ✅ 自动环境检查（Git状态、NPM登录、分支验证）
- ✅ 完整的测试和构建流程
- ✅ 交互式版本选择
- ✅ 发布前最终确认
- ✅ 错误处理和回滚机制
- ✅ 发布后指导

**验证脚本：**

```bash
# 发布后运行验证脚本
./scripts/verify-release.sh

# Windows 环境
bash scripts/verify-release.sh
```

**验证脚本功能：**
- 🔍 NPM包信息验证
- 📦 全局安装测试
- 🛠️ 命令功能测试
- 🚀 服务启动测试
- 🖥️ 多平台兼容性检查
- 📊 完整验证报告

## 📝 发布后验证

### 基础验证

- [ ] NPM 包页面正常：https://www.npmjs.com/package/@musistudio/claude-code-router
- [ ] 包信息正确显示（版本、描述、关键词等）
- [ ] 下载统计更新

### 本机验证流程

```bash
# 1. 等待 NPM 同步（通常 2-5 分钟）
echo "⏱️  等待 NPM 同步..."
sleep 60

# 2. 清理本地缓存
npm cache clean --force
pnpm store prune

# 3. 全局安装测试
npm install -g @musistudio/claude-code-router

# 4. 基础命令测试
ccr --version
ccr --help

# 5. 功能测试
ccr status
echo "🧪 测试启动服务..."
ccr start --port 3457 &
SERVER_PID=$!
sleep 3

# 6. 检查服务状态
curl -s http://localhost:3457/health || echo "⚠️  服务未正常启动"

# 7. 停止测试服务
kill $SERVER_PID 2>/dev/null || true
ccr stop

# 8. 不同环境测试
echo "📋 测试不同 Node.js 版本..."
npm list -g @musistudio/claude-code-router
node --version
npm --version

# 9. 清理测试环境
npm uninstall -g @musistudio/claude-code-router
echo "✅ 本机验证完成！"
```

### 多平台验证（可选）

```bash
# Windows
npm install -g @musistudio/claude-code-router
ccr.cmd --version

# macOS
npm install -g @musistudio/claude-code-router
ccr --version

# Linux
npm install -g @musistudio/claude-code-router
ccr --version
```

### CI/CD 环境验证

```bash
# 模拟 GitHub Actions 环境
export CI=true
export NON_INTERACTIVE_MODE=true
npm install -g @musistudio/claude-code-router
ccr start --port 3456 &
sleep 5
ccr status
ccr stop
```

### 回归测试检查清单

- [ ] **基础命令可用性**
  - [ ] `ccr --version` 显示正确版本
  - [ ] `ccr --help` 显示帮助信息
  - [ ] `ccr status` 显示状态信息

- [ ] **核心功能验证**
  - [ ] 服务启动：`ccr start` 或 `ccr code`
  - [ ] UI 模式：`ccr ui`
  - [ ] 状态行工具：`ccr statusline`
  - [ ] 服务停止：`ccr stop`

- [ ] **配置管理**
  - [ ] 配置文件自动生成
  - [ ] 环境变量读取正常
  - [ ] 默认配置可用

- [ ] **集成测试**
  - [ ] Claude Code 连接正常
  - [ ] 模型路由工作正常
  - [ ] 请求转换功能正常

## 🔄 回滚计划

如果发布出现问题：

```bash
# 撤回发布（24小时内）
npm unpublish @musistudio/claude-code-router@1.x.x

# 发布修复版本
npm version patch
pnpm run release
```

### 紧急回滚流程

```bash
# 1. 立即撤回有问题的版本
npm unpublish @musistudio/claude-code-router@1.x.x --force

# 2. 修复问题
git checkout main
# 修复代码...

# 3. 快速发布修复版本
pnpm test && pnpm run build
npm version patch
pnpm run release
git push origin main --tags

# 4. 通知用户
echo "🔔 发布通知: v$(node -p "require('./package.json').version") 已修复关键问题"
```

### 版本管理最佳实践

- **补丁版本 (patch)**：bug修复、安全更新
- **次版本 (minor)**：新功能添加、向后兼容
- **主版本 (major)**：破坏性更改、API变更

### 发布后监控

```bash
# 监控 NPM 下载量
npm info @musistudio/claude-code-router

# 检查问题报告
echo "检查 GitHub Issues: https://github.com/username/claude-code-router/issues"

# 监控用户反馈
echo "关注社区反馈和使用报告"