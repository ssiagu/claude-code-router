#!/bin/bash
set -e

echo "🚀 开始 Claude Code Router 发布流程..."

# 检查工作目录是否干净
if [[ -n $(git status --porcelain) ]]; then
  echo "❌ 工作目录不干净，请先提交或储藏更改"
  exit 1
fi

# 检查是否在主分支
if [[ $(git branch --show-current) != "main" ]]; then
  echo "❌ 请切换到 main 分支"
  exit 1
fi

# 检查 NPM 登录状态
if ! npm whoami >/dev/null 2>&1; then
  echo "❌ 未登录 NPM，请先执行 npm login"
  exit 1
fi

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 清理并重新安装依赖
echo "🧹 清理依赖..."
rm -rf node_modules/.cache/
pnpm install --frozen-lockfile

# 运行测试
echo "🧪 运行测试..."
pnpm test

# 运行覆盖率测试
echo "📊 运行覆盖率测试..."
pnpm run test:coverage

# 构建项目
echo "🔨 构建项目..."
pnpm run build

# 验证构建
echo "✅ 验证构建..."
if ! node dist/cli.js --version >/dev/null 2>&1; then
  echo "❌ 构建验证失败"
  exit 1
fi

echo "✅ 当前版本: $(node -p "require('./package.json').version")"

# 询问版本类型
echo ""
echo "📦 选择版本升级类型:"
echo "1) patch   - 修订版本 (1.0.0 -> 1.0.1) - bug修复"
echo "2) minor   - 次版本 (1.0.0 -> 1.1.0) - 新功能"  
echo "3) major   - 主版本 (1.0.0 -> 2.0.0) - 破坏性更改"
echo "4) custom  - 自定义版本号"
echo ""

read -p "请选择 (1-4): " choice

case $choice in
  1)
    npm version patch
    ;;
  2)
    npm version minor
    ;;
  3)
    npm version major
    ;;
  4)
    read -p "请输入版本号 (例如: 1.2.3): " custom_version
    if [[ ! $custom_version =~ ^[0-9]+\.[0-9]+\.[0-9]+.*$ ]]; then
      echo "❌ 版本号格式不正确"
      exit 1
    fi
    npm version $custom_version
    ;;
  *)
    echo "❌ 无效选择"
    exit 1
    ;;
esac

# 获取新版本号
NEW_VERSION=$(node -p "require('./package.json').version")
echo "🏷️  新版本: v$NEW_VERSION"

# 最后确认
echo ""
echo "📋 发布前检查清单:"
echo "  ✅ 测试通过"
echo "  ✅ 覆盖率达标"
echo "  ✅ 构建成功"
echo "  ✅ 版本更新: v$NEW_VERSION"
echo "  ✅ Git 状态干净"
echo ""

read -p "确认发布 v$NEW_VERSION 到 NPM? (y/N): " confirm
if [[ $confirm =~ ^[Yy]$ ]]; then
  echo ""
  echo "📤 发布到 NPM..."
  
  # 执行发布
  if pnpm run release; then
    echo "✅ NPM 发布成功"
  else
    echo "❌ NPM 发布失败"
    exit 1
  fi
  
  echo "📤 推送到 Git..."
  git push origin main --tags
  
  echo ""
  echo "🎉 发布完成！"
  echo "📦 NPM: https://www.npmjs.com/package/@musistudio/claude-code-router"
  echo "🏷️  版本: v$NEW_VERSION"
  echo ""
  echo "📋 后续步骤:"
  echo "  1. 等待 2-5 分钟让 NPM 同步"
  echo "  2. 运行验证脚本: ./scripts/verify-release.sh"
  echo "  3. 检查 NPM 包页面"
  echo "  4. 测试全局安装: npm install -g @musistudio/claude-code-router"
  
else
  echo "❌ 发布已取消"
  # 撤销版本提交
  git reset --hard HEAD~1
  git tag -d v$NEW_VERSION 2>/dev/null || true
  echo "🔄 已撤销版本更改"
fi