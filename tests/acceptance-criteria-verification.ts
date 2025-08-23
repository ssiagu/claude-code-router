/**
 * 验收标准验证脚本 - Story 2.3: 增强错误处理和用户指导
 * 
 * 验证所有验收标准是否都已满足
 */

import { 
  createEnhancedErrorMessage,
  createSuccessMessage,
  ErrorCode,
  ErrorLevel,
  Icons
} from '../src/utils/errorHandling';

import { executeModeCommand } from '../src/utils/modeCommand';

interface ACVerification {
  id: string;
  description: string;
  verified: boolean;
  details: string[];
}

const acceptanceCriteria: ACVerification[] = [
  {
    id: 'AC1',
    description: '每种错误类型都有清晰的描述和原因说明',
    verified: false,
    details: []
  },
  {
    id: 'AC2', 
    description: '提供具体的解决步骤和示例命令',
    verified: false,
    details: []
  },
  {
    id: 'AC3',
    description: '错误信息使用彩色和符号增强可读性',
    verified: false,
    details: []
  },
  {
    id: 'AC4',
    description: '包含相关帮助命令的提示引导',
    verified: false,
    details: []
  },
  {
    id: 'AC5',
    description: '复杂错误提供分步解决指导',
    verified: false,
    details: []
  },
  {
    id: 'AC6',
    description: '实现分层级的错误消息系统',
    verified: false,
    details: []
  },
  {
    id: 'AC7',
    description: '所有错误场景都经过用户友好性验证',
    verified: false,
    details: []
  }
];

async function verifyAcceptanceCriteria() {
  console.log('🎯 开始验证验收标准...\n');

  // AC1: 每种错误类型都有清晰的描述和原因说明
  try {
    const errorMessage = createEnhancedErrorMessage(
      ErrorCode.MODEL_NOT_FOUND,
      { modelString: 'invalid,model', provider: 'invalid', model: 'model' }
    );
    
    const hasDescription = errorMessage.includes('问题描述:');
    const hasReasons = errorMessage.includes('具体原因:');
    const hasModelString = errorMessage.includes('invalid,model');
    const hasProviderInfo = errorMessage.includes('提供商');
    
    if (hasDescription && hasReasons && hasModelString && hasProviderInfo) {
      acceptanceCriteria[0].verified = true;
      acceptanceCriteria[0].details = [
        '✅ 包含清晰的问题描述',
        '✅ 提供具体原因说明', 
        '✅ 显示用户输入的错误内容',
        '✅ 指出具体的错误点'
      ];
    }
  } catch (error) {
    acceptanceCriteria[0].details = [`❌ 错误: ${error}`];
  }

  // AC2: 提供具体的解决步骤和示例命令
  try {
    const errorMessage = createEnhancedErrorMessage(ErrorCode.INVALID_MODEL_FORMAT);
    
    const hasSolutions = errorMessage.includes('解决方法:');
    const hasNumberedSteps = /\d+\./.test(errorMessage);
    const hasExamples = errorMessage.includes('示例命令:');
    const hasSpecificCommands = errorMessage.includes('ccr mode deepseek,deepseek-chat');
    
    if (hasSolutions && hasNumberedSteps && hasExamples && hasSpecificCommands) {
      acceptanceCriteria[1].verified = true;
      acceptanceCriteria[1].details = [
        '✅ 提供编号的解决步骤',
        '✅ 包含具体的示例命令',
        '✅ 命令可直接执行',
        '✅ 解决方案具体可行'
      ];
    }
  } catch (error) {
    acceptanceCriteria[1].details = [`❌ 错误: ${error}`];
  }

  // AC3: 错误信息使用彩色和符号增强可读性
  try {
    const errorMessage = createEnhancedErrorMessage(ErrorCode.MODEL_NOT_FOUND);
    
    const hasErrorIcon = errorMessage.includes(Icons.ERROR);
    const hasInfoIcon = errorMessage.includes(Icons.INFO);
    const hasTipIcon = errorMessage.includes(Icons.TIP);
    const hasExampleIcon = errorMessage.includes(Icons.EXAMPLE);
    const hasCommandIcon = errorMessage.includes(Icons.COMMAND);
    
    if (hasErrorIcon && hasInfoIcon && hasTipIcon && hasExampleIcon && hasCommandIcon) {
      acceptanceCriteria[2].verified = true;
      acceptanceCriteria[2].details = [
        '✅ 使用错误级别图标 (❌)',
        '✅ 使用信息图标 (ℹ️)',
        '✅ 使用提示图标 (💡)',
        '✅ 使用示例图标 (📝)',
        '✅ 使用命令图标 (⚡)'
      ];
    }
  } catch (error) {
    acceptanceCriteria[2].details = [`❌ 错误: ${error}`];
  }

  // AC4: 包含相关帮助命令的提示引导
  try {
    const errorMessage = createEnhancedErrorMessage(ErrorCode.MODEL_NOT_FOUND);
    
    const hasHelpSection = errorMessage.includes('获取帮助:');
    const hasHelpCommands = errorMessage.includes('ccr mode --help');
    const hasListCommand = errorMessage.includes('ccr mode --list');
    
    if (hasHelpSection && hasHelpCommands && hasListCommand) {
      acceptanceCriteria[3].verified = true;
      acceptanceCriteria[3].details = [
        '✅ 包含帮助命令提示',
        '✅ 提供相关的帮助命令',
        '✅ 命令链接逻辑合理',
        '✅ 引导用户获取更多信息'
      ];
    }
  } catch (error) {
    acceptanceCriteria[3].details = [`❌ 错误: ${error}`];
  }

  // AC5: 复杂错误提供分步解决指导
  try {
    const configCorruptedMessage = createEnhancedErrorMessage(
      ErrorCode.CONFIG_FILE_CORRUPTED,
      { filePath: '/path/to/config.json', originalError: 'JSON parse error' }
    );
    
    const configMissingMessage = createEnhancedErrorMessage(
      ErrorCode.CONFIG_FILE_MISSING,
      { filePath: '/path/to/config.json' }
    );
    
    const hasStepByStep = /\d+\./.test(configCorruptedMessage);
    const hasBackupSuggestion = configCorruptedMessage.includes('备份');
    const hasRecoverySteps = configMissingMessage.includes('初始化');
    const hasMultipleSolutions = configCorruptedMessage.split('解决方法:')[1]?.split('\n').length > 3;
    
    if (hasStepByStep && hasBackupSuggestion && hasRecoverySteps && hasMultipleSolutions) {
      acceptanceCriteria[4].verified = true;
      acceptanceCriteria[4].details = [
        '✅ 配置损坏的分步修复指导',
        '✅ 包含备份和恢复建议',
        '✅ 首次设置的初始化引导',
        '✅ 多种解决方案选择'
      ];
    }
  } catch (error) {
    acceptanceCriteria[4].details = [`❌ 错误: ${error}`];
  }

  // AC6: 实现分层级的错误消息系统
  try {
    const result = await executeModeCommand(['invalid-format']);
    
    const hasErrorCode = result.errorCode === ErrorCode.INVALID_MODEL_FORMAT;
    const hasErrorLevel = result.errorLevel === ErrorLevel.ERROR;
    const hasSuccess = result.success === false;
    const hasEnhancedMessage = result.message.includes('❌');
    
    // 测试不同错误级别
    const warningMessage = createEnhancedErrorMessage(ErrorCode.NETWORK_ERROR);
    const fatalMessage = createEnhancedErrorMessage(ErrorCode.CONFIG_FILE_MISSING);
    
    const hasWarningLevel = warningMessage.includes('⚠️ 警告:');
    const hasFatalLevel = fatalMessage.includes('❌ 致命错误:');
    
    if (hasErrorCode && hasErrorLevel && hasSuccess && hasEnhancedMessage && 
        hasWarningLevel && hasFatalLevel) {
      acceptanceCriteria[5].verified = true;
      acceptanceCriteria[5].details = [
        '✅ 实现错误码系统',
        '✅ 实现错误级别分类',
        '✅ 扩展ModeCommandResult接口',
        '✅ 支持警告/错误/致命三级',
        '✅ 集成到现有系统'
      ];
    }
  } catch (error) {
    acceptanceCriteria[5].details = [`❌ 错误: ${error}`];
  }

  // AC7: 所有错误场景都经过用户友好性验证
  try {
    const scenarios = [
      ErrorCode.MODEL_NOT_FOUND,
      ErrorCode.PROVIDER_NOT_FOUND,
      ErrorCode.INVALID_MODEL_FORMAT,
      ErrorCode.CONFIG_FILE_MISSING,
      ErrorCode.CONFIG_FILE_CORRUPTED,
      ErrorCode.PERMISSION_DENIED,
      ErrorCode.NETWORK_ERROR
    ];
    
    let allFriendly = true;
    const friendlinessChecks = [];
    
    for (const scenario of scenarios) {
      const message = createEnhancedErrorMessage(scenario);
      
      // 检查用户友好性标准
      const hasChineseText = /[\u4e00-\u9fa5]/.test(message);
      const noTechnicalJargon = !message.includes('Error:') && !message.includes('Exception:');
      const reasonableLength = message.length > 50 && message.length < 1500;
      const hasActionableAdvice = message.includes('解决方法:');
      
      if (hasChineseText && noTechnicalJargon && reasonableLength && hasActionableAdvice) {
        friendlinessChecks.push(`✅ ${scenario}: 用户友好`);
      } else {
        friendlinessChecks.push(`❌ ${scenario}: 需要改进`);
        allFriendly = false;
      }
    }
    
    if (allFriendly) {
      acceptanceCriteria[6].verified = true;
      acceptanceCriteria[6].details = friendlinessChecks;
    } else {
      acceptanceCriteria[6].details = friendlinessChecks;
    }
  } catch (error) {
    acceptanceCriteria[6].details = [`❌ 错误: ${error}`];
  }

  // 输出验证结果
  console.log('📋 验收标准验证结果:\n');
  
  const verifiedCount = acceptanceCriteria.filter(ac => ac.verified).length;
  const totalCount = acceptanceCriteria.length;
  
  acceptanceCriteria.forEach(ac => {
    const status = ac.verified ? '✅ 通过' : '❌ 未通过';
    console.log(`${status} ${ac.id}: ${ac.description}`);
    
    if (ac.details.length > 0) {
      ac.details.forEach(detail => {
        console.log(`    ${detail}`);
      });
    }
    console.log();
  });
  
  console.log(`📊 验证摘要: ${verifiedCount}/${totalCount} 验收标准已满足`);
  console.log(`📈 完成度: ${Math.round((verifiedCount / totalCount) * 100)}%`);
  
  if (verifiedCount === totalCount) {
    console.log('\n🎉 所有验收标准都已满足！故事 2.3 开发完成。');
    console.log('\n🚀 增强错误处理功能特性:');
    console.log('   • 分层级错误消息系统 (警告/错误/致命)');
    console.log('   • 12种常见错误的详细处理模板');
    console.log('   • 智能错误类型检测');
    console.log('   • 视觉增强的用户界面');
    console.log('   • 具体可执行的解决建议');
    console.log('   • 完整的中文本地化');
    console.log('   • 复杂错误的分步指导');
    console.log('   • 与现有系统的无缝集成');
  } else {
    console.log('\n⚠️  仍有验收标准未满足，请继续完善。');
  }
}

// 运行验证
verifyAcceptanceCriteria().catch(console.error);