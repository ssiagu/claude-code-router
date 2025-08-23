# 系统架构

## 整体架构图

```
                    ┌─────────────────┐
                    │   CLI Interface │
                    │    (cli.ts)     │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │ Command Router  │
                    │ (mode command)  │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │  Mode Command   │
                    │    Handler      │
                    │(modeCommand.ts) │
                    └─────┬─────┬─────┘
                          │     │
              ┌───────────▼─┐ ┌─▼─────────────┐
              │ Config Mgr  │ │ Model Validator│
              │(index.ts)   │ │(router.ts)     │
              └─────────────┘ └────────────────┘
                          │
                    ┌─────▼─────┐
                    │config.json│
                    │   File    │
                    └───────────┘
```

## 模块责任矩阵

| 模块 | 职责 | 输入 | 输出 | 依赖 |
|------|------|------|------|------|
| CLI Interface | 命令解析和路由 | 用户命令 | 执行结果 | Command Router |
| Mode Command Handler | 模式管理逻辑 | 解析后的参数 | 操作结果 | Config Manager, Validator |
| Config Manager | 配置文件管理 | 配置操作请求 | 操作状态 | File System |
| Model Validator | 模型验证 | 模型标识 | 验证结果 | 配置数据 |

## 架构层次

### 表现层
- **CLI Interface**: 用户命令接口
- **Command Router**: 命令路由分发

### 业务逻辑层
- **Mode Command Handler**: 核心业务逻辑
- **Model Validator**: 业务规则验证

### 数据访问层
- **Config Manager**: 配置数据管理
- **File System**: 底层文件操作

### 数据层
- **config.json**: 配置数据存储