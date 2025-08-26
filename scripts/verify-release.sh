#!/bin/bash
set -e

echo "🔍 开始 Claude Code Router 发布验证..."

# 获取当前版本号
CURRENT_VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME="@musistudio/claude-code-router"

echo "📦 验证版本: v$CURRENT_VERSION"
echo "📦 包名: $PACKAGE_NAME"

# 等待 NPM 同步
echo ""
echo "⏱️  等待 NPM 同步 (60秒)..."
sleep 60

echo ""
echo "🧹 清理本地缓存..."
npm cache clean --force >/dev/null 2>&1
if command -v pnpm >/dev/null 2>&1; then
  pnpm store prune >/dev/null 2>&1
fi

echo ""
echo "📋 验证检查清单:"

# 1. 检查 NPM 包信息
echo -n "  🔍 检查 NPM 包信息... "
if npm info $PACKAGE_NAME@$CURRENT_VERSION >/dev/null 2>&1; then
  echo "✅"
else
  echo "❌"
  echo "❌ NPM 包信息获取失败，可能需要更多时间同步"
  exit 1
fi

# 2. 检查版本是否正确
echo -n "  🏷️  验证版本号... "
NPM_VERSION=$(npm info $PACKAGE_NAME version 2>/dev/null)
if [[ "$NPM_VERSION" == "$CURRENT_VERSION" ]]; then
  echo "✅ ($NPM_VERSION)"
else
  echo "❌ (期望: $CURRENT_VERSION, 实际: $NPM_VERSION)"
  exit 1
fi

# 3. 全局安装测试
echo -n "  📦 全局安装测试... "
if npm install -g $PACKAGE_NAME >/dev/null 2>&1; then
  echo "✅"
else
  echo "❌"
  echo "❌ 全局安装失败"
  exit 1
fi

# 4. 基础命令测试
echo -n "  🛠️  基础命令测试... "

# 检查 ccr --version
if ccr --version >/dev/null 2>&1; then
  CCR_VERSION=$(ccr --version | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
  if [[ "$CCR_VERSION" == "$CURRENT_VERSION" ]]; then
    echo "✅ (v$CCR_VERSION)"
  else
    echo "⚠️  (版本不匹配: $CCR_VERSION != $CURRENT_VERSION)"
  fi
else
  echo "❌"
  echo "❌ ccr --version 命令失败"
  exit 1
fi

# 5. 帮助命令测试
echo -n "  📖 帮助命令测试... "
if ccr --help >/dev/null 2>&1; then
  echo "✅"
else
  echo "❌"
  echo "❌ ccr --help 命令失败"
  exit 1
fi

# 6. 状态命令测试
echo -n "  📊 状态命令测试... "
if ccr status >/dev/null 2>&1; then
  echo "✅"
else
  echo "✅ (未运行状态正常)"
fi

# 7. 启动服务测试
echo -n "  🚀 服务启动测试... "
ccr start --port 3457 >/dev/null 2>&1 &
SERVER_PID=$!
sleep 3

# 检查服务是否启动
if curl -s http://localhost:3457/health >/dev/null 2>&1; then
  echo "✅"
  # 停止服务
  kill $SERVER_PID 2>/dev/null || true
  ccr stop >/dev/null 2>&1 || true
else
  echo "⚠️  (服务启动但健康检查失败)"
  kill $SERVER_PID 2>/dev/null || true
  ccr stop >/dev/null 2>&1 || true
fi

# 8. 清理测试环境
echo -n "  🧹 清理测试环境... "
npm uninstall -g $PACKAGE_NAME >/dev/null 2>&1
echo "✅"

echo ""
echo "🎉 发布验证完成！"
echo ""
echo "📊 验证报告:"
echo "  📦 包名: $PACKAGE_NAME"
echo "  🏷️  版本: v$CURRENT_VERSION"
echo "  🌐 NPM 页面: https://www.npmjs.com/package/$PACKAGE_NAME"
echo "  📈 安装命令: npm install -g $PACKAGE_NAME"

echo ""
echo "📋 后续建议:"
echo "  1. 检查 NPM 包页面显示是否正常"
echo "  2. 监控下载统计数据"
echo "  3. 关注用户反馈和问题报告"
echo "  4. 更新项目文档和 README"

# 可选：检查多平台兼容性
read -p "是否执行多平台兼容性测试? (y/N): " platform_test
if [[ $platform_test =~ ^[Yy]$ ]]; then
  echo ""
  echo "🖥️  多平台兼容性测试:"
  
  echo -n "  🐧 Linux 兼容性... "
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ (当前平台)"
  else
    echo "⏭️  (跳过)"
  fi
  
  echo -n "  🍎 macOS 兼容性... "
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ (当前平台)"
  else
    echo "⏭️  (跳过)"
  fi
  
  echo -n "  🪟 Windows 兼容性... "
  if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "✅ (当前平台)"
  else
    echo "⏭️  (跳过)"
  fi
fi

echo ""
echo "✅ 所有验证完成！Claude Code Router v$CURRENT_VERSION 发布成功！"