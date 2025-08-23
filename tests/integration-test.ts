/**
 * 集成测试 - 验证 modeCommand 模块的模型切换功能
 */

import { executeModeCommand, getCurrentDefaultModel } from '../src/utils/modeCommand';

async function testModelSwitching() {
  console.log('🔄 测试模型切换功能...\n');

  try {
    // 1. 获取当前模型
    console.log('1. 获取当前默认模型...');
    const currentModel = await getCurrentDefaultModel();
    console.log(`   当前模型: ${currentModel}\n`);

    // 2. 显示当前模式
    console.log('2. 显示当前模式信息...');
    const showResult = await executeModeCommand();
    console.log(`   结果: ${showResult.success ? '成功' : '失败'}`);
    if (showResult.success) {
      console.log(`   信息: ${showResult.message.split('\n')[0]}\n`);
    }

    // 3. 测试切换到不同的模型
    console.log('3. 测试切换到其他模型...');
    const testModels = [
      'deepseek,deepseek-chat',
      'openrouter,deepseek/deepseek-r1-0528:free',
      'gemini,gemini-2.5-flash'
    ];

    for (const model of testModels) {
      console.log(`   尝试切换到: ${model}`);
      const switchResult = await executeModeCommand([model]);
      
      if (switchResult.success) {
        console.log(`   ✅ 切换成功: ${switchResult.message.split('\n')[0]}`);
        
        // 验证切换是否生效
        const newCurrent = await getCurrentDefaultModel();
        if (newCurrent === model) {
          console.log(`   ✅ 验证成功: 当前模型确实是 ${newCurrent}`);
        } else {
          console.log(`   ❌ 验证失败: 期望 ${model}, 实际 ${newCurrent}`);
        }
      } else {
        console.log(`   ❌ 切换失败: ${switchResult.message}`);
      }
      console.log('');
    }

    // 4. 测试无效模型
    console.log('4. 测试无效模型处理...');
    const invalidModels = [
      'invalid,model',
      'nonexistent,provider', 
      'malformed-string'
    ];

    for (const invalidModel of invalidModels) {
      console.log(`   测试无效模型: ${invalidModel}`);
      const result = await executeModeCommand([invalidModel]);
      
      if (!result.success) {
        console.log(`   ✅ 正确拒绝: ${result.message.split('\n')[0]}`);
      } else {
        console.log(`   ❌ 意外接受了无效模型`);
      }
    }

    // 5. 恢复原始模型
    if (currentModel) {
      console.log(`\n5. 恢复到原始模型: ${currentModel}`);
      const restoreResult = await executeModeCommand([currentModel]);
      if (restoreResult.success) {
        console.log(`   ✅ 恢复成功`);
      } else {
        console.log(`   ❌ 恢复失败: ${restoreResult.message}`);
      }
    }

    console.log('\n🎉 集成测试完成！');

  } catch (error: any) {
    console.error('❌ 集成测试失败:', error.message);
  }
}

// 运行集成测试
testModelSwitching();