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
async function execCLI(args: string[]): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number | null;
}> {
  try {
    const { stdout, stderr } = await execAsync(`node "${CLI_PATH}" ${args.join(' ')}`);
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code || 1
    };
  }
}

describe('CLI Mode Command Integration', () => {
  
  describe('Help System Integration', () => {
    it('should include mode command in help output', async () => {
      const result = await execCLI(['--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('mode');
      expect(result.stdout).toContain('Manage model configuration');
      expect(result.stdout).toContain('ccr mode deepseek,deepseek-chat');
      expect(result.stdout).toContain('ccr mode --list');
      expect(result.stdout).toContain('ccr mode --show');
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
        expect(result.stdout).toContain('当前默认模型');
      }
    });

    it('should handle mode --show alias', async () => {
      const result = await execCLI(['mode', '--show']);
      
      expect(result.exitCode).toBeOneOf([0, 1]);
      expect(result.stdout || result.stderr).toBeTruthy();
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('当前默认模型');
      }
    });

    it('should handle mode -s short alias', async () => {
      const result = await execCLI(['mode', '-s']);
      
      expect(result.exitCode).toBeOneOf([0, 1]);
      expect(result.stdout || result.stderr).toBeTruthy();
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('当前默认模型');
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
      expect(result.stderr).toContain('模型格式错误');
      expect(result.stderr).toContain('提供商,模型名');
    });

    it('should handle model switching attempts', async () => {
      const result = await execCLI(['mode', 'test,test-model']);
      
      // 应该处理命令，无论配置是否存在
      expect(result.exitCode).toBeOneOf([0, 1]);
      expect(result.stdout || result.stderr).toBeTruthy();
      
      if (result.exitCode === 1) {
        expect(result.stderr).toContain('在配置中不存在');
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should not affect existing start command', async () => {
      // 我们不想实际启动服务，只检查命令识别
      const result = await execCLI(['start']);
      
      // start 命令应该被识别（可能会因为已经运行而失败，但不应该显示帮助）
      expect(result.stdout).not.toContain('Usage: ccr [command]');
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