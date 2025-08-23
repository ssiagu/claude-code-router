# 集成架构

## 与现有系统集成

### CLI 命令系统集成

**最小修改原则:**
- 在现有 `cli.ts` 中添加 mode 命令入口
- 复用现有的命令处理框架
- 保持命令行参数解析的一致性

**集成点:**
```typescript
// cli.ts 中的修改
import { executeModeCommand } from './utils/modeCommand';

// 在命令处理器中添加
case 'mode':
  result = await executeModeCommand(args);
  break;
```

### 配置系统集成

**复用现有工具:**
- 使用 `src/utils/index.ts` 中的配置读写函数
- 保持配置文件格式的兼容性
- 集成现有的错误处理机制

**集成策略:**
- 不修改现有配置文件结构
- 仅扩展配置管理功能
- 保持向后兼容性

## 服务生命周期集成

### 热更新支持

**配置更新后的服务同步:**
```typescript
async function updateDefaultModel(provider: string, model: string): Promise<ModeCommandResult> {
  // 1. 更新配置文件
  await updateConfig(provider, model);
  
  // 2. 通知运行中的服务 (如果存在)
  if (await isServerRunning()) {
    await notifyServerConfigChanged();
  }
  
  // 3. 返回操作结果
  return {
    success: true,
    message: `✅ 默认模型已成功切换为: ${provider},${model}`,
    newModel: `${provider},${model}`
  };
}
```

### 服务状态管理

**服务检测和通知机制:**
- 检测 CCR 服务运行状态
- 配置变更时通知服务重新加载
- 保证配置变更的实时生效

## 与现有模块的交互

### 路由系统集成

**模型验证逻辑复用:**
- 复用 `src/utils/router.ts` 中的验证函数
- 保持验证规则的一致性
- 避免重复实现

### 命令解析器集成

**格式化逻辑复用:**
- 复用 `src/middleware/commandParser.ts` 中的格式化逻辑
- 保持命令行输出格式的一致性
- 统一用户体验

## API 兼容性保证

### 现有接口不变

**保持现有功能:**
- 不修改现有 API 接口
- 新增功能不影响现有功能
- 配置文件格式保持兼容

### 渐进式功能启用

**分阶段集成:**
- 功能开关控制新功能
- 平滑的功能迁移
- 回滚机制准备

## 数据迁移策略

### 无需数据迁移

**兼容性设计:**
- 现有配置自动兼容
- 不需要用户手动迁移
- 保持数据格式一致性

### 配置文件版本控制

**版本管理:**
- 支持配置文件版本标识
- 向前兼容旧版本配置
- 平滑升级路径