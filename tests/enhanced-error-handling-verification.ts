/**
 * 增强错误处理功能验证脚本
 * 
 * 验证所有实现的错误处理场景和用户友好性
 */

import { 
  createEnhancedErrorMessage,
  createSuccessMessage,
  createInfoMessage,
  detectErrorType,
  ErrorCode,
  ErrorLevel,
  Icons
} from '../src/utils/errorHandling';

import { 
  executeModeCommand,
  parseModelString 
} from '../src/utils/modeCommand';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const tests: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      tests.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error: any) {
      tests.push({ name, passed: false, error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    }
  };
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toBeNull: () => {
      if (actual !== null) {
        throw new Error(`Expected null, but got ${actual}`);
      }
    },
    toContain: (expected: string) => {
      if (typeof actual !== 'string' || !actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined, but got undefined`);
      }
    },
    toMatch: (pattern: RegExp) => {
      if (typeof actual !== 'string' || !pattern.test(actual)) {
        throw new Error(`Expected "${actual}" to match pattern ${pattern}`);
      }
    }
  };
}

// 验证增强错误处理功能
const runEnhancedErrorHandlingTests = async () => {
  console.log('🧪 开始验证增强错误处理功能...\n');

  // 测试错误消息创建
  await test('创建无效模型格式错误消息', () => {
    const result = createEnhancedErrorMessage(
      ErrorCode.INVALID_MODEL_FORMAT,
      { modelString: 'invalid-format' }
    );
    
    expect(result).toContain('❌ 错误: 模型格式错误');
    expect(result).toContain('invalid-format');
    expect(result).toContain('💡 解决方法:');
    expect(result).toContain('📝 示例命令:');
    expect(result).toContain('ccr mode deepseek,deepseek-chat');
    expect(result).toContain('⚡ 获取帮助:');
    
    console.log('\n生成的错误消息示例:');
    console.log('─'.repeat(50));
    console.log(result);
    console.log('─'.repeat(50));
  })();

  await test('创建模型不存在错误消息', () => {
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
    expect(result).toContain('invalid,model');
    expect(result).toContain('提供商 \'invalid\' 未在配置中找到');
    expect(result).toContain('deepseek,deepseek-chat');
    expect(result).toContain('ccr mode --list');
    
    console.log('\n模型不存在错误消息示例:');
    console.log('─'.repeat(50));
    console.log(result);
    console.log('─'.repeat(50));
  })();

  await test('创建配置文件缺失错误消息', () => {
    const result = createEnhancedErrorMessage(
      ErrorCode.CONFIG_FILE_MISSING,
      { filePath: '/path/to/config.json' }
    );
    
    expect(result).toContain('❌ 致命错误: 配置文件不存在');
    expect(result).toContain('/path/to/config.json');
    expect(result).toContain('ccr start');
    expect(result).toContain('运行初始化命令创建配置文件');
    
    console.log('\n配置文件缺失错误消息示例:');
    console.log('─'.repeat(50));
    console.log(result);
    console.log('─'.repeat(50));
  })();

  await test('创建成功消息', () => {
    const result = createSuccessMessage(
      '模型已成功切换',
      ['从: openai,gpt-4', '到: deepseek,deepseek-chat']
    );
    
    expect(result).toContain('✅ 模型已成功切换');
    expect(result).toContain('ℹ️ 详细信息:');
    expect(result).toContain('• 从: openai,gpt-4');
    expect(result).toContain('• 到: deepseek,deepseek-chat');
    
    console.log('\n成功消息示例:');
    console.log('─'.repeat(50));
    console.log(result);
    console.log('─'.repeat(50));
  })();

  await test('错误类型检测功能', () => {
    // 测试文件不存在错误
    const fileError = { code: 'ENOENT', message: 'no such file' };
    expect(detectErrorType(fileError)).toBe(ErrorCode.CONFIG_FILE_MISSING);
    
    // 测试权限错误
    const permError = { code: 'EACCES', message: 'permission denied' };
    expect(detectErrorType(permError)).toBe(ErrorCode.PERMISSION_DENIED);
    
    // 测试JSON解析错误
    const jsonError = { message: 'Unexpected token in JSON' };
    expect(detectErrorType(jsonError)).toBe(ErrorCode.CONFIG_FILE_CORRUPTED);
    
    // 测试网络错误
    const netError = { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' };
    expect(detectErrorType(netError)).toBe(ErrorCode.NETWORK_ERROR);
    
    console.log('✅ 错误类型检测功能正常');
  })();

  // 测试集成到 modeCommand 的效果
  await test('executeModeCommand 使用增强错误处理', async () => {
    const result = await executeModeCommand(['invalid-format']);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_MODEL_FORMAT);
    expect(result.errorLevel).toBe(ErrorLevel.ERROR);
    expect(result.message).toContain('❌ 错误: 模型格式错误');
    expect(result.message).toContain('invalid-format');
    expect(result.message).toContain('💡 解决方法:');
    
    console.log('\n集成测试 - 无效格式错误消息:');
    console.log('─'.repeat(50));
    console.log(result.message);
    console.log('─'.repeat(50));
  })();

  // 测试视觉增强
  await test('视觉增强图标使用', () => {
    const result = createEnhancedErrorMessage(ErrorCode.MODEL_NOT_FOUND);
    
    expect(result).toContain(Icons.ERROR);
    expect(result).toContain(Icons.INFO);
    expect(result).toContain(Icons.TIP);
    expect(result).toContain(Icons.EXAMPLE);
    expect(result).toContain(Icons.COMMAND);
    
    console.log('✅ 视觉增强图标正确使用');
  })();

  // 测试用户友好性
  await test('错误消息长度合理性', () => {
    const result = createEnhancedErrorMessage(ErrorCode.MODEL_NOT_FOUND);
    
    // 消息应该足够详细但不过长
    expect(result.length).toBeDefined();
    if (result.length < 100) {
      throw new Error('错误消息过短，可能缺少重要信息');
    }
    if (result.length > 2000) {
      throw new Error('错误消息过长，可能影响用户体验');
    }
    
    console.log(`✅ 错误消息长度合理: ${result.length} 字符`);
  })();

  await test('错误消息包含编号建议', () => {
    const result = createEnhancedErrorMessage(ErrorCode.INVALID_MODEL_FORMAT);
    
    expect(result).toMatch(/\d+\./); // 应该包含编号
    expect(result).toContain('1.');
    expect(result).toContain('2.');
    
    console.log('✅ 错误消息包含编号的解决建议');
  })();

  await test('中文本地化检查', () => {
    const result = createEnhancedErrorMessage(ErrorCode.CONFIG_FILE_MISSING);
    
    expect(result).toContain('配置文件不存在');
    expect(result).toContain('解决方法');
    expect(result).toContain('示例命令');
    expect(result).toContain('获取帮助');
    
    // 不应该包含英文错误消息
    if (result.match(/error|Error|ERROR/)) {
      throw new Error('错误消息包含未本地化的英文内容');
    }
    
    console.log('✅ 中文本地化完整');
  })();

  // 测试复杂场景
  await test('复杂错误上下文处理', () => {
    const result = createEnhancedErrorMessage(
      ErrorCode.MODEL_NOT_FOUND,
      {
        modelString: 'wrongprovider,wrongmodel',
        provider: 'wrongprovider',
        model: 'wrongmodel',
        availableModels: Array.from({ length: 8 }, (_, i) => `provider${i},model${i}`)
      }
    );
    
    expect(result).toContain('wrongprovider,wrongmodel');
    expect(result).toContain('提供商 \'wrongprovider\' 未在配置中找到');
    expect(result).toContain('模型 \'wrongmodel\' 不存在');
    expect(result).toContain('provider0,model0');
    expect(result).toContain('以及其他'); // 应该截断长列表
    
    console.log('\n复杂错误上下文处理示例:');
    console.log('─'.repeat(50));
    console.log(result);
    console.log('─'.repeat(50));
  })();

  // 测试摘要
  console.log('\n📊 增强错误处理测试摘要:');
  const passedTests = tests.filter(t => t.passed);
  const failedTests = tests.filter(t => !t.passed);
  
  console.log(`✅ 通过: ${passedTests.length}`);
  console.log(`❌ 失败: ${failedTests.length}`);
  console.log(`📈 总计: ${tests.length}`);
  
  if (failedTests.length > 0) {
    console.log('\n失败的测试:');
    failedTests.forEach(t => {
      console.log(`  - ${t.name}: ${t.error}`);
    });
  }

  const successRate = (passedTests.length / tests.length) * 100;
  console.log(`\n📋 成功率: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 95) {
    console.log('🎉 增强错误处理功能验证通过！');
    console.log('\n🔧 功能特性验证:');
    console.log('  ✅ 分层级错误消息系统');
    console.log('  ✅ 详细错误信息和原因说明');
    console.log('  ✅ 具体解决步骤和示例命令');
    console.log('  ✅ 彩色和符号视觉增强');
    console.log('  ✅ 相关帮助命令提示');
    console.log('  ✅ 复杂错误分步指导');
    console.log('  ✅ 用户友好的中文本地化');
  } else {
    console.log('⚠️  部分测试失败，请检查实现');
  }
};

// 运行测试
runEnhancedErrorHandlingTests().catch(console.error);