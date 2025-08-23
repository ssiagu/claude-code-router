# 监控与日志架构

## 操作审计

### 日志记录策略

**日志内容:**
- 命令执行时间戳
- 用户操作详情
- 配置变更记录
- 错误和异常信息

```typescript
class ModeCommandLogger {
  static async logOperation(operation: {
    command: string;
    args: string[];
    result: ModeCommandResult;
    duration: number;
  }): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      command: 'ccr mode',
      arguments: operation.args,
      success: operation.result.success,
      duration: operation.duration,
      previousModel: operation.result.previousModel,
      newModel: operation.result.newModel
    };
    
    await writeLog('mode-command', logEntry);
  }
}
```

### 日志级别和分类

**日志级别定义:**
- **ERROR**: 系统错误和异常
- **WARN**: 警告和潜在问题
- **INFO**: 常规操作信息
- **DEBUG**: 调试和详细信息

**日志分类:**
- **操作日志**: 用户命令执行记录
- **性能日志**: 执行时间和性能指标
- **错误日志**: 错误和异常详情
- **安全日志**: 安全相关事件

## 性能监控

### 关键指标跟踪

**监控指标:**
- 命令执行时间
- 配置文件操作延迟
- 错误率统计
- 用户操作频次

```typescript
class PerformanceMonitor {
  static async trackCommandExecution<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      await this.recordMetric('mode_command_success', duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      await this.recordMetric('mode_command_error', duration);
      throw error;
    }
  }
  
  private static async recordMetric(name: string, value: number): Promise<void> {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      labels: {
        component: 'mode-command',
        version: process.env.CCR_VERSION
      }
    };
    
    await writeMetric(metric);
  }
}
```

### 性能基准和告警

**性能基准:**
- 命令执行时间 < 500ms (95th percentile)
- 配置文件读写 < 100ms
- 内存使用增量 < 10MB

**告警触发条件:**
- 执行时间超过 1000ms
- 错误率超过 5%
- 连续失败超过 3 次

## 实时监控

### 健康状态检查

**健康指标:**
```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    configFileAccess: boolean;
    modelValidation: boolean;
    commandExecution: boolean;
  };
  metrics: {
    averageResponseTime: number;
    errorRate: number;
    lastSuccessfulOperation: string;
  };
}

class HealthMonitor {
  static async getHealthStatus(): Promise<HealthStatus> {
    const checks = {
      configFileAccess: await this.checkConfigFileAccess(),
      modelValidation: await this.checkModelValidation(),
      commandExecution: await this.checkCommandExecution()
    };
    
    const metrics = await this.getMetrics();
    
    const status = this.determineOverallStatus(checks, metrics);
    
    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
      metrics
    };
  }
}
```

### 实时告警系统

**告警机制:**
- 基于阈值的自动告警
- 多渠道通知（日志、文件、API）
- 告警等级分类

```typescript
enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

interface Alert {
  level: AlertLevel;
  message: string;
  component: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class AlertManager {
  static async sendAlert(alert: Alert): Promise<void> {
    // 记录告警日志
    logger.log(alert.level, `[ALERT] ${alert.message}`, alert.metadata);
    
    // 根据告警级别采取不同行动
    switch (alert.level) {
      case AlertLevel.CRITICAL:
        await this.notifyOncall(alert);
        break;
      case AlertLevel.ERROR:
        await this.notifyTeam(alert);
        break;
      case AlertLevel.WARNING:
        await this.recordWarning(alert);
        break;
    }
  }
}
```

## 日志管理

### 日志轮转和存储

**日志轮转策略:**
- 按大小轮转：单文件最大 100MB
- 按时间轮转：每日轮转
- 保留期限：30天
- 压缩存储：gzip 压缩

**日志文件结构:**
```
logs/
├── mode-command/
│   ├── mode-command.2025-01-23.log
│   ├── mode-command.2025-01-22.log.gz
│   └── ...
├── performance/
│   ├── metrics.2025-01-23.log
│   └── ...
└── errors/
    ├── errors.2025-01-23.log
    └── ...
```

### 日志查询和分析

**查询接口:**
```typescript
interface LogQuery {
  startTime?: string;
  endTime?: string;
  level?: string;
  component?: string;
  keyword?: string;
  limit?: number;
}

class LogAnalyzer {
  static async queryLogs(query: LogQuery): Promise<LogEntry[]> {
    // 实现日志查询逻辑
    return await searchLogs(query);
  }
  
  static async getErrorSummary(timeRange: string): Promise<ErrorSummary> {
    // 统计错误摘要
    return await analyzeErrors(timeRange);
  }
  
  static async getPerformanceReport(timeRange: string): Promise<PerformanceReport> {
    // 生成性能报告
    return await generatePerformanceReport(timeRange);
  }
}
```

## 运维监控

### 指标收集

**关键运维指标:**
- 系统资源使用率
- 功能可用性
- 用户操作成功率
- 配置文件完整性

### 监控仪表板

**监控面板设计:**
- 实时性能指标图表
- 错误率趋势分析
- 用户操作热力图
- 系统健康状态概览

### 自动化运维

**自动化响应:**
- 自动错误恢复
- 配置文件自动备份
- 性能异常自动告警
- 日志自动清理