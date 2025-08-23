# 扩展性架构

## 未来扩展点

### 功能扩展

**潜在扩展方向:**
- 多配置文件支持
- 配置模板管理
- 批量操作支持
- 配置导入导出

**架构预留:**
```typescript
// 为未来扩展预留的接口
interface ModeCommandExtension {
  name: string;
  version: string;
  handler: (args: string[]) => Promise<ModeCommandResult>;
}

class ModeCommandRegistry {
  private static extensions: Map<string, ModeCommandExtension> = new Map();
  
  static registerExtension(extension: ModeCommandExtension): void {
    this.extensions.set(extension.name, extension);
  }
  
  static async executeExtension(name: string, args: string[]): Promise<ModeCommandResult> {
    const extension = this.extensions.get(name);
    if (!extension) {
      throw new Error(`扩展 '${name}' 未找到`);
    }
    
    return await extension.handler(args);
  }
}
```

### 配置模板系统

**模板扩展设计:**
```typescript
interface ConfigTemplate {
  name: string;
  description: string;
  category: 'development' | 'production' | 'testing';
  config: Partial<ConfigStructure>;
  variables?: Record<string, TemplateVariable>;
}

interface TemplateVariable {
  type: 'string' | 'number' | 'boolean' | 'select';
  description: string;
  default?: any;
  options?: any[];
  required?: boolean;
}

class TemplateManager {
  static async applyTemplate(templateName: string, variables: Record<string, any>): Promise<void> {
    const template = await this.loadTemplate(templateName);
    const resolvedConfig = await this.resolveTemplate(template, variables);
    await this.mergeWithCurrentConfig(resolvedConfig);
  }
  
  static async createTemplate(name: string, config: ConfigStructure): Promise<void> {
    const template: ConfigTemplate = {
      name,
      description: `用户创建的模板: ${name}`,
      category: 'development',
      config: this.extractTemplateFromConfig(config)
    };
    
    await this.saveTemplate(template);
  }
}
```

## 插件架构

### 插件系统集成

**与现有插件系统的集成:**
- 利用现有的 transformer 系统
- 扩展 custom-router 功能
- 插件配置管理统一

```typescript
interface ModeCommandPlugin {
  name: string;
  version: string;
  description: string;
  commands: PluginCommand[];
  hooks: PluginHooks;
}

interface PluginCommand {
  name: string;
  description: string;
  handler: (args: string[]) => Promise<ModeCommandResult>;
  validation?: (args: string[]) => boolean;
}

interface PluginHooks {
  beforeModeChange?: (context: ModeChangeContext) => Promise<void>;
  afterModeChange?: (context: ModeChangeContext) => Promise<void>;
  onError?: (error: Error, context: any) => Promise<void>;
}

class PluginManager {
  private static plugins: Map<string, ModeCommandPlugin> = new Map();
  
  static async loadPlugin(pluginPath: string): Promise<void> {
    const plugin = await import(pluginPath);
    
    // 验证插件接口
    this.validatePlugin(plugin);
    
    // 注册插件
    this.plugins.set(plugin.name, plugin);
    
    // 注册命令
    for (const command of plugin.commands) {
      ModeCommandRegistry.registerExtension(command.name, {
        name: command.name,
        version: plugin.version,
        handler: command.handler
      });
    }
  }
}
```

### 钩子系统

**事件钩子机制:**
```typescript
enum ModeCommandEvent {
  BEFORE_VALIDATION = 'before_validation',
  AFTER_VALIDATION = 'after_validation',
  BEFORE_CONFIG_UPDATE = 'before_config_update',
  AFTER_CONFIG_UPDATE = 'after_config_update',
  ON_ERROR = 'on_error'
}

class EventSystem {
  private static hooks: Map<ModeCommandEvent, Function[]> = new Map();
  
  static addHook(event: ModeCommandEvent, callback: Function): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event)!.push(callback);
  }
  
  static async triggerEvent(event: ModeCommandEvent, context: any): Promise<void> {
    const callbacks = this.hooks.get(event) || [];
    
    for (const callback of callbacks) {
      try {
        await callback(context);
      } catch (error) {
        logger.error(`钩子执行失败 [${event}]: ${error.message}`);
      }
    }
  }
}
```

## API 扩展

### REST API 支持

**HTTP API 扩展:**
```typescript
interface ModeCommandAPI {
  // 获取当前模式
  getCurrentMode(): Promise<{ provider: string; model: string }>;
  
  // 切换模式
  switchMode(provider: string, model: string): Promise<SwitchResult>;
  
  // 获取可用模型列表
  getAvailableModels(): Promise<ProviderModels>;
  
  // 批量操作
  batchOperations(operations: BatchOperation[]): Promise<BatchResult>;
}

class ModeCommandAPIServer {
  static setupRoutes(app: Express): void {
    app.get('/api/mode/current', async (req, res) => {
      try {
        const currentMode = await getCurrentDefaultModel();
        res.json({ success: true, data: currentMode });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    app.post('/api/mode/switch', async (req, res) => {
      try {
        const { provider, model } = req.body;
        const result = await updateDefaultModel(provider, model);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }
}
```

### WebSocket 支持

**实时通信扩展:**
```typescript
class ModeCommandWebSocket {
  private static clients: Set<WebSocket> = new Set();
  
  static setupWebSocket(server: Server): void {
    const wss = new WebSocketServer({ server });
    
    wss.on('connection', (ws) => {
      this.clients.add(ws);
      
      ws.on('message', async (message) => {
        try {
          const command = JSON.parse(message.toString());
          const result = await this.handleWebSocketCommand(command);
          ws.send(JSON.stringify(result));
        } catch (error) {
          ws.send(JSON.stringify({ error: error.message }));
        }
      });
      
      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
  }
  
  static broadcastModeChange(change: ModeChange): void {
    const message = JSON.stringify({
      type: 'mode_change',
      data: change
    });
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
```

## 配置系统扩展

### 多环境配置

**环境隔离支持:**
```typescript
interface EnvironmentConfig {
  name: string;
  description: string;
  config: ConfigStructure;
  variables: Record<string, string>;
}

class EnvironmentManager {
  static async switchEnvironment(envName: string): Promise<void> {
    const environment = await this.loadEnvironment(envName);
    
    // 备份当前配置
    await BackupManager.createBackup(`切换到环境: ${envName}`);
    
    // 应用环境配置
    await this.applyEnvironmentConfig(environment);
    
    // 设置环境变量
    this.setEnvironmentVariables(environment.variables);
    
    logger.info(`已切换到环境: ${envName}`);
  }
  
  static async createEnvironment(name: string, config: ConfigStructure): Promise<void> {
    const environment: EnvironmentConfig = {
      name,
      description: `环境配置: ${name}`,
      config,
      variables: {}
    };
    
    await this.saveEnvironment(environment);
  }
}
```

### 配置版本控制

**配置历史管理:**
```typescript
interface ConfigVersion {
  version: string;
  timestamp: string;
  author: string;
  description: string;
  config: ConfigStructure;
  changes: ConfigChange[];
}

class ConfigVersionControl {
  static async commitConfig(description: string, author: string): Promise<string> {
    const currentConfig = await readConfigFile();
    const previousVersion = await this.getLatestVersion();
    
    const changes = this.calculateChanges(previousVersion?.config, currentConfig);
    const version = this.generateVersion();
    
    const configVersion: ConfigVersion = {
      version,
      timestamp: new Date().toISOString(),
      author,
      description,
      config: currentConfig,
      changes
    };
    
    await this.saveVersion(configVersion);
    return version;
  }
  
  static async revertToVersion(version: string): Promise<void> {
    const targetVersion = await this.getVersion(version);
    if (!targetVersion) {
      throw new Error(`版本 ${version} 不存在`);
    }
    
    // 创建回滚前的备份
    await this.commitConfig(`回滚到版本 ${version} 前的状态`, 'system');
    
    // 应用目标版本配置
    await writeConfigFile(targetVersion.config);
    
    logger.info(`已回滚到版本: ${version}`);
  }
}
```

## 监控扩展

### 自定义指标

**指标扩展系统:**
```typescript
interface CustomMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  description: string;
  labels?: string[];
  collector: () => Promise<number>;
}

class MetricsExtension {
  private static customMetrics: Map<string, CustomMetric> = new Map();
  
  static registerMetric(metric: CustomMetric): void {
    this.customMetrics.set(metric.name, metric);
  }
  
  static async collectAllMetrics(): Promise<MetricData[]> {
    const results: MetricData[] = [];
    
    for (const [name, metric] of this.customMetrics) {
      try {
        const value = await metric.collector();
        results.push({
          name,
          type: metric.type,
          value,
          timestamp: Date.now()
        });
      } catch (error) {
        logger.error(`指标收集失败 [${name}]: ${error.message}`);
      }
    }
    
    return results;
  }
}
```

### 告警扩展

**自定义告警规则:**
```typescript
interface AlertRule {
  name: string;
  condition: (metrics: MetricData[]) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actions: AlertAction[];
}

interface AlertAction {
  type: 'email' | 'webhook' | 'log' | 'script';
  config: Record<string, any>;
}

class AlertingExtension {
  private static rules: AlertRule[] = [];
  
  static addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }
  
  static async evaluateRules(metrics: MetricData[]): Promise<void> {
    for (const rule of this.rules) {
      try {
        if (rule.condition(metrics)) {
          await this.triggerAlert(rule);
        }
      } catch (error) {
        logger.error(`告警规则评估失败 [${rule.name}]: ${error.message}`);
      }
    }
  }
}
```