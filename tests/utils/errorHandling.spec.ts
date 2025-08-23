/**
 * Enhanced Error Handling Tests
 * 
 * 测试增强错误处理系统的各种场景
 */

import { 
  createEnhancedErrorMessage,
  createSuccessMessage,
  createInfoMessage,
  detectErrorType,
  ErrorCode,
  ErrorLevel,
  Icons
} from '../../src/utils/errorHandling';

describe('Enhanced Error Handling', () => {
  
  describe('createEnhancedErrorMessage', () => {
    
    it('should create detailed error message for invalid model format', () => {
      const result = createEnhancedErrorMessage(
        ErrorCode.INVALID_MODEL_FORMAT,
        { modelString: 'invalid-format' }
      );
      
      expect(result).toContain('❌ 错误: 模型格式错误');
      expect(result).toContain('模型字符串格式不正确');
      expect(result).toContain('invalid-format');
      expect(result).toContain('💡 解决方法:');
      expect(result).toContain('📝 示例命令:');
      expect(result).toContain('ccr mode deepseek,deepseek-chat');
      expect(result).toContain('⚡ 获取帮助:');
    });
    
    it('should create detailed error message for model not found', () => {
      const result = createEnhancedErrorMessage(
        ErrorCode.MODEL_NOT_FOUND,
        {
          modelString: 'invalid,model',
          provider: 'invalid',
          model: 'model',
          availableModels: ['deepseek,deepseek-chat', 'openrouter,gpt-4']
        }
      );
      
      expect(result).toContain('❌ 错误: 模型不存在');
      expect(result).toContain('指定的模型在配置中不存在');
      expect(result).toContain('invalid,model');
      expect(result).toContain('提供商 \'invalid\' 未在配置中找到');
      expect(result).toContain('deepseek,deepseek-chat');
      expect(result).toContain('ccr mode --list');
    });
    
    it('should create detailed error message for config file missing', () => {
      const result = createEnhancedErrorMessage(
        ErrorCode.CONFIG_FILE_MISSING,
        { filePath: '/path/to/config.json' }
      );
      
      expect(result).toContain('❌ 致命错误: 配置文件不存在');
      expect(result).toContain('应用程序配置文件未找到');
      expect(result).toContain('/path/to/config.json');
      expect(result).toContain('ccr start');
      expect(result).toContain('运行初始化命令创建配置文件');
    });
    
    it('should create detailed error message for config file corrupted', () => {
      const result = createEnhancedErrorMessage(
        ErrorCode.CONFIG_FILE_CORRUPTED,
        { 
          filePath: '/path/to/config.json',
          originalError: 'Unexpected token'
        }
      );
      
      expect(result).toContain('❌ 致命错误: 配置文件损坏');
      expect(result).toContain('配置文件存在但无法正确解析');
      expect(result).toContain('Unexpected token');
      expect(result).toContain('检查配置文件的 JSON 语法');
      expect(result).toContain('ccr ui');
    });
    
    it('should create detailed error message for provider not found', () => {
      const result = createEnhancedErrorMessage(
        ErrorCode.PROVIDER_NOT_FOUND,
        {
          modelString: 'nonexistent,model',
          provider: 'nonexistent'
        }
      );
      
      expect(result).toContain('❌ 错误: 提供商不存在');
      expect(result).toContain('指定的模型提供商在配置中不存在');
      expect(result).toContain('nonexistent,model');
      expect(result).toContain('检查提供商名称拼写');
      expect(result).toContain('ccr mode --list');
    });
    
    it('should create detailed error message for permission denied', () => {
      const result = createEnhancedErrorMessage(
        ErrorCode.PERMISSION_DENIED,
        { originalError: 'Access denied' }
      );
      
      expect(result).toContain('❌ 错误: 权限不足');
      expect(result).toContain('操作被拒绝，通常是文件或目录权限问题');
      expect(result).toContain('Access denied');
      expect(result).toContain('检查文件和目录权限');
      expect(result).toContain('chmod 755');
    });
    
    it('should create detailed error message for network error', () => {
      const result = createEnhancedErrorMessage(
        ErrorCode.NETWORK_ERROR,
        { originalError: 'Connection timeout' }
      );
      
      expect(result).toContain('⚠️ 警告: 网络连接错误');
      expect(result).toContain('无法连接到远程服务');
      expect(result).toContain('Connection timeout');
      expect(result).toContain('检查网络连接状态');
      expect(result).toContain('ping google.com');
    });
    
    it('should handle unknown error codes gracefully', () => {
      const result = createEnhancedErrorMessage(
        'UNKNOWN_CODE' as ErrorCode,
        { originalError: 'Some error' }
      );
      
      expect(result).toContain('❌ 错误: UNKNOWN_CODE');
      expect(result).toContain('Some error');
      expect(result).toContain('检查命令参数是否正确');
      expect(result).toContain('ccr --help');
    });
    
    it('should truncate long model lists appropriately', () => {
      const manyModels = Array.from({ length: 10 }, (_, i) => `provider${i},model${i}`);
      const result = createEnhancedErrorMessage(
        ErrorCode.MODEL_NOT_FOUND,
        {
          modelString: 'invalid,model',
          availableModels: manyModels
        }
      );
      
      expect(result).toContain('provider0,model0');
      expect(result).toContain('provider4,model4');
      expect(result).toContain('以及其他 5 个模型');
      expect(result).toContain('ccr mode --list');
    });
  });
  
  describe('createSuccessMessage', () => {
    
    it('should create formatted success message', () => {
      const result = createSuccessMessage(
        '模型已成功切换',
        ['从: openai,gpt-4', '到: deepseek,deepseek-chat']
      );
      
      expect(result).toContain('✅ 模型已成功切换');
      expect(result).toContain('ℹ️ 详细信息:');
      expect(result).toContain('• 从: openai,gpt-4');
      expect(result).toContain('• 到: deepseek,deepseek-chat');
    });
    
    it('should create success message without details', () => {
      const result = createSuccessMessage('操作成功');
      
      expect(result).toContain('✅ 操作成功');
      expect(result).not.toContain('详细信息');
    });
  });
  
  describe('createInfoMessage', () => {
    
    it('should create formatted info message', () => {
      const result = createInfoMessage(
        '当前模型配置',
        ['提供商: deepseek', '模型: deepseek-chat'],
        ['ccr mode --help', 'ccr status']
      );
      
      expect(result).toContain('ℹ️ 当前模型配置');
      expect(result).toContain('• 提供商: deepseek');
      expect(result).toContain('• 模型: deepseek-chat');
      expect(result).toContain('⚡ 相关命令: ccr mode --help | ccr status');
    });
    
    it('should create info message without help commands', () => {
      const result = createInfoMessage(
        '配置信息',
        ['文件路径: /path/to/config']
      );
      
      expect(result).toContain('ℹ️ 配置信息');
      expect(result).toContain('• 文件路径: /path/to/config');
      expect(result).not.toContain('相关命令');
    });
  });
  
  describe('detectErrorType', () => {
    
    it('should detect file not found error', () => {
      const error = { code: 'ENOENT', message: 'no such file or directory' };
      const result = detectErrorType(error);
      
      expect(result).toBe(ErrorCode.CONFIG_FILE_MISSING);
    });
    
    it('should detect permission error', () => {
      const error = { code: 'EACCES', message: 'permission denied' };
      const result = detectErrorType(error);
      
      expect(result).toBe(ErrorCode.PERMISSION_DENIED);
    });
    
    it('should detect network error', () => {
      const error = { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' };
      const result = detectErrorType(error);
      
      expect(result).toBe(ErrorCode.NETWORK_ERROR);
    });
    
    it('should detect JSON parse error', () => {
      const error = { message: 'Unexpected token in JSON at position 0' };
      const result = detectErrorType(error);
      
      expect(result).toBe(ErrorCode.CONFIG_FILE_CORRUPTED);
    });
    
    it('should detect model not found from context', () => {
      const error = { message: 'Some error' };
      const context = { modelNotFound: true };
      const result = detectErrorType(error, context);
      
      expect(result).toBe(ErrorCode.MODEL_NOT_FOUND);
    });
    
    it('should detect provider not found from context', () => {
      const error = { message: 'Some error' };
      const context = { providerNotFound: true };
      const result = detectErrorType(error, context);
      
      expect(result).toBe(ErrorCode.PROVIDER_NOT_FOUND);
    });
    
    it('should detect invalid format from context', () => {
      const error = { message: 'Some error' };
      const context = { invalidFormat: true };
      const result = detectErrorType(error, context);
      
      expect(result).toBe(ErrorCode.INVALID_MODEL_FORMAT);
    });
    
    it('should return unknown error for unrecognized patterns', () => {
      const error = { message: 'Some random error' };
      const result = detectErrorType(error);
      
      expect(result).toBe(ErrorCode.UNKNOWN_ERROR);
    });
    
    it('should handle null/undefined errors', () => {
      expect(detectErrorType(null)).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(detectErrorType(undefined)).toBe(ErrorCode.UNKNOWN_ERROR);
    });
  });
  
  describe('Visual Enhancement', () => {
    
    it('should use appropriate icons for different error levels', () => {
      const errorResult = createEnhancedErrorMessage(ErrorCode.MODEL_NOT_FOUND);
      const warningResult = createEnhancedErrorMessage(ErrorCode.NETWORK_ERROR);
      const fatalResult = createEnhancedErrorMessage(ErrorCode.CONFIG_FILE_MISSING);
      
      expect(errorResult).toContain(Icons.ERROR);
      expect(warningResult).toContain(Icons.WARNING);
      expect(fatalResult).toContain(Icons.ERROR); // Fatal also uses error icon
      
      expect(errorResult).toContain(Icons.TIP);
      expect(errorResult).toContain(Icons.EXAMPLE);
      expect(errorResult).toContain(Icons.COMMAND);
    });
    
    it('should include all visual enhancement icons in context', () => {
      const result = createEnhancedErrorMessage(
        ErrorCode.MODEL_NOT_FOUND,
        {
          modelString: 'invalid,model',
          provider: 'invalid',
          filePath: '/path/to/config'
        }
      );
      
      expect(result).toContain(Icons.ERROR);
      expect(result).toContain(Icons.INFO);
      expect(result).toContain(Icons.TIP);
      expect(result).toContain(Icons.EXAMPLE);
      expect(result).toContain(Icons.COMMAND);
    });
  });
  
  describe('User Friendliness', () => {
    
    it('should provide actionable suggestions', () => {
      const result = createEnhancedErrorMessage(ErrorCode.MODEL_NOT_FOUND);
      
      expect(result).toMatch(/\d+\./); // Should contain numbered suggestions
      expect(result).toContain('查看可用模型列表');
      expect(result).toContain('检查模型名称拼写');
    });
    
    it('should include executable examples', () => {
      const result = createEnhancedErrorMessage(ErrorCode.INVALID_MODEL_FORMAT);
      
      expect(result).toContain('ccr mode deepseek,deepseek-chat');
      expect(result).toContain('ccr mode openrouter,gpt-4');
    });
    
    it('should provide help command guidance', () => {
      const result = createEnhancedErrorMessage(ErrorCode.MODEL_NOT_FOUND);
      
      expect(result).toContain('ccr mode --list');
      expect(result).toContain('ccr mode --help');
    });
    
    it('should have reasonable message length', () => {
      const result = createEnhancedErrorMessage(ErrorCode.MODEL_NOT_FOUND);
      
      // Message should be informative but not overwhelmingly long
      expect(result.length).toBeGreaterThan(100);
      expect(result.length).toBeLessThan(2000);
    });
    
    it('should use clear Chinese language', () => {
      const result = createEnhancedErrorMessage(ErrorCode.CONFIG_FILE_MISSING);
      
      expect(result).toContain('配置文件不存在');
      expect(result).toContain('解决方法');
      expect(result).toContain('示例命令');
      expect(result).toContain('获取帮助');
      
      // Should not contain English error messages in user-facing content
      expect(result).not.toMatch(/error|Error|ERROR/);
      expect(result).not.toMatch(/file not found|permission denied/);
    });
  });
  
  describe('Integration with Context', () => {
    
    it('should handle complex error context appropriately', () => {
      const result = createEnhancedErrorMessage(
        ErrorCode.MODEL_NOT_FOUND,
        {
          modelString: 'wrongprovider,wrongmodel',
          provider: 'wrongprovider',
          model: 'wrongmodel',
          availableModels: ['deepseek,deepseek-chat', 'openrouter,gpt-4', 'anthropic,claude-3']
        }
      );
      
      expect(result).toContain('wrongprovider,wrongmodel');
      expect(result).toContain('提供商 \'wrongprovider\' 未在配置中找到');
      expect(result).toContain('模型 \'wrongmodel\' 不存在');
      expect(result).toContain('deepseek,deepseek-chat');
      expect(result).toContain('openrouter,gpt-4');
      expect(result).toContain('anthropic,claude-3');
    });
    
    it('should handle missing context gracefully', () => {
      const result = createEnhancedErrorMessage(ErrorCode.MODEL_NOT_FOUND);
      
      expect(result).toContain('❌ 错误: 模型不存在');
      expect(result).toContain('💡 解决方法:');
      expect(result).not.toContain('undefined');
      expect(result).not.toContain('null');
    });
  });
});