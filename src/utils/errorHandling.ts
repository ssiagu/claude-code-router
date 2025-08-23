/**
 * Enhanced Error Handling Module
 * 
 * 提供分层级的错误处理系统，包括详细的错误信息、解决建议和视觉增强
 */

/**
 * 错误严重级别枚举
 */
export enum ErrorLevel {
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * 增强错误信息接口
 */
export interface EnhancedError {
  code: string;
  level: ErrorLevel;
  title: string;
  description: string;
  suggestions: string[];
  examples: string[];
  helpCommands: string[];
}

/**
 * 错误分类枚举
 */
export enum ErrorCode {
  // 模型相关错误
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  INVALID_MODEL_FORMAT = 'INVALID_MODEL_FORMAT',
  
  // 配置相关错误
  CONFIG_FILE_MISSING = 'CONFIG_FILE_MISSING',
  CONFIG_FILE_CORRUPTED = 'CONFIG_FILE_CORRUPTED',
  CONFIG_WRITE_FAILED = 'CONFIG_WRITE_FAILED',
  
  // 权限相关错误
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  
  // 网络和连接错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  
  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * 视觉增强图标常量
 */
export const Icons = {
  ERROR: '❌',
  WARNING: '⚠️',
  SUCCESS: '✅',
  INFO: 'ℹ️',
  TIP: '💡',
  EXAMPLE: '📝',
  COMMAND: '⚡',
  FILE: '📁',
  NETWORK: '🌐',
  SETTINGS: '⚙️'
} as const;

/**
 * 错误信息模板定义
 */
const errorTemplates: Record<ErrorCode, EnhancedError> = {
  [ErrorCode.MODEL_NOT_FOUND]: {
    code: ErrorCode.MODEL_NOT_FOUND,
    level: ErrorLevel.ERROR,
    title: '模型不存在',
    description: '指定的模型在配置中不存在',
    suggestions: [
      '查看可用模型列表',
      '检查模型名称拼写',
      '确认提供商是否正确配置'
    ],
    examples: [
      'ccr mode deepseek,deepseek-chat',
      'ccr mode openrouter,gpt-4'
    ],
    helpCommands: [
      'ccr mode --list',
      'ccr mode --help'
    ]
  },
  
  [ErrorCode.PROVIDER_NOT_FOUND]: {
    code: ErrorCode.PROVIDER_NOT_FOUND,
    level: ErrorLevel.ERROR,
    title: '提供商不存在',
    description: '指定的模型提供商在配置中不存在',
    suggestions: [
      '检查提供商名称拼写',
      '确认配置文件中已添加该提供商',
      '查看所有可用的提供商和模型'
    ],
    examples: [
      'ccr mode deepseek,deepseek-chat',
      'ccr mode openrouter,claude-3-sonnet'
    ],
    helpCommands: [
      'ccr mode --list',
      'ccr status'
    ]
  },
  
  [ErrorCode.INVALID_MODEL_FORMAT]: {
    code: ErrorCode.INVALID_MODEL_FORMAT,
    level: ErrorLevel.ERROR,
    title: '模型格式错误',
    description: '模型字符串格式不正确，应使用"提供商,模型名"的格式',
    suggestions: [
      '使用正确的格式: 提供商,模型名',
      '确保包含一个逗号分隔符',
      '检查提供商和模型名称中不包含空格'
    ],
    examples: [
      'ccr mode deepseek,deepseek-chat',
      'ccr mode openrouter,gpt-4',
      'ccr mode anthropic,claude-3-sonnet'
    ],
    helpCommands: [
      'ccr mode --help',
      'ccr mode --list'
    ]
  },
  
  [ErrorCode.CONFIG_FILE_MISSING]: {
    code: ErrorCode.CONFIG_FILE_MISSING,
    level: ErrorLevel.FATAL,
    title: '配置文件不存在',
    description: '应用程序配置文件未找到，无法继续操作',
    suggestions: [
      '运行初始化命令创建配置文件',
      '检查工作目录是否正确',
      '确认配置文件路径权限'
    ],
    examples: [
      'ccr start',
      'ccr init'
    ],
    helpCommands: [
      'ccr --help',
      'ccr start --help'
    ]
  },
  
  [ErrorCode.CONFIG_FILE_CORRUPTED]: {
    code: ErrorCode.CONFIG_FILE_CORRUPTED,
    level: ErrorLevel.FATAL,
    title: '配置文件损坏',
    description: '配置文件存在但无法正确解析，可能包含语法错误',
    suggestions: [
      '检查配置文件的 JSON 语法',
      '备份当前配置文件',
      '重新创建配置文件',
      '使用文本编辑器检查特殊字符'
    ],
    examples: [
      'cp config.json config.json.backup',
      'ccr start',
      'ccr ui  # 使用UI模式重新配置'
    ],
    helpCommands: [
      'ccr ui',
      'ccr start --help'
    ]
  },
  
  [ErrorCode.CONFIG_WRITE_FAILED]: {
    code: ErrorCode.CONFIG_WRITE_FAILED,
    level: ErrorLevel.ERROR,
    title: '配置保存失败',
    description: '无法保存配置文件更改，可能是权限或磁盘空间问题',
    suggestions: [
      '检查文件写入权限',
      '确认磁盘空间充足',
      '检查配置文件是否被其他程序占用',
      '使用管理员权限运行'
    ],
    examples: [
      'ls -la config.json  # 检查权限',
      'df -h  # 检查磁盘空间'
    ],
    helpCommands: [
      'ccr status',
      'ccr --help'
    ]
  },
  
  [ErrorCode.PERMISSION_DENIED]: {
    code: ErrorCode.PERMISSION_DENIED,
    level: ErrorLevel.ERROR,
    title: '权限不足',
    description: '操作被拒绝，通常是文件或目录权限问题',
    suggestions: [
      '检查文件和目录权限',
      '使用适当的用户权限运行',
      '确认当前用户对配置目录有写入权限'
    ],
    examples: [
      'chmod 755 .',
      'sudo ccr start  # 如果需要管理员权限'
    ],
    helpCommands: [
      'ccr --help'
    ]
  },
  
  [ErrorCode.FILE_ACCESS_DENIED]: {
    code: ErrorCode.FILE_ACCESS_DENIED,
    level: ErrorLevel.ERROR,
    title: '文件访问被拒绝',
    description: '无法访问指定的文件，通常是权限或文件锁定问题',
    suggestions: [
      '检查文件是否存在',
      '确认文件未被其他程序占用',
      '检查文件权限设置'
    ],
    examples: [
      'ls -la config.json',
      'lsof config.json  # 检查文件是否被占用'
    ],
    helpCommands: [
      'ccr status'
    ]
  },
  
  [ErrorCode.NETWORK_ERROR]: {
    code: ErrorCode.NETWORK_ERROR,
    level: ErrorLevel.WARNING,
    title: '网络连接错误',
    description: '无法连接到远程服务，请检查网络连接',
    suggestions: [
      '检查网络连接状态',
      '确认代理设置（如果使用）',
      '检查防火墙设置',
      '稍后重试操作'
    ],
    examples: [
      'ping google.com  # 测试网络连接',
      'curl -I https://api.openai.com  # 测试API连接'
    ],
    helpCommands: [
      'ccr status',
      'ccr --help'
    ]
  },
  
  [ErrorCode.API_ERROR]: {
    code: ErrorCode.API_ERROR,
    level: ErrorLevel.ERROR,
    title: 'API调用错误',
    description: '模型提供商API调用失败',
    suggestions: [
      '检查API密钥是否正确',
      '确认API配额是否充足',
      '检查网络连接',
      '稍后重试'
    ],
    examples: [
      'ccr status  # 查看当前配置',
      'ccr ui  # 检查API密钥配置'
    ],
    helpCommands: [
      'ccr status',
      'ccr ui'
    ]
  },
  
  [ErrorCode.UNKNOWN_ERROR]: {
    code: ErrorCode.UNKNOWN_ERROR,
    level: ErrorLevel.ERROR,
    title: '未知错误',
    description: '发生了未预期的错误',
    suggestions: [
      '重试操作',
      '检查应用程序日志',
      '报告问题给开发团队'
    ],
    examples: [
      'ccr status',
      'ccr --help'
    ],
    helpCommands: [
      'ccr --help'
    ]
  },
  
  [ErrorCode.VALIDATION_ERROR]: {
    code: ErrorCode.VALIDATION_ERROR,
    level: ErrorLevel.ERROR,
    title: '输入验证错误',
    description: '提供的参数或输入不符合要求',
    suggestions: [
      '检查命令参数格式',
      '参考帮助文档',
      '使用正确的命令语法'
    ],
    examples: [
      'ccr mode provider,model',
      'ccr --help'
    ],
    helpCommands: [
      'ccr --help',
      'ccr mode --help'
    ]
  }
};

/**
 * 创建增强错误消息
 * 
 * @param errorCode 错误码
 * @param context 错误上下文信息
 * @returns 格式化的错误消息字符串
 */
export function createEnhancedErrorMessage(
  errorCode: ErrorCode,
  context?: {
    modelString?: string;
    provider?: string;
    model?: string;
    filePath?: string;
    originalError?: string;
    availableModels?: string[];
  }
): string {
  const template = errorTemplates[errorCode];
  if (!template) {
    return createGenericErrorMessage(errorCode, context?.originalError);
  }
  
  let message = '';
  
  // 错误标题和级别图标
  const levelIcon = getLevelIcon(template.level);
  message += `${levelIcon} ${template.level === ErrorLevel.FATAL ? '致命错误' : 
              template.level === ErrorLevel.ERROR ? '错误' : '警告'}: ${template.title}\n\n`;
  
  // 问题描述
  message += `${Icons.INFO} 问题描述:\n`;
  message += `  ${template.description}\n`;
  
  // 添加具体的上下文信息
  if (context) {
    message += addContextDetails(errorCode, context);
  }
  
  // 解决方法
  if (template.suggestions.length > 0) {
    message += `\n${Icons.TIP} 解决方法:\n`;
    template.suggestions.forEach((suggestion, index) => {
      message += `  ${index + 1}. ${suggestion}\n`;
    });
  }
  
  // 示例命令
  if (template.examples.length > 0) {
    message += `\n${Icons.EXAMPLE} 示例命令:\n`;
    template.examples.forEach(example => {
      message += `  ${example}\n`;
    });
  }
  
  // 帮助命令
  if (template.helpCommands.length > 0) {
    message += `\n${Icons.COMMAND} 获取帮助: `;
    message += template.helpCommands.join(' | ');
  }
  
  return message;
}

/**
 * 根据错误级别获取对应图标
 */
function getLevelIcon(level: ErrorLevel): string {
  switch (level) {
    case ErrorLevel.WARNING:
      return Icons.WARNING;
    case ErrorLevel.ERROR:
      return Icons.ERROR;
    case ErrorLevel.FATAL:
      return Icons.ERROR;
    default:
      return Icons.INFO;
  }
}

/**
 * 添加特定错误的上下文详情
 */
function addContextDetails(
  errorCode: ErrorCode,
  context: any
): string {
  let details = '';
  
  switch (errorCode) {
    case ErrorCode.MODEL_NOT_FOUND:
    case ErrorCode.PROVIDER_NOT_FOUND:
      if (context.modelString) {
        details += `\n${Icons.INFO} 具体原因:\n`;
        details += `  • 尝试使用的模型: '${context.modelString}'\n`;
        
        if (context.provider) {
          details += `  • 提供商 '${context.provider}' 未在配置中找到\n`;
        }
        if (context.model) {
          details += `  • 模型 '${context.model}' 不存在\n`;
        }
        
        details += `  • 可能的拼写错误或配置缺失\n`;
        
        if (context.availableModels && context.availableModels.length > 0) {
          details += `\n${Icons.INFO} 可用模型:\n`;
          context.availableModels.slice(0, 5).forEach((model: string) => {
            details += `  • ${model}\n`;
          });
          if (context.availableModels.length > 5) {
            details += `  • ... 以及其他 ${context.availableModels.length - 5} 个模型\n`;
            details += `  • 使用 'ccr mode --list' 查看完整列表\n`;
          }
        }
      }
      break;
      
    case ErrorCode.INVALID_MODEL_FORMAT:
      if (context.modelString) {
        details += `\n${Icons.INFO} 具体原因:\n`;
        details += `  • 输入的字符串: '${context.modelString}'\n`;
        details += `  • 正确格式应为: 提供商,模型名\n`;
        details += `  • 必须包含一个逗号作为分隔符\n`;
      }
      break;
      
    case ErrorCode.CONFIG_FILE_MISSING:
    case ErrorCode.CONFIG_FILE_CORRUPTED:
      if (context.filePath) {
        details += `\n${Icons.FILE} 文件信息:\n`;
        details += `  • 配置文件路径: ${context.filePath}\n`;
      }
      if (context.originalError) {
        details += `  • 错误详情: ${context.originalError}\n`;
      }
      break;
      
    default:
      if (context.originalError) {
        details += `\n${Icons.INFO} 错误详情:\n`;
        details += `  ${context.originalError}\n`;
      }
      break;
  }
  
  return details;
}

/**
 * 创建通用错误消息（当没有特定模板时）
 */
function createGenericErrorMessage(errorCode: ErrorCode, originalError?: string): string {
  let message = `${Icons.ERROR} 错误: ${errorCode}\n\n`;
  
  if (originalError) {
    message += `${Icons.INFO} 错误信息:\n  ${originalError}\n\n`;
  }
  
  message += `${Icons.TIP} 建议操作:\n`;
  message += `  1. 检查命令参数是否正确\n`;
  message += `  2. 查看帮助文档\n`;
  message += `  3. 如果问题持续，请报告给开发团队\n\n`;
  message += `${Icons.COMMAND} 获取帮助: ccr --help`;
  
  return message;
}

/**
 * 从错误对象检测错误类型
 */
export function detectErrorType(error: any, context?: any): ErrorCode {
  if (!error) {
    return ErrorCode.UNKNOWN_ERROR;
  }
  
  const errorMessage = error.message || error.toString();
  
  // 文件相关错误
  if (error.code === 'ENOENT' || errorMessage.includes('no such file')) {
    return ErrorCode.CONFIG_FILE_MISSING;
  }
  if (error.code === 'EACCES' || errorMessage.includes('permission denied')) {
    return ErrorCode.PERMISSION_DENIED;
  }
  if (error.code === 'EPERM') {
    return ErrorCode.FILE_ACCESS_DENIED;
  }
  
  // 网络相关错误
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || 
      errorMessage.includes('network') || errorMessage.includes('connection')) {
    return ErrorCode.NETWORK_ERROR;
  }
  
  // JSON 解析错误
  if (errorMessage.includes('JSON') || errorMessage.includes('parse') ||
      errorMessage.includes('syntax')) {
    return ErrorCode.CONFIG_FILE_CORRUPTED;
  }
  
  // 根据上下文判断
  if (context) {
    if (context.invalidModel || context.modelNotFound) {
      return ErrorCode.MODEL_NOT_FOUND;
    }
    if (context.invalidProvider || context.providerNotFound) {
      return ErrorCode.PROVIDER_NOT_FOUND;
    }
    if (context.invalidFormat) {
      return ErrorCode.INVALID_MODEL_FORMAT;
    }
  }
  
  return ErrorCode.UNKNOWN_ERROR;
}

/**
 * 创建成功消息
 */
export function createSuccessMessage(message: string, details?: string[]): string {
  let output = `${Icons.SUCCESS} ${message}\n`;
  
  if (details && details.length > 0) {
    output += `\n${Icons.INFO} 详细信息:\n`;
    details.forEach(detail => {
      output += `  • ${detail}\n`;
    });
  }
  
  return output;
}

/**
 * 创建信息提示消息
 */
export function createInfoMessage(title: string, details: string[], helpCommands?: string[]): string {
  let message = `${Icons.INFO} ${title}\n\n`;
  
  details.forEach(detail => {
    message += `  • ${detail}\n`;
  });
  
  if (helpCommands && helpCommands.length > 0) {
    message += `\n${Icons.COMMAND} 相关命令: `;
    message += helpCommands.join(' | ');
  }
  
  return message;
}