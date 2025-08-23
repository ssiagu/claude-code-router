/**
 * Mode Command Module
 * 
 * 提供独立的模式命令功能，包括模型切换、状态查看等核心功能
 * 设计用于 CLI 集成和中间件使用
 */

import fs from 'node:fs';
import { readConfigFile, writeConfigFile } from './index';
import { validateModelExists, getAvailableModels } from '../middleware/commandParser';
import { CONFIG_FILE } from '../constants';
import { 
  createEnhancedErrorMessage, 
  createSuccessMessage, 
  createInfoMessage,
  detectErrorType,
  ErrorCode,
  ErrorLevel 
} from './errorHandling';

/**
 * 模式命令执行结果接口
 */
export interface ModeCommandResult {
  success: boolean;
  message: string;
  previousModel?: string;
  newModel?: string;
  availableModels?: string[];
  // 增强错误处理字段
  errorCode?: ErrorCode;
  errorLevel?: ErrorLevel;
  // 新增的状态信息字段
  configInfo?: {
    filePath: string;
    lastModified: string;
    status: 'normal' | 'missing' | 'corrupted';
  };
  modelDetails?: {
    provider: string;
    model: string;
    isValid: boolean;
  };
}

/**
 * 解析后的模型信息接口
 */
export interface ModelParsed {
  provider: string;
  model: string;
  original: string;
}

/**
 * 模型列表显示信息接口
 */
export interface ModelListInfo {
  providers: ProviderInfo[];
  totalModels: number;
  totalProviders: number;
  currentModel?: string;
}

/**
 * 提供商信息接口
 */
export interface ProviderInfo {
  name: string;
  models: ModelInfo[];
}

/**
 * 模型信息接口
 */
export interface ModelInfo {
  name: string;
  isCurrent: boolean;
  displayName: string;
}

/**
 * 模式命令主入口函数
 * 
 * @param args 命令参数数组，可以为空（显示当前模式）或包含模型字符串
 * @returns Promise<ModeCommandResult> 执行结果
 */
export async function executeModeCommand(args?: string[]): Promise<ModeCommandResult> {
  try {
    // 如果没有参数，显示当前模式
    if (!args || args.length === 0) {
      return await showCurrentMode();
    }

    // 如果有参数，尝试切换模型
    const modelString = args.join(' ').trim();
    
    // 解析模型字符串
    const parsed = parseModelString(modelString);
    if (!parsed) {
      const errorMessage = createEnhancedErrorMessage(
        ErrorCode.INVALID_MODEL_FORMAT,
        { modelString }
      );
      return {
        success: false,
        message: errorMessage,
        errorCode: ErrorCode.INVALID_MODEL_FORMAT,
        errorLevel: ErrorLevel.ERROR
      };
    }

    // 读取配置
    let config;
    try {
      config = await readConfigFile();
    } catch (error: any) {
      const errorCode = detectErrorType(error);
      const errorMessage = createEnhancedErrorMessage(
        errorCode,
        { 
          filePath: CONFIG_FILE,
          originalError: error.message 
        }
      );
      return {
        success: false,
        message: errorMessage,
        errorCode,
        errorLevel: errorCode === ErrorCode.CONFIG_FILE_MISSING ? ErrorLevel.FATAL : ErrorLevel.ERROR
      };
    }
    
    // 验证模型是否存在
    if (!validateModelExists(parsed.provider, parsed.model, config)) {
      const availableModels = getAvailableModels(config).split('\n').filter(line => line.trim());
      const errorMessage = createEnhancedErrorMessage(
        ErrorCode.MODEL_NOT_FOUND,
        {
          modelString,
          provider: parsed.provider,
          model: parsed.model,
          availableModels
        }
      );
      return {
        success: false,
        message: errorMessage,
        errorCode: ErrorCode.MODEL_NOT_FOUND,
        errorLevel: ErrorLevel.ERROR,
        availableModels
      };
    }

    // 获取当前默认模型
    const previousModel = await getCurrentDefaultModel();
    
    // 更新配置中的默认模型
    const newModel = `${parsed.provider},${parsed.model}`;
    config.Router = config.Router || {};
    config.Router.default = newModel;
    
    // 写入配置文件
    try {
      await writeConfigFile(config);
    } catch (error: any) {
      const errorMessage = createEnhancedErrorMessage(
        ErrorCode.CONFIG_WRITE_FAILED,
        {
          filePath: CONFIG_FILE,
          originalError: error.message
        }
      );
      return {
        success: false,
        message: errorMessage,
        errorCode: ErrorCode.CONFIG_WRITE_FAILED,
        errorLevel: ErrorLevel.ERROR
      };
    }
    
    // 创建成功消息
    const successMessage = createSuccessMessage(
      `模型已成功切换`,
      [
        `从: ${previousModel || '未设置'}`,
        `到: ${newModel}`,
        `提供商: ${parsed.provider}`,
        `模型: ${parsed.model}`
      ]
    );
    
    return {
      success: true,
      message: successMessage,
      previousModel: previousModel || undefined,
      newModel
    };
    
  } catch (error: any) {
    const errorCode = detectErrorType(error);
    const errorMessage = createEnhancedErrorMessage(
      errorCode,
      { originalError: error.message }
    );
    return {
      success: false,
      message: errorMessage,
      errorCode,
      errorLevel: ErrorLevel.ERROR
    };
  }
}

/**
 * 解析模型字符串 "provider,model" 格式
 * 
 * @param modelString 模型字符串，格式如 "openai,gpt-4"
 * @returns ModelParsed | null 解析结果，失败返回 null
 */
export function parseModelString(modelString: string): ModelParsed | null {
  try {
    if (!modelString || typeof modelString !== 'string') {
      return null;
    }

    const trimmed = modelString.trim();
    if (!trimmed) {
      return null;
    }

    // 检查是否包含逗号
    if (!trimmed.includes(',')) {
      return null;
    }

    // 分割字符串
    const parts = trimmed.split(',');
    if (parts.length !== 2) {
      return null;
    }

    const provider = parts[0].trim();
    const model = parts[1].trim();

    // 验证 provider 和 model 都不为空
    if (!provider || !model) {
      return null;
    }

    return {
      provider,
      model,
      original: modelString
    };
    
  } catch (error) {
    return null;
  }
}

/**
 * 从配置中获取当前默认模型
 * 
 * @returns Promise<string | null> 当前默认模型字符串，失败返回 null
 */
export async function getCurrentDefaultModel(): Promise<string | null> {
  try {
    const config = await readConfigFile();
    
    if (!config || !config.Router || !config.Router.default) {
      return null;
    }
    
    return config.Router.default;
    
  } catch (error) {
    return null;
  }
}

/**
 * 显示当前模式信息
 * 
 * @returns Promise<ModeCommandResult> 包含当前模型信息的结果
 */
export async function showCurrentMode(): Promise<ModeCommandResult> {
  try {
    // 获取配置文件统计信息
    let configInfo;
    try {
      const stats = fs.statSync(CONFIG_FILE);
      configInfo = {
        filePath: CONFIG_FILE,
        lastModified: stats.mtime.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        status: 'normal' as const
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        const errorMessage = createEnhancedErrorMessage(
          ErrorCode.CONFIG_FILE_MISSING,
          { filePath: CONFIG_FILE }
        );
        return {
          success: false,
          message: errorMessage,
          errorCode: ErrorCode.CONFIG_FILE_MISSING,
          errorLevel: ErrorLevel.FATAL,
          configInfo: {
            filePath: CONFIG_FILE,
            lastModified: '不存在',
            status: 'missing'
          }
        };
      }
      throw error;
    }
    
    // 读取配置文件
    let config;
    try {
      config = await readConfigFile();
    } catch (error: any) {
      const errorCode = detectErrorType(error);
      const errorMessage = createEnhancedErrorMessage(
        errorCode,
        { 
          filePath: CONFIG_FILE,
          originalError: error.message 
        }
      );
      return {
        success: false,
        message: errorMessage,
        errorCode,
        errorLevel: ErrorLevel.FATAL,
        configInfo: {
          ...configInfo,
          status: 'corrupted'
        }
      };
    }
    
    // 获取当前默认模型
    const currentModel = await getCurrentDefaultModel();
    
    if (!currentModel) {
      const infoMessage = createInfoMessage(
        '未配置默认模型',
        [
          `配置文件: ${configInfo.filePath}`,
          `最后修改: ${configInfo.lastModified}`,
          '请设置默认模型以开始使用'
        ],
        ['ccr mode <提供商>,<模型>', 'ccr mode --list']
      );
      return {
        success: false,
        message: infoMessage,
        errorCode: ErrorCode.VALIDATION_ERROR,
        errorLevel: ErrorLevel.WARNING,
        configInfo
      };
    }
    
    // 解析当前模型信息
    const parsed = parseModelString(currentModel);
    
    let modelDetails;
    if (parsed) {
      // 验证当前模型是否仍然有效
      const isValid = validateModelExists(parsed.provider, parsed.model, config);
      modelDetails = {
        provider: parsed.provider,
        model: parsed.model,
        isValid
      };
    }
    
    // 构建格式化输出
    const infoDetails = [];
    
    if (modelDetails) {
      infoDetails.push(`提供商: ${modelDetails.provider}`);
      infoDetails.push(`模型: ${modelDetails.model}`);
      infoDetails.push(`完整标识: ${currentModel}`);
      
      if (!modelDetails.isValid) {
        infoDetails.push('⚠️ 状态: 模型可能不存在在配置中');
      }
    } else {
      infoDetails.push(`模型: ${currentModel}`);
      infoDetails.push('⚠️ 状态: 无法解析模型格式');
    }
    
    infoDetails.push('');
    infoDetails.push(`配置文件: ${configInfo.filePath}`);
    infoDetails.push(`最后修改: ${configInfo.lastModified}`);
    
    // 显示配置状态
    const statusIcon = modelDetails?.isValid !== false ? '✅' : '⚠️';
    const statusText = modelDetails?.isValid !== false ? '正常' : '需要检查';
    infoDetails.push(`${statusIcon} 配置状态: ${statusText}`);
    
    const message = createInfoMessage('🎨 当前模型配置', infoDetails);
    
    return {
      success: true,
      message,
      newModel: currentModel,
      configInfo,
      modelDetails
    };
    
  } catch (error: any) {
    const errorCode = detectErrorType(error);
    const errorMessage = createEnhancedErrorMessage(
      errorCode,
      { originalError: error.message }
    );
    return {
      success: false,
      message: errorMessage,
      errorCode,
      errorLevel: ErrorLevel.ERROR
    };
  }
}

/**
 * 显示可用模型列表
 * 
 * @returns Promise<ModeCommandResult> 包含模型列表信息的结果
 */
export async function showAvailableModels(): Promise<ModeCommandResult> {
  try {
    // 读取配置文件
    let config;
    try {
      config = await readConfigFile();
    } catch (error: any) {
      const errorCode = detectErrorType(error);
      const errorMessage = createEnhancedErrorMessage(
        errorCode,
        {
          filePath: CONFIG_FILE,
          originalError: error.message
        }
      );
      return {
        success: false,
        message: errorMessage,
        errorCode,
        errorLevel: errorCode === ErrorCode.CONFIG_FILE_MISSING ? ErrorLevel.FATAL : ErrorLevel.ERROR
      };
    }
    
    // 获取当前默认模型
    const currentModel = await getCurrentDefaultModel();
    
    // 解析配置中的提供商和模型
    const modelListInfo = await parseModelListFromConfig(config, currentModel);
    
    // 检查是否有可用模型
    if (modelListInfo.totalModels === 0) {
      const infoMessage = createInfoMessage(
        '未找到可用模型',
        [
          `配置文件: ${CONFIG_FILE}`,
          '请检查 Providers 数组包含有效的提供商和模型信息',
          '可以使用 UI 模式管理配置'
        ],
        ['ccr ui', 'ccr start']
      );
      return {
        success: false,
        message: infoMessage,
        errorCode: ErrorCode.VALIDATION_ERROR,
        errorLevel: ErrorLevel.WARNING
      };
    }
    
    // 构建格式化输出
    const message = formatModelList(modelListInfo);
    
    return {
      success: true,
      message,
      availableModels: getAllModelStrings(modelListInfo)
    };
    
  } catch (error: any) {
    const errorCode = detectErrorType(error);
    const errorMessage = createEnhancedErrorMessage(
      errorCode,
      { originalError: error.message }
    );
    return {
      success: false,
      message: errorMessage,
      errorCode,
      errorLevel: ErrorLevel.ERROR
    };
  }
}

/**
 * 从配置中解析模型列表信息
 * 
 * @param config 配置对象
 * @param currentModel 当前默认模型
 * @returns Promise<ModelListInfo> 模型列表信息
 */
async function parseModelListFromConfig(config: any, currentModel?: string | null): Promise<ModelListInfo> {
  const providers: ProviderInfo[] = [];
  let totalModels = 0;
  
  if (!config.Providers || !Array.isArray(config.Providers)) {
    return {
      providers: [],
      totalModels: 0,
      totalProviders: 0,
      currentModel: currentModel || undefined
    };
  }
  
  for (const provider of config.Providers) {
    if (!provider.name || !provider.models || !Array.isArray(provider.models)) {
      continue;
    }
    
    const models: ModelInfo[] = [];
    
    for (const modelName of provider.models) {
      if (typeof modelName !== 'string' || !modelName.trim()) {
        continue;
      }
      
      const fullModelName = `${provider.name},${modelName}`;
      const isCurrent = currentModel === fullModelName;
      
      models.push({
        name: modelName,
        isCurrent,
        displayName: modelName
      });
      
      totalModels++;
    }
    
    if (models.length > 0) {
      providers.push({
        name: provider.name,
        models
      });
    }
  }
  
  return {
    providers,
    totalModels,
    totalProviders: providers.length,
    currentModel: currentModel || undefined
  };
}

/**
 * 格式化模型列表显示
 * 
 * @param modelListInfo 模型列表信息
 * @returns string 格式化后的显示字符串
 */
function formatModelList(modelListInfo: ModelListInfo): string {
  let output = `📊 可用模型列表 (${modelListInfo.totalProviders}个提供商, ${modelListInfo.totalModels}个模型):\n\n`;
  
  for (const provider of modelListInfo.providers) {
    output += `📁 ${provider.name}\n`;
    
    for (const model of provider.models) {
      const icon = model.isCurrent ? '✅' : '⚪';
      const suffix = model.isCurrent ? '        (当前使用)' : '';
      output += `  ${icon} ${model.displayName}${suffix}\n`;
    }
    
    output += '\n';
  }
  
  output += `使用方法: ccr mode <提供商>,<模型>\n`;
  output += `示例: ccr mode deepseek,deepseek-chat`;
  
  return output;
}

/**
 * 获取所有模型的字符串列表
 * 
 * @param modelListInfo 模型列表信息
 * @returns string[] 模型字符串数组
 */
function getAllModelStrings(modelListInfo: ModelListInfo): string[] {
  const modelStrings: string[] = [];
  
  for (const provider of modelListInfo.providers) {
    for (const model of provider.models) {
      modelStrings.push(`${provider.name},${model.name}`);
    }
  }
  
  return modelStrings;
}