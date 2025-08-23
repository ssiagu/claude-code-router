/**
 * modeCommand 模块单元测试
 * 
 * 完整测试套件，覆盖所有核心函数和边界条件
 */

import fs from 'node:fs';
import { 
  parseModelString, 
  executeModeCommand,
  getCurrentDefaultModel,
  showCurrentMode,
  showAvailableModels,
  ModeCommandResult,
  ModelParsed
} from '../../src/utils/modeCommand';
import { readConfigFile, writeConfigFile } from '../../src/utils/index';
import { validateModelExists, getAvailableModels } from '../../src/middleware/commandParser';
import { 
  validConfig, 
  invalidConfig, 
  emptyConfig, 
  configWithoutDefault,
  createMockStats,
  createFileNotFoundError,
  createPermissionError,
  createJsonParseError,
  expectModeCommandResult,
  expectSuccessResult,
  expectFailureResult
} from '../helpers/testUtils';

// Mock 外部依赖
jest.mock('node:fs');
jest.mock('../../src/utils/index');
jest.mock('../../src/middleware/commandParser');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockReadConfigFile = readConfigFile as jest.MockedFunction<typeof readConfigFile>;
const mockWriteConfigFile = writeConfigFile as jest.MockedFunction<typeof writeConfigFile>;
const mockValidateModelExists = validateModelExists as jest.MockedFunction<typeof validateModelExists>;
const mockGetAvailableModels = getAvailableModels as jest.MockedFunction<typeof getAvailableModels>;

describe('modeCommand Module', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('parseModelString', () => {
    
    describe('Valid Format Parsing', () => {
      
      it('should parse basic provider,model format', () => {
        const result = parseModelString('deepseek,deepseek-chat');
        
        expect(result).toEqual({
          provider: 'deepseek',
          model: 'deepseek-chat',
          original: 'deepseek,deepseek-chat'
        });
      });

      it('should parse format with hyphens and underscores', () => {
        const result = parseModelString('open-router,gpt-4_turbo');
        
        expect(result).toEqual({
          provider: 'open-router',
          model: 'gpt-4_turbo',
          original: 'open-router,gpt-4_turbo'
        });
      });

      it('should handle whitespace around input', () => {
        const result = parseModelString('  deepseek,deepseek-chat  ');
        
        expect(result).toEqual({
          provider: 'deepseek',
          model: 'deepseek-chat',
          original: '  deepseek,deepseek-chat  '
        });
      });

      it('should handle whitespace around comma', () => {
        const result = parseModelString('deepseek , deepseek-chat');
        
        expect(result).toEqual({
          provider: 'deepseek',
          model: 'deepseek-chat',
          original: 'deepseek , deepseek-chat'
        });
      });

      it('should parse complex model names', () => {
        const result = parseModelString('anthropic,claude-3-opus-20240229');
        
        expect(result).toEqual({
          provider: 'anthropic',
          model: 'claude-3-opus-20240229',
          original: 'anthropic,claude-3-opus-20240229'
        });
      });
    });

    describe('Invalid Format Handling', () => {
      
      it('should return null for empty string', () => {
        expect(parseModelString('')).toBeNull();
      });

      it('should return null for whitespace-only string', () => {
        expect(parseModelString('   ')).toBeNull();
      });

      it('should return null for null input', () => {
        expect(parseModelString(null as any)).toBeNull();
      });

      it('should return null for undefined input', () => {
        expect(parseModelString(undefined as any)).toBeNull();
      });

      it('should return null for string without comma', () => {
        expect(parseModelString('deepseek-chat')).toBeNull();
      });

      it('should return null for string with only comma', () => {
        expect(parseModelString(',')).toBeNull();
      });

      it('should return null for empty provider', () => {
        expect(parseModelString(',deepseek-chat')).toBeNull();
      });

      it('should return null for empty model', () => {
        expect(parseModelString('deepseek,')).toBeNull();
      });

      it('should return null for multiple commas', () => {
        expect(parseModelString('deepseek,deepseek,chat')).toBeNull();
      });

      it('should return null for non-string input', () => {
        expect(parseModelString(123 as any)).toBeNull();
        expect(parseModelString({} as any)).toBeNull();
        expect(parseModelString([] as any)).toBeNull();
      });
    });

    describe('Edge Cases', () => {
      
      it('should handle single character parts', () => {
        const result = parseModelString('a,b');
        
        expect(result).toEqual({
          provider: 'a',
          model: 'b',
          original: 'a,b'
        });
      });

      it('should handle very long strings', () => {
        const longProvider = 'a'.repeat(100);
        const longModel = 'b'.repeat(100);
        const input = `${longProvider},${longModel}`;
        
        const result = parseModelString(input);
        
        expect(result).toEqual({
          provider: longProvider,
          model: longModel,
          original: input
        });
      });

      it('should handle special characters in names', () => {
        const result = parseModelString('provider-1_test,model@2024.v1');
        
        expect(result).toEqual({
          provider: 'provider-1_test',
          model: 'model@2024.v1',
          original: 'provider-1_test,model@2024.v1'
        });
      });
      
      it('should handle exceptions gracefully', () => {
        // Mock String.prototype.split to throw an error
        const originalSplit = String.prototype.split;
        String.prototype.split = jest.fn().mockImplementation(() => {
          throw new Error('Split error');
        });
        
        const result = parseModelString('test,model');
        expect(result).toBeNull();
        
        // 恢复原始方法
        String.prototype.split = originalSplit;
      });
    });
  });

  describe('getCurrentDefaultModel', () => {
    
    it('should return default model from valid config', async () => {
      mockReadConfigFile.mockResolvedValue(validConfig);
      
      const result = await getCurrentDefaultModel();
      
      expect(result).toBe('deepseek,deepseek-chat');
      expect(mockReadConfigFile).toHaveBeenCalledTimes(1);
    });

    it('should return null when config has no Router', async () => {
      const configNoRouter = { Providers: [] };
      mockReadConfigFile.mockResolvedValue(configNoRouter);
      
      const result = await getCurrentDefaultModel();
      
      expect(result).toBeNull();
    });

    it('should return null when Router has no default', async () => {
      mockReadConfigFile.mockResolvedValue(configWithoutDefault);
      
      const result = await getCurrentDefaultModel();
      
      expect(result).toBeNull();
    });

    it('should return null when config file read fails', async () => {
      mockReadConfigFile.mockRejectedValue(createFileNotFoundError());
      
      const result = await getCurrentDefaultModel();
      
      expect(result).toBeNull();
    });

    it('should return null when config is corrupted', async () => {
      mockReadConfigFile.mockRejectedValue(createJsonParseError());
      
      const result = await getCurrentDefaultModel();
      
      expect(result).toBeNull();
    });
  });

  describe('showCurrentMode', () => {
    
    describe('Success Cases', () => {
      
      it('should show current mode with valid config', async () => {
        mockFs.statSync.mockReturnValue(createMockStats());
        mockReadConfigFile.mockResolvedValue(validConfig);
        mockValidateModelExists.mockReturnValue(true);
        
        const result = await showCurrentMode();
        
        expectSuccessResult(result);
        expect(result.message).toContain('🎨 当前模型配置');
        expect(result.message).toContain('deepseek');
        expect(result.message).toContain('deepseek-chat');
        expect(result.newModel).toBe('deepseek,deepseek-chat');
        expect(result.configInfo).toBeDefined();
        expect(result.modelDetails).toBeDefined();
        expect(result.modelDetails?.isValid).toBe(true);
      });

      it('should show warning when model is invalid', async () => {
        mockFs.statSync.mockReturnValue(createMockStats());
        mockReadConfigFile.mockResolvedValue(validConfig);
        mockValidateModelExists.mockReturnValue(false);
        
        const result = await showCurrentMode();
        
        expectSuccessResult(result);
        expect(result.message).toContain('⚠️ 配置状态: 需要检查');
        expect(result.modelDetails?.isValid).toBe(false);
      });
      
      it('should handle unparseable model format', async () => {
        mockFs.statSync.mockReturnValue(createMockStats());
        const configWithBadFormat = {
          ...validConfig,
          Router: {
            default: 'invalid-format-without-comma'
          }
        };
        mockReadConfigFile.mockResolvedValue(configWithBadFormat);
        
        const result = await showCurrentMode();
        
        expectSuccessResult(result);
        expect(result.message).toContain('⚠️ 状态: 无法解析模型格式');
        expect(result.modelDetails).toBeUndefined();
        expect(result.newModel).toBe('invalid-format-without-comma');
      });
    });

    describe('Error Cases', () => {
      
      it('should handle missing config file', async () => {
        mockFs.statSync.mockImplementation(() => {
          throw createFileNotFoundError();
        });
        
        const result = await showCurrentMode();
        
        expectFailureResult(result);
        expect(result.message).toContain('❌ 致命错误: 配置文件不存在');
        expect(result.errorCode).toBe('CONFIG_FILE_MISSING');
        expect(result.configInfo?.status).toBe('missing');
      });

      it('should handle corrupted config file', async () => {
        mockFs.statSync.mockReturnValue(createMockStats());
        mockReadConfigFile.mockRejectedValue(createJsonParseError());
        
        const result = await showCurrentMode();
        
        expectFailureResult(result);
        expect(result.message).toContain('❌ 致命错误: 配置文件损坏');
        expect(result.errorCode).toBe('CONFIG_FILE_CORRUPTED');
        expect(result.configInfo?.status).toBe('corrupted');
      });

      it('should handle missing default model', async () => {
        mockFs.statSync.mockReturnValue(createMockStats());
        mockReadConfigFile.mockResolvedValue(configWithoutDefault);
        
        const result = await showCurrentMode();
        
        expectFailureResult(result);
        expect(result.message).toContain('ℹ️ 未配置默认模型');
        expect(result.errorCode).toBe('VALIDATION_ERROR');
      });

      it('should handle permission errors', async () => {
        mockFs.statSync.mockImplementation(() => {
          throw createPermissionError();
        });
        
        const result = await showCurrentMode();
        
        expectFailureResult(result);
        expect(result.errorCode).toBe('PERMISSION_DENIED');
      });
    });
  });

  describe('showAvailableModels', () => {
    
    describe('Success Cases', () => {
      
      it('should list available models', async () => {
        mockReadConfigFile.mockResolvedValue(validConfig);
        
        const result = await showAvailableModels();
        
        expectSuccessResult(result);
        expect(result.message).toContain('📊 可用模型列表');
        expect(result.message).toContain('deepseek');
        expect(result.message).toContain('openrouter');
        expect(result.message).toContain('anthropic');
        expect(result.availableModels).toBeDefined();
        expect(result.availableModels?.length).toBeGreaterThan(0);
      });

      it('should mark current model in list', async () => {
        mockReadConfigFile.mockResolvedValue(validConfig);
        
        const result = await showAvailableModels();
        
        expectSuccessResult(result);
        expect(result.message).toContain('✅');
        expect(result.message).toContain('(当前使用)');
      });
    });

    describe('Error Cases', () => {
      
      it('should handle missing config file', async () => {
        mockReadConfigFile.mockRejectedValue(createFileNotFoundError());
        
        const result = await showAvailableModels();
        
        expectFailureResult(result);
        expect(result.message).toContain('❌ 致命错误: 配置文件不存在');
        expect(result.errorCode).toBe('CONFIG_FILE_MISSING');
      });

      it('should handle empty providers', async () => {
        mockReadConfigFile.mockResolvedValue(emptyConfig);
        
        const result = await showAvailableModels();
        
        expectFailureResult(result);
        expect(result.message).toContain('ℹ️ 未找到可用模型');
        expect(result.errorCode).toBe('VALIDATION_ERROR');
      });

      it('should handle corrupted config', async () => {
        mockReadConfigFile.mockRejectedValue(createJsonParseError());
        
        const result = await showAvailableModels();
        
        expectFailureResult(result);
        expect(result.message).toContain('❌ 致命错误: 配置文件损坏');
        expect(result.errorCode).toBe('CONFIG_FILE_CORRUPTED');
      });
      
      it('should handle config with null providers', async () => {
        const configWithNullProviders = {
          Providers: null
        };
        mockReadConfigFile.mockResolvedValue(configWithNullProviders);
        
        const result = await showAvailableModels();
        
        expectFailureResult(result);
        expect(result.message).toContain('ℹ️ 未找到可用模型');
        expect(result.errorCode).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('executeModeCommand', () => {
    
    describe('No Arguments (Show Current Mode)', () => {
      
      it('should call showCurrentMode when no arguments', async () => {
        mockFs.statSync.mockReturnValue(createMockStats());
        mockReadConfigFile.mockResolvedValue(validConfig);
        mockValidateModelExists.mockReturnValue(true);
        
        const result = await executeModeCommand();
        
        expectSuccessResult(result);
        expect(result.message).toContain('🎨 当前模型配置');
      });

      it('should call showCurrentMode when empty array', async () => {
        mockFs.statSync.mockReturnValue(createMockStats());
        mockReadConfigFile.mockResolvedValue(validConfig);
        mockValidateModelExists.mockReturnValue(true);
        
        const result = await executeModeCommand([]);
        
        expectSuccessResult(result);
        expect(result.message).toContain('🎨 当前模型配置');
      });
    });

    describe('Valid Model Switching', () => {
      
      it('should switch to valid model', async () => {
        mockReadConfigFile.mockResolvedValue(validConfig);
        mockValidateModelExists.mockReturnValue(true);
        mockWriteConfigFile.mockResolvedValue(undefined);
        
        const result = await executeModeCommand(['deepseek,deepseek-coder']);
        
        expectSuccessResult(result);
        expect(result.message).toContain('✅ 模型已成功切换');
        expect(result.message).toContain('deepseek,deepseek-coder');
        expect(result.previousModel).toBe('deepseek,deepseek-chat');
        expect(result.newModel).toBe('deepseek,deepseek-coder');
        expect(mockWriteConfigFile).toHaveBeenCalledWith(
          expect.objectContaining({
            Router: expect.objectContaining({
              default: 'deepseek,deepseek-coder'
            })
          })
        );
      });

      it('should handle switching from undefined previous model', async () => {
        const configNoPrevious = {
          ...validConfig,
          Router: {}
        };
        mockReadConfigFile.mockResolvedValue(configNoPrevious);
        mockValidateModelExists.mockReturnValue(true);
        mockWriteConfigFile.mockResolvedValue(undefined);
        
        const result = await executeModeCommand(['deepseek,deepseek-chat']);
        
        expectSuccessResult(result);
        expect(result.message).toContain('从: 未设置');
        expect(result.previousModel).toBeUndefined();
      });

      it('should join multiple arguments', async () => {
        mockReadConfigFile.mockResolvedValue(validConfig);
        mockValidateModelExists.mockReturnValue(true);
        mockWriteConfigFile.mockResolvedValue(undefined);
        
        const result = await executeModeCommand(['deepseek', ',', 'deepseek-chat']);
        
        expectSuccessResult(result);
        expect(result.newModel).toBe('deepseek,deepseek-chat');
      });
    });

    describe('Invalid Model Handling', () => {
      
      it('should reject invalid model format', async () => {
        const result = await executeModeCommand(['invalid-format']);
        
        expectFailureResult(result);
        expect(result.message).toContain('❌ 错误: 模型格式错误');
        expect(result.message).toContain('invalid-format');
        expect(result.errorCode).toBe('INVALID_MODEL_FORMAT');
        expect(mockReadConfigFile).not.toHaveBeenCalled();
      });

      it('should reject non-existent model', async () => {
        mockReadConfigFile.mockResolvedValue(validConfig);
        mockValidateModelExists.mockReturnValue(false);
        mockGetAvailableModels.mockReturnValue('deepseek,deepseek-chat\\nopenrouter,gpt-4');
        
        const result = await executeModeCommand(['nonexistent,model']);
        
        expectFailureResult(result);
        expect(result.message).toContain('❌ 错误: 模型不存在');
        expect(result.message).toContain('nonexistent,model');
        expect(result.errorCode).toBe('MODEL_NOT_FOUND');
        expect(result.availableModels).toBeDefined();
        expect(mockWriteConfigFile).not.toHaveBeenCalled();
      });
    });

    describe('Configuration Errors', () => {
      
      it('should handle config file read error', async () => {
        mockReadConfigFile.mockRejectedValue(createFileNotFoundError());
        
        const result = await executeModeCommand(['deepseek,deepseek-chat']);
        
        expectFailureResult(result);
        expect(result.message).toContain('❌ 致命错误: 配置文件不存在');
        expect(result.errorCode).toBe('CONFIG_FILE_MISSING');
      });

      it('should handle config file write error', async () => {
        mockReadConfigFile.mockResolvedValue(validConfig);
        mockValidateModelExists.mockReturnValue(true);
        mockWriteConfigFile.mockRejectedValue(createPermissionError());
        
        const result = await executeModeCommand(['deepseek,deepseek-chat']);
        
        expectFailureResult(result);
        expect(result.message).toContain('❌ 错误: 配置保存失败');
        expect(result.errorCode).toBe('CONFIG_WRITE_FAILED');
      });

      it('should handle corrupted config file', async () => {
        mockReadConfigFile.mockRejectedValue(createJsonParseError());
        
        const result = await executeModeCommand(['deepseek,deepseek-chat']);
        
        expectFailureResult(result);
        expect(result.message).toContain('❌ 致命错误: 配置文件损坏');
        expect(result.errorCode).toBe('CONFIG_FILE_CORRUPTED');
      });
    });

    describe('Unexpected Errors', () => {
      
      it('should handle unexpected errors gracefully', async () => {
        const unexpectedError = new Error('Unexpected error occurred');
        mockReadConfigFile.mockRejectedValue(unexpectedError);
        
        const result = await executeModeCommand(['deepseek,deepseek-chat']);
        
        expectFailureResult(result);
        expect(result.errorCode).toBe('UNKNOWN_ERROR');
        expect(result.message).toContain('Unexpected error occurred');
      });
      
      it('should handle fs.statSync throwing non-ENOENT error in showCurrentMode', async () => {
        mockFs.statSync.mockImplementation(() => {
          const error = new Error('Other FS error') as any;
          error.code = 'EACCES';
          throw error;
        });
        
        const result = await executeModeCommand([]);
        
        expectFailureResult(result);
        expect(result.errorCode).toBe('PERMISSION_DENIED');
      });
    });
  });

  describe('Interface Compliance', () => {
    
    it('should return ModeCommandResult interface compliant objects', async () => {
      mockFs.statSync.mockReturnValue(createMockStats());
      mockReadConfigFile.mockResolvedValue(validConfig);
      mockValidateModelExists.mockReturnValue(true);
      
      const result = await executeModeCommand([]);
      
      // 检查必需字段
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
      
      // 检查可选字段类型
      if (result.previousModel !== undefined) {
        expect(typeof result.previousModel).toBe('string');
      }
      if (result.newModel !== undefined) {
        expect(typeof result.newModel).toBe('string');
      }
      if (result.availableModels !== undefined) {
        expect(Array.isArray(result.availableModels)).toBe(true);
      }
      if (result.errorCode !== undefined) {
        expect(typeof result.errorCode).toBe('string');
      }
      if (result.errorLevel !== undefined) {
        expect(typeof result.errorLevel).toBe('string');
      }
      if (result.configInfo !== undefined) {
        expect(typeof result.configInfo.filePath).toBe('string');
        expect(typeof result.configInfo.lastModified).toBe('string');
        expect(['normal', 'missing', 'corrupted']).toContain(result.configInfo.status);
      }
      if (result.modelDetails !== undefined) {
        expect(typeof result.modelDetails.provider).toBe('string');
        expect(typeof result.modelDetails.model).toBe('string');
        expect(typeof result.modelDetails.isValid).toBe('boolean');
      }
    });
  });

  describe('Performance Tests', () => {
    
    it('should complete normal operations within reasonable time', async () => {
      mockFs.statSync.mockReturnValue(createMockStats());
      mockReadConfigFile.mockResolvedValue(validConfig);
      mockValidateModelExists.mockReturnValue(true);
      
      const startTime = Date.now();
      await executeModeCommand([]);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('should handle multiple rapid calls', async () => {
      mockFs.statSync.mockReturnValue(createMockStats());
      mockReadConfigFile.mockResolvedValue(validConfig);
      mockValidateModelExists.mockReturnValue(true);
      
      const promises = Array.from({ length: 10 }, () => executeModeCommand([]));
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expectSuccessResult(result);
      });
    });
  });
});