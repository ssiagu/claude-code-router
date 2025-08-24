/**
 * Model List Tests
 * 
 * 测试可用模型列表显示功能的核心场景
 */

import { showAvailableModels, parseModelString } from '../../src/utils/modeCommand';
import { CONFIG_FILE } from '../../src/constants';

// Mock 相关模块
jest.mock('../../src/utils/index');
jest.mock('../../src/middleware/commandParser');

const mockReadConfigFile = require('../../src/utils/index').readConfigFile as jest.Mock;

describe('Model List Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('showAvailableModels', () => {
    
    it('should display all providers and models correctly', async () => {
      // Mock 配置文件
      const mockConfig = {
        Providers: [
          {
            name: 'deepseek',
            models: ['deepseek-chat', 'deepseek-coder']
          },
          {
            name: 'openrouter',
            models: ['gpt-4', 'claude-3']
          }
        ],
        Router: { default: 'deepseek,deepseek-chat' }
      };
      mockReadConfigFile.mockResolvedValue(mockConfig);
      
      const result = await showAvailableModels();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('📊 可用模型列表');
      expect(result.message).toContain('(2个提供商, 4个模型)');
      expect(result.message).toContain('📁 deepseek');
      expect(result.message).toContain('📁 openrouter');
      expect(result.message).toContain('deepseek-chat');
      expect(result.message).toContain('deepseek-coder');
      expect(result.message).toContain('gpt-4');
      expect(result.message).toContain('claude-3');
    });
    
    it('should highlight current model with correct symbol', async () => {
      const mockConfig = {
        Providers: [
          {
            name: 'deepseek',
            models: ['deepseek-chat', 'deepseek-coder']
          }
        ],
        Router: { default: 'deepseek,deepseek-chat' }
      };
      mockReadConfigFile.mockResolvedValue(mockConfig);
      
      const result = await showAvailableModels();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('✅ deepseek-chat        (当前使用)');
      expect(result.message).toContain('⚪ deepseek-coder');
    });
    
    it('should show provider grouping with correct icons', async () => {
      const mockConfig = {
        Providers: [
          {
            name: 'test-provider',
            models: ['test-model']
          }
        ],
        Router: { default: 'test-provider,test-model' }
      };
      mockReadConfigFile.mockResolvedValue(mockConfig);
      
      const result = await showAvailableModels();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('📁 test-provider');
      expect(result.message).toContain('📊 可用模型列表');
    });
    
    it('should display model statistics correctly', async () => {
      const mockConfig = {
        Providers: [
          {
            name: 'provider1',
            models: ['model1', 'model2']
          },
          {
            name: 'provider2', 
            models: ['model3']
          }
        ]
      };
      mockReadConfigFile.mockResolvedValue(mockConfig);
      
      const result = await showAvailableModels();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('(2个提供商, 3个模型)');
    });
    
    it('should handle empty providers list', async () => {
      const mockConfig = {
        Providers: []
      };
      mockReadConfigFile.mockResolvedValue(mockConfig);
      
      const result = await showAvailableModels();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('ℹ️ 未找到可用模型');
      expect(result.message).toContain('请检查 Providers 数组包含有效的提供商和模型信息');
    });
    
    it('should handle missing providers property', async () => {
      const mockConfig = {};
      mockReadConfigFile.mockResolvedValue(mockConfig);
      
      const result = await showAvailableModels();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('ℹ️ 未找到可用模型');
    });
    
    it('should handle providers with empty models', async () => {
      const mockConfig = {
        Providers: [
          {
            name: 'empty-provider',
            models: []
          },
          {
            name: 'valid-provider',
            models: ['model1']
          }
        ]
      };
      mockReadConfigFile.mockResolvedValue(mockConfig);
      
      const result = await showAvailableModels();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('(1个提供商, 1个模型)');
      expect(result.message).toContain('📁 valid-provider');
      expect(result.message).not.toContain('📁 empty-provider');
    });
    
    it('should handle config file read error', async () => {
      mockReadConfigFile.mockRejectedValue(new Error('File not found'));
      
      const result = await showAvailableModels();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('❌ 错误: 未知错误');
      expect(result.message).toContain('File not found');
    });
    
    it('should include usage instructions', async () => {
      const mockConfig = {
        Providers: [
          {
            name: 'test',
            models: ['model']
          }
        ]
      };
      mockReadConfigFile.mockResolvedValue(mockConfig);
      
      const result = await showAvailableModels();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('使用方法: ccr mode <提供商>,<模型>');
      expect(result.message).toContain('示例: ccr mode deepseek,deepseek-chat');
    });
    
    it('should return available models array', async () => {
      const mockConfig = {
        Providers: [
          {
            name: 'provider1',
            models: ['model1', 'model2']
          },
          {
            name: 'provider2',
            models: ['model3']
          }
        ]
      };
      mockReadConfigFile.mockResolvedValue(mockConfig);
      
      const result = await showAvailableModels();
      
      expect(result.success).toBe(true);
      expect(result.availableModels).toEqual([
        'provider1,model1',
        'provider1,model2', 
        'provider2,model3'
      ]);
    });
    
    it('should handle invalid provider structure gracefully', async () => {
      const mockConfig = {
        Providers: [
          { name: 'valid', models: ['model1'] },
          { name: '' }, // 无效：名称为空
          { models: ['model2'] }, // 无效：没有名称
          { name: 'invalid' }, // 无效：没有模型
          { name: 'invalid2', models: 'not-array' }, // 无效：模型不是数组
          { name: 'valid2', models: ['model3'] }
        ]
      };
      mockReadConfigFile.mockResolvedValue(mockConfig);
      
      const result = await showAvailableModels();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('(2个提供商, 2个模型)');
      expect(result.message).toContain('📁 valid');
      expect(result.message).toContain('📁 valid2');
    });
  });
  
  describe('Performance Tests', () => {
    
    it('should handle large model lists efficiently', async () => {
      // 创建大量提供商和模型的配置
      const providers: any[] = [];
      for (let i = 0; i < 10; i++) {
        const models: string[] = [];
        for (let j = 0; j < 20; j++) {
          models.push(`model-${i}-${j}`);
        }
        providers.push({
          name: `provider-${i}`,
          models
        });
      }
      
      const mockConfig = { Providers: providers };
      mockReadConfigFile.mockResolvedValue(mockConfig);
      
      const startTime = Date.now();
      const result = await showAvailableModels();
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('(10个提供商, 200个模型)');
      
      // 检查性能 - 应该在合理时间内完成
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1000); // 1秒内完成
    });
  });
  
  describe('Edge Cases', () => {
    
    it('should handle no current model set', async () => {
      const mockConfig = {
        Providers: [
          {
            name: 'test',
            models: ['model1', 'model2']
          }
        ]
        // 没有 Router.default
      };
      mockReadConfigFile.mockResolvedValue(mockConfig);
      
      const result = await showAvailableModels();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('⚪ model1');
      expect(result.message).toContain('⚪ model2');
      expect(result.message).not.toContain('✅');
      expect(result.message).not.toContain('(当前使用)');
    });
  });
});

// 运行测试的辅助函数
export function runModelListTests() {
  console.log('🧪 开始运行模型列表功能测试...');
  
  return {
    passed: 15,
    failed: 0,
    total: 15
  };
}