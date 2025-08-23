# 测试架构

## 测试策略

### 测试层级

**单元测试 (80% 覆盖率目标):**
- 模型解析函数测试
- 配置操作函数测试
- 验证逻辑测试
- 错误处理测试

**集成测试 (15% 覆盖率目标):**
- CLI 命令端到端测试
- 配置文件操作集成测试
- 与现有系统集成测试

**端到端测试 (5% 覆盖率目标):**
- 完整用户场景测试
- 错误恢复测试
- 性能基准测试

### 测试环境架构

```typescript
describe('Mode Command Tests', () => {
  beforeEach(async () => {
    // 1. 创建测试配置文件
    await createTestConfig();
    
    // 2. 初始化测试环境
    await initTestEnvironment();
  });
  
  afterEach(async () => {
    // 3. 清理测试资源
    await cleanupTestEnvironment();
  });
  
  describe('Model Switching', () => {
    it('should successfully switch default model', async () => {
      // 测试逻辑
    });
  });
});
```

## 单元测试设计

### 核心函数测试

**模型解析测试:**
```typescript
describe('parseModelString', () => {
  it('should parse valid model string', () => {
    const result = parseModelString('deepseek,deepseek-chat');
    expect(result).toEqual({
      provider: 'deepseek',
      model: 'deepseek-chat',
      original: 'deepseek,deepseek-chat'
    });
  });
  
  it('should return null for invalid format', () => {
    expect(parseModelString('invalid')).toBeNull();
    expect(parseModelString('')).toBeNull();
    expect(parseModelString('a,b,c')).toBeNull();
  });
});
```

**配置管理测试:**
```typescript
describe('updateDefaultModel', () => {
  it('should update config successfully', async () => {
    const result = await updateDefaultModel('deepseek', 'deepseek-chat');
    expect(result.success).toBe(true);
    expect(result.newModel).toBe('deepseek,deepseek-chat');
  });
  
  it('should handle config file errors', async () => {
    mockConfigError();
    const result = await updateDefaultModel('deepseek', 'deepseek-chat');
    expect(result.success).toBe(false);
    expect(result.message).toContain('配置文件操作失败');
  });
});
```

### 错误处理测试

**验证逻辑测试:**
```typescript
describe('Model Validation', () => {
  it('should reject invalid provider', async () => {
    const result = await executeModeCommand(['invalid,model']);
    expect(result.success).toBe(false);
    expect(result.message).toContain('提供商');
    expect(result.message).toContain('不存在');
  });
  
  it('should reject invalid model', async () => {
    const result = await executeModeCommand(['deepseek,invalid']);
    expect(result.success).toBe(false);
    expect(result.message).toContain('模型');
    expect(result.message).toContain('不存在');
  });
});
```

## 集成测试设计

### CLI 命令集成测试

**命令行接口测试:**
```typescript
describe('CLI Integration', () => {
  it('should handle mode command through CLI', async () => {
    const result = await executeCLICommand(['mode', 'deepseek,deepseek-chat']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('成功切换');
  });
  
  it('should show current mode', async () => {
    const result = await executeCLICommand(['mode']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('当前默认模型');
  });
});
```

### 配置文件集成测试

**配置持久化测试:**
```typescript
describe('Config File Integration', () => {
  it('should persist configuration changes', async () => {
    await updateDefaultModel('deepseek', 'deepseek-chat');
    
    // 重新读取配置
    const config = await readConfigFile();
    expect(config.Router.default).toBe('deepseek,deepseek-chat');
  });
  
  it('should maintain other config sections', async () => {
    const originalConfig = await readConfigFile();
    await updateDefaultModel('deepseek', 'deepseek-chat');
    const newConfig = await readConfigFile();
    
    expect(newConfig.Providers).toEqual(originalConfig.Providers);
    expect(newConfig.Router.background).toEqual(originalConfig.Router.background);
  });
});
```

## 端到端测试设计

### 用户场景测试

**完整工作流测试:**
```typescript
describe('End-to-End User Scenarios', () => {
  it('should complete model switching workflow', async () => {
    // 1. 查看当前模型
    const currentResult = await executeCLICommand(['mode']);
    expect(currentResult.exitCode).toBe(0);
    
    // 2. 切换模型
    const switchResult = await executeCLICommand(['mode', 'deepseek,deepseek-chat']);
    expect(switchResult.exitCode).toBe(0);
    
    // 3. 确认切换成功
    const confirmResult = await executeCLICommand(['mode']);
    expect(confirmResult.stdout).toContain('deepseek,deepseek-chat');
  });
});
```

### 性能基准测试

**响应时间测试:**
```typescript
describe('Performance Benchmarks', () => {
  it('should execute within performance targets', async () => {
    const startTime = performance.now();
    await executeModeCommand(['deepseek,deepseek-chat']);
    const duration = performance.now() - startTime;
    
    expect(duration).toBeLessThan(500); // 500ms 目标
  });
  
  it('should handle concurrent operations', async () => {
    const promises = Array(10).fill(0).map(() => 
      executeModeCommand(['deepseek,deepseek-chat'])
    );
    
    const results = await Promise.all(promises);
    expect(results.every(r => r.success)).toBe(true);
  });
});
```

## 测试数据管理

### 测试配置

**测试数据准备:**
```typescript
const TEST_CONFIG = {
  Router: {
    default: 'openrouter,anthropic/claude-3.5-sonnet',
    background: 'deepseek,deepseek-chat',
    reasoning: 'openrouter,o1-mini'
  },
  Providers: {
    deepseek: {
      models: ['deepseek-chat', 'deepseek-coder']
    },
    openrouter: {
      models: ['anthropic/claude-3.5-sonnet', 'o1-mini']
    }
  }
};

async function createTestConfig(): Promise<string> {
  const testConfigPath = path.join(os.tmpdir(), 'ccr-test-config.json');
  await fs.writeFile(testConfigPath, JSON.stringify(TEST_CONFIG, null, 2));
  return testConfigPath;
}
```

### 测试环境隔离

**环境隔离策略:**
- 独立的临时配置文件
- 隔离的日志目录
- 独立的缓存空间
- 清理机制保证

```typescript
class TestEnvironment {
  private tempDir: string;
  private configPath: string;
  
  async setup(): Promise<void> {
    this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccr-test-'));
    this.configPath = path.join(this.tempDir, 'config.json');
    
    // 设置测试环境变量
    process.env.CCR_CONFIG_PATH = this.configPath;
    process.env.CCR_LOG_DIR = path.join(this.tempDir, 'logs');
    
    // 创建测试配置
    await this.createTestConfig();
  }
  
  async cleanup(): Promise<void> {
    await fs.rm(this.tempDir, { recursive: true, force: true });
    delete process.env.CCR_CONFIG_PATH;
    delete process.env.CCR_LOG_DIR;
  }
}
```

## 测试自动化

### 持续集成测试

**CI/CD 流水线集成:**
```yaml
test:
  stage: test
  script:
    - npm install
    - npm run test:unit
    - npm run test:integration
    - npm run test:e2e
  coverage: '/Coverage: \d+\.\d+%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

### 测试报告

**覆盖率报告:**
- 代码覆盖率统计
- 未覆盖代码识别
- 覆盖率趋势分析

**测试结果报告:**
- 测试用例执行结果
- 性能基准对比
- 回归测试报告