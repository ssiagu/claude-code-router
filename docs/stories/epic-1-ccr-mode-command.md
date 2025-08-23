# ccr mode 命令 - Brownfield Enhancement

## 📋 Epic 信息

- **Epic ID**: Epic-1
- **Epic 标题**: ccr mode 命令 - Brownfield Enhancement  
- **优先级**: P0 (最高)
- **预估工期**: 1-2天
- **负责开发者**: 主开发者
- **状态**: Ready

## 🎯 Epic 目标

为现有Claude Code Router CLI系统添加 `ccr mode` 命令功能，使用户能够直接切换默认模型配置，无需重启服务即可实现模型切换，提高工作效率。

## 📖 Epic 描述

### 现有系统背景

- **当前相关功能**: Claude Code Router 具有完整的CLI命令系统 (start, stop, restart, status, statusline, code, ui, version, help)
- **技术栈**: Node.js + TypeScript + Fastify, 配置管理使用JSON5, 模型路由通过utils/router.ts处理
- **集成点**: 
  - `src/cli.ts` - CLI命令路由和解析
  - `src/utils/index.ts` - 配置文件读写和管理
  - `src/utils/router.ts` - 模型验证和路由逻辑
  - `src/middleware/commandParser.ts` - 已有的/model命令解析逻辑

### 增强详情

- **增加内容**: 新增 `ccr mode` 命令及其变体 (mode, mode --show, mode --list, mode provider,model)
- **集成方式**: 
  - 在现有CLI命令映射中添加mode处理器
  - 复用现有的配置管理和模型验证逻辑
  - 创建独立的modeCommand.ts模块处理所有mode相关逻辑
- **成功标准**: 
  - 响应时间 < 500ms
  - 配置修改立即生效无需重启
  - 完整的模型验证和错误处理
  - 友好的用户界面和状态反馈

## 📚 Stories

### Story 1.1: [创建核心模式命令模块](./1.1.create-mode-command-module.md)
创建 `src/utils/modeCommand.ts` 模块，实现模式命令的核心逻辑，包括参数解析、模型验证和配置获取功能。
**状态**: Ready for Development

### Story 1.2: [实现安全配置更新机制](./1.2.secure-config-update.md)  
在modeCommand模块中实现原子性配置文件更新，包括备份、验证、回滚机制，确保配置文件完整性和并发安全。
**状态**: Ready for Development
**依赖**: Story 1.1

### Story 1.3: [集成CLI命令系统](./1.3.cli-integration.md)
修改 `src/cli.ts` 添加mode命令支持，集成到现有命令处理框架，保持与其他命令的一致性和兼容性。
**状态**: Ready for Development
**依赖**: Story 1.1, Story 1.2

## ✅ 兼容性要求

- [x] 现有CLI命令API保持不变
- [x] 配置文件schema向后兼容 (只修改Router.default字段)
- [x] 命令行界面遵循现有模式和风格
- [x] 性能影响最小化 (单命令执行)

## ⚠️ 风险缓解

- **主要风险**: 配置文件损坏导致服务无法启动
- **缓解措施**: 
  - 实现原子性文件操作 (备份-修改-验证-写入)
  - 严格的输入验证和模型存在性检查
  - 配置验证失败时自动回滚到备份
- **回滚计划**: 
  - 自动备份机制保留最近3个配置版本
  - 验证失败时立即恢复备份文件
  - 提供手动config文件恢复指导

## ✅ 完成定义

- [ ] 所有3个故事完成并满足验收标准
- [ ] 现有CLI功能通过回归测试验证
- [ ] mode命令与现有路由系统正确集成
- [ ] 文档更新包含新命令使用说明
- [ ] 性能测试证明响应时间 < 500ms
- [ ] 配置安全性和并发处理验证完成

---

**Story Manager交接**:

"请为此brownfield epic开发详细的用户故事。关键考虑因素:

- 这是对运行在 Node.js + TypeScript 技术栈上的现有CLI系统的增强
- 集成点: CLI命令路由 (cli.ts), 配置管理 (utils/index.ts), 模型验证 (utils/router.ts), 命令解析器 (middleware/commandParser.ts)
- 要遵循的现有模式: 现有CLI命令结构、配置文件格式、错误处理模式
- 关键兼容性要求: 保持现有API不变, 配置向后兼容, 遵循现有UX模式
- 每个故事必须包含现有功能保持完整的验证

这个epic应当在保持系统完整性的同时提供模型切换的CLI功能。"

---

*Epic创建日期: 2025-01-23*  
*负责产品负责人: Sarah*