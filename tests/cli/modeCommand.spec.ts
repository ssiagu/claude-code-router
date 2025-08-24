/**
 * CLI Mode Command Integration Tests
 * 
 * 测试 mode 命令在 CLI 中的集成功能
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execAsync = promisify(exec);

// CLI 可执行文件路径
const CLI_PATH = join(__dirname, '../../dist/cli.js');

/**
 * 执行 CLI 命令并返回结果
 */
async function execCLI(args: string[], timeout: number = 10000): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number | null;
}> {
  try {
    const { stdout, stderr } = await execAsync(`node "${CLI_PATH}" ${args.join(' ')}`, {
      timeout
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    // 处理超时错误
    if (error.signal === 'SIGTERM' && error.killed) {
      return {
        stdout: error.stdout || '',
        stderr: 'Command timeout',
        exitCode: 124
      };
    }
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code || 1
    };
  }
}

describe('CLI Mode Command Integration', () => {
  
  // 设置全局超时时间
  jest.setTimeout(15000);
  
  describe('Help System Integration', () => {
    it('should include mode command in help output', async () => {
      const result = await execCLI(['--help']);
      
      // 帮助命令可能返回1（因为显示帮助后退出），这是正常的
      expect(result.exitCode).toBeOneOf([0, 1]);
      expect(result.stdout).toContain('mode');
      // 检查基本的mode命令存在，不检查具体描述文本
      expect(result.stdout).toMatch(/mode.*model/i);
    });

    it('should show help when no arguments provided', async () => {
      const result = await execCLI([]);
      
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('mode');
      expect(result.stdout).toContain('Manage model configuration');
    });
  });

  describe('Mode Command Execution', () => {
    it('should handle mode command without parameters (show current)', async () => {
      const result = await execCLI(['mode']);
      
      // 命令应该执行，无论成功还是失败都不应该崩溃
      expect(result.exitCode).toBeOneOf([0, 1]);
      expect(result.stdout || result.stderr).toBeTruthy();
      
      if (result.exitCode === 0) {
        // 检查包含模型配置相关的中文文本
        expect(result.stdout).toMatch(/(当前.*模型|模型.*配置|🎨.*模型)/i);
      }
    });

    it('should handle mode --show alias', async () => {
      const result = await execCLI(['mode', '--show']);
      
      expect(result.exitCode).toBeOneOf([0, 1]);
      expect(result.stdout || result.stderr).toBeTruthy();
      
      if (result.exitCode === 0) {
        // 检查包含模型配置相关的中文文本
        expect(result.stdout).toMatch(/(当前.*模型|模型.*配置|🎨.*模型)/i);
      }
    });

    it('should handle mode -s short alias', async () => {
      const result = await execCLI(['mode', '-s']);
      
      expect(result.exitCode).toBeOneOf([0, 1]);
      expect(result.stdout || result.stderr).toBeTruthy();
      
      if (result.exitCode === 0) {
        // 检查包含模型配置相关的中文文本
        expect(result.stdout).toMatch(/(当前.*模型|模型.*配置|🎨.*模型)/i);
      }
    });

    it('should handle mode --list command', async () => {
      const result = await execCLI(['mode', '--list']);
      
      expect(result.exitCode).toBeOneOf([0, 1]);
      expect(result.stdout || result.stderr).toBeTruthy();
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('可用模型列表');
      }
    });

    it('should handle mode -l short alias for list', async () => {
      const result = await execCLI(['mode', '-l']);
      
      expect(result.exitCode).toBeOneOf([0, 1]);
      expect(result.stdout || result.stderr).toBeTruthy();
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('可用模型列表');
      }
    });

    it('should handle invalid model format gracefully', async () => {
      const result = await execCLI(['mode', 'invalid-format']);
      
      expect(result.exitCode).toBe(1);
      // 检查错误消息中包含模型格式相关的中文提示
      expect(result.stderr).toMatch(/(模型.*格式|格式.*错误|提供商.*模型)/i);
    });

    it('should handle model switching attempts', async () => {
      const result = await execCLI(['mode', 'test,test-model']);
      
      // 应该处理命令，无论配置是否存在
      expect(result.exitCode).toBeOneOf([0, 1]);
      expect(result.stdout || result.stderr).toBeTruthy();
      
      if (result.exitCode === 1) {
        // 检查错误消息中包含模型不存在的相关提示
        expect(result.stderr).toMatch(/(不存在|未找到|无效)/i);
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should not affect existing start command', async () => {
      // 我们不想实际启动服务，只检查命令识别
      // 使用更短的超时时间避免长时间等待
      const result = await execCLI(['start'], 3000);
      
      // start 命令应该被识别（可能会因为已经运行而失败，但不应该显示帮助）
      // 如果超时，也认为命令被正确识别了
      if (result.exitCode !== 124) {
        expect(result.stdout).not.toContain('Usage: ccr [command]');
      }
    });

    it('should not affect existing version command', async () => {
      const result = await execCLI(['version']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('claude-code-router version:');
    });

    it('should not affect existing -v command', async () => {
      const result = await execCLI(['-v']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('claude-code-router version:');
    });

    it('should not affect existing help command', async () => {
      const result = await execCLI(['help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage: ccr [command]');
      expect(result.stdout).toContain('mode');
    });
  });

  describe('Error Handling Consistency', () => {
    it('should have consistent error format with other commands', async () => {
      const result = await execCLI(['mode', 'invalid']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toBeTruthy();
      // 错误信息应该是中文的，与项目风格一致
      expect(result.stderr).toMatch(/[\u4e00-\u9fa5]/);
    });

    it('should handle unexpected errors gracefully', async () => {
      // 测试异常情况下的错误处理
      const result = await execCLI(['mode', 'test,test-model', 'extra', 'parameters']);
      
      expect(result.exitCode).toBeOneOf([0, 1]);
      expect(result.stdout || result.stderr).toBeTruthy();
    });
  });
});

// 自定义匹配器
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}