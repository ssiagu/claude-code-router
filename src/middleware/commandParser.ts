import { log } from "../utils/log";

/**
 * 模型命令解析结果接口
 */
interface ModelCommand {
  provider: string;
  model: string;
}

/**
 * 解析用户消息中的/model命令
 * @param req - 请求对象
 * @param config - 配置对象
 * @returns ModelCommand对象或null
 */
export const parseModelCommand = (req: any, config: any): ModelCommand | null => {
  try {
    const { messages } = req.body;
    
    if (!Array.isArray(messages)) {
      return null;
    }

    // 查找最后一条用户消息
    const lastUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop();
    
    if (!lastUserMessage?.content) {
      return null;
    }

    // 检查消息内容是否为字符串类型
    let messageContent: string;
    if (typeof lastUserMessage.content === 'string') {
      messageContent = lastUserMessage.content.trim();
    } else if (Array.isArray(lastUserMessage.content)) {
      // 如果是数组，提取第一个text类型的内容
      const textContent = lastUserMessage.content.find((c: any) => c.type === 'text');
      if (!textContent?.text) {
        return null;
      }
      messageContent = textContent.text.trim();
    } else {
      return null;
    }

    // 检查是否包含/model命令
    if (!messageContent.startsWith('/model ')) {
      return null;
    }

    // 使用正则表达式解析命令格式：/model provider,model
    const commandRegex = /^\/model\s+([^,\s]+)\s*,\s*(.+)$/;
    const match = messageContent.match(commandRegex);
    
    if (!match) {
      log('Invalid /model command format:', messageContent);
      throw new Error('命令格式错误。正确格式：/model provider,model_name');
    }

    const [, provider, model] = match;
    const result = {
      provider: provider.trim(),
      model: model.trim()
    };

    log('Parsed /model command:', result);
    return result;

  } catch (error: any) {
    log('Error parsing /model command:', error.message);
    throw error;
  }
};

/**
 * 验证指定的模型是否在配置中存在
 * @param provider - 提供商名称
 * @param model - 模型名称
 * @param config - 配置对象
 * @returns 布尔值表示模型是否存在
 */
export const validateModelExists = (provider: string, model: string, config: any): boolean => {
  try {
    if (!config?.Providers || !Array.isArray(config.Providers)) {
      return false;
    }

    // 查找提供商配置（不区分大小写）
    const providerConfig = config.Providers.find(
      (p: any) => p.name && p.name.toLowerCase() === provider.toLowerCase()
    );

    if (!providerConfig) {
      log('Provider not found:', provider);
      return false;
    }

    // 检查模型是否存在于提供商的模型列表中（不区分大小写）
    if (!Array.isArray(providerConfig.models)) {
      log('No models configured for provider:', provider);
      return false;
    }

    const modelExists = providerConfig.models.some(
      (m: any) => typeof m === 'string' && m.toLowerCase() === model.toLowerCase()
    );

    if (!modelExists) {
      log('Model not found in provider:', { provider, model, availableModels: providerConfig.models });
    }

    return modelExists;

  } catch (error: any) {
    log('Error validating model:', error.message);
    return false;
  }
};

/**
 * 获取所有可用的模型列表（用于错误提示）
 * @param config - 配置对象
 * @returns 格式化的模型列表字符串
 */
export const getAvailableModels = (config: any): string => {
  try {
    if (!config?.Providers || !Array.isArray(config.Providers)) {
      return '无可用模型';
    }

    const modelList = config.Providers
      .filter((p: any) => p.name && Array.isArray(p.models))
      .map((p: any) => {
        const models = p.models
          .filter((m: any) => typeof m === 'string')
          .map((m: any) => `  - ${p.name},${m}`)
          .join('\n');
        return `${p.name}:\n${models}`;
      })
      .join('\n\n');

    return modelList || '无可用模型';

  } catch (error: any) {
    log('Error getting available models:', error.message);
    return '获取模型列表失败';
  }
};

/**
 * 从消息数组中移除/model命令消息
 * @param messages - 消息数组
 * @returns 处理后的消息数组
 */
export const removeModelCommandMessage = (messages: any[]): any[] => {
  try {
    return messages.filter((message: any) => {
      if (message.role !== 'user' || !message.content) {
        return true;
      }

      let messageContent: string;
      if (typeof message.content === 'string') {
        messageContent = message.content.trim();
      } else if (Array.isArray(message.content)) {
        const textContent = message.content.find((c: any) => c.type === 'text');
        if (!textContent?.text) {
          return true;
        }
        messageContent = textContent.text.trim();
      } else {
        return true;
      }

      // 如果消息以/model开头，则过滤掉
      return !messageContent.startsWith('/model ');
    });

  } catch (error: any) {
    log('Error removing model command message:', error.message);
    // 如果发生错误，返回原始消息数组
    return messages;
  }
};

/**
 * 将/model命令替换为成功消息
 * @param messages - 消息数组
 * @param provider - 提供商名称
 * @param model - 模型名称
 * @returns 更新后的消息数组
 */
export const replaceModelCommandWithSuccess = (messages: any[], provider: string, model: string): any[] => {
  if (!Array.isArray(messages)) {
    return messages;
  }

  try {
    // 找到包含/model命令的最后一条用户消息
    const updatedMessages = [...messages];
    
    for (let i = updatedMessages.length - 1; i >= 0; i--) {
      const message = updatedMessages[i];
      
      if (message.role !== 'user' || !message.content) {
        continue;
      }

      let messageContent: string;
      if (typeof message.content === 'string') {
        messageContent = message.content.trim();
      } else if (Array.isArray(message.content)) {
        const textContent = message.content.find((c: any) => c.type === 'text');
        if (!textContent?.text) {
          continue;
        }
        messageContent = textContent.text.trim();
      } else {
        continue;
      }

      // 检查是否包含/model命令
      if (messageContent.startsWith('/model ')) {
        // 替换为成功消息
        const successMessage = `✅ 已成功切换到模型: ${provider}/${model}`;
        
        if (typeof message.content === 'string') {
          // 如果原始消息只有/model命令，直接替换
          if (messageContent.trim() === messageContent.match(/^\/model\s+[^,\s]+\s*,\s*.+$/)?.[0]) {
            updatedMessages[i] = {
              ...message,
              content: successMessage
            };
          } else {
            // 如果还有其他内容，只替换/model部分
            updatedMessages[i] = {
              ...message,
              content: messageContent.replace(/\/model\s+[^,\s]+\s*,\s*.+/, successMessage)
            };
          }
        } else if (Array.isArray(message.content)) {
          // 处理数组格式的content
          const newContent = message.content.map((c: any) => {
            if (c.type === 'text' && c.text.trim().startsWith('/model ')) {
              return {
                ...c,
                text: c.text.replace(/\/model\s+[^,\s]+\s*,\s*.+/, successMessage)
              };
            }
            return c;
          });
          
          updatedMessages[i] = {
            ...message,
            content: newContent
          };
        }
        
        break; // 只处理最后一个/model命令
      }
    }

    return updatedMessages;

  } catch (error: any) {
    log('Error replacing model command with success:', error.message);
    // 如果发生错误，返回原始消息数组
    return messages;
  }
};

/**
 * 生成错误响应
 * @param error - 错误信息
 * @param config - 配置对象
 * @returns 错误响应对象
 */
export const generateErrorResponse = (error: string, config: any) => {
  const availableModels = getAvailableModels(config);
  const errorText = `❌ 模型切换失败: ${error}\n\n可用的模型:\n${availableModels}\n\n使用格式: /model provider,model_name\n示例: /model openrouter,anthropic/claude-3.5-sonnet`;
  
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: "message",
    role: "assistant",
    content: [
      {
        type: "text",
        text: errorText
      }
    ],
    model: "error",
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: {
      input_tokens: 0,
      output_tokens: Math.ceil(errorText.length / 4) // 粗略估算token数量
    }
  };
};