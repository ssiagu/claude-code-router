# 安全架构

## 配置文件安全

### 文件权限控制

**安全措施:**
- 配置文件读写权限验证
- 临时文件安全处理
- 备份文件权限控制

```typescript
async function secureConfigOperation<T>(operation: () => Promise<T>): Promise<T> {
  // 1. 验证文件权限
  await validateFilePermissions();
  
  // 2. 获取文件锁
  const lock = await acquireFileLock();
  
  try {
    // 3. 执行操作
    return await operation();
  } finally {
    // 4. 释放文件锁
    await lock.release();
  }
}
```

### 并发控制

**防止配置冲突:**
- 文件锁机制
- 原子性操作保证
- 冲突检测和恢复

**并发安全策略:**
```typescript
class ConfigFileLock {
  private static locks: Map<string, Promise<void>> = new Map();
  
  static async acquireLock(configPath: string): Promise<() => void> {
    if (this.locks.has(configPath)) {
      await this.locks.get(configPath);
    }
    
    const lockPromise = new Promise<void>((resolve) => {
      // 实现文件锁逻辑
    });
    
    this.locks.set(configPath, lockPromise);
    
    return () => {
      this.locks.delete(configPath);
    };
  }
}
```

## 输入验证安全

### 参数安全验证

**多层验证机制:**
1. **格式验证**: 参数格式符合预期
2. **长度验证**: 防止过长输入攻击
3. **字符验证**: 过滤危险字符
4. **业务验证**: 符合业务规则

**安全验证实现:**
```typescript
class SecurityValidator {
  static validateInput(provider: string, model: string): ValidationResult {
    // 1. 空值检查
    if (!provider?.trim() || !model?.trim()) {
      return { valid: false, error: 'EMPTY_INPUT' };
    }
    
    // 2. 长度限制
    if (provider.length > 50 || model.length > 100) {
      return { valid: false, error: 'INPUT_TOO_LONG' };
    }
    
    // 3. 危险字符检查
    const dangerousChars = /[<>\"'&;`|*?~$(){}[\]\\]/;
    if (dangerousChars.test(provider) || dangerousChars.test(model)) {
      return { valid: false, error: 'DANGEROUS_CHARACTERS' };
    }
    
    // 4. 注入攻击防护
    const injectionPatterns = [/javascript:/i, /data:/i, /vbscript:/i];
    const input = `${provider},${model}`;
    if (injectionPatterns.some(pattern => pattern.test(input))) {
      return { valid: false, error: 'INJECTION_ATTEMPT' };
    }
    
    return { valid: true };
  }
}
```

## 数据完整性保护

### 配置文件完整性

**完整性检查机制:**
- 配置文件格式验证
- 必需字段存在性检查
- 数据类型一致性验证

```typescript
interface ConfigValidationSchema {
  Router: {
    default: string;
    background?: string;
    reasoning?: string;
  };
  Providers: Record<string, {
    models: string[];
    [key: string]: any;
  }>;
}

function validateConfigIntegrity(config: any): boolean {
  try {
    // 1. 基本结构验证
    if (!config.Router || !config.Providers) {
      return false;
    }
    
    // 2. Router 字段验证
    if (typeof config.Router.default !== 'string') {
      return false;
    }
    
    // 3. Providers 结构验证
    for (const [providerName, providerConfig] of Object.entries(config.Providers)) {
      if (!Array.isArray(providerConfig.models)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
}
```

## 错误处理安全

### 安全错误信息

**信息泄露防护:**
- 不暴露系统内部信息
- 标准化错误消息
- 记录详细错误但只返回安全信息

```typescript
class SecureErrorHandler {
  static handleError(error: Error, context: string): ModeCommandResult {
    // 记录详细错误信息（仅内部）
    logger.error(`[${context}] ${error.message}`, {
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // 返回安全的用户错误信息
    const safeMessage = this.getSafeErrorMessage(error);
    
    return {
      success: false,
      message: safeMessage
    };
  }
  
  private static getSafeErrorMessage(error: Error): string {
    // 根据错误类型返回安全的用户消息
    if (error.name === 'ValidationError') {
      return '❌ 输入参数验证失败，请检查格式是否正确';
    }
    
    if (error.name === 'ConfigError') {
      return '❌ 配置文件操作失败，请检查文件权限';
    }
    
    // 默认安全消息
    return '❌ 操作失败，请重试或联系技术支持';
  }
}
```

## 审计和监控

### 操作审计

**安全操作记录:**
- 所有配置修改操作记录
- 包含用户标识、时间戳、操作内容
- 支持安全审计追踪

```typescript
interface SecurityAuditLog {
  timestamp: string;
  operation: string;
  user?: string;
  parameters: any;
  result: 'success' | 'failure';
  errorCode?: string;
  clientInfo: {
    ip?: string;
    userAgent?: string;
  };
}

class SecurityAuditor {
  static async logOperation(log: SecurityAuditLog): Promise<void> {
    // 写入安全审计日志
    await writeSecurityLog(log);
    
    // 如果是敏感操作，立即通知
    if (this.isSensitiveOperation(log.operation)) {
      await this.notifySecurityTeam(log);
    }
  }
}
```