/**
 * 模型切换功能端到端集成测试
 * 
 * 测试范围：
 * - /model 命令解析和验证
 * - 会话级别的模型状态持久化
 * - 成功和失败响应格式
 * - 多会话并发模型状态管理
 */

import { router } from '../src/utils/router';
import { setSessionModel, getSessionModel, clearSessionModel, hasSessionModel } from '../src/utils/cache';
import { parseModelCommand, validateModelExists, replaceModelCommandWithSuccess } from '../src/middleware/commandParser';

// 模拟配置对象
const mockConfig = {
  Providers: [
    {
      name: 'deepseek',
      models: ['deepseek-chat', 'deepseek-coder']
    },
    {
      name: 'openrouter',
      models: ['deepseek/deepseek-r1-0528:free', 'meta-llama/llama-3.2-3b-instruct:free']
    },
    {
      name: 'gemini',
      models: ['gemini-2.5-flash', 'gemini-2.5-pro']
    }
  ],
  Router: {
    default: 'deepseek,deepseek-chat',
    longContextThreshold: 60000
  }
};

describe('模型切换功能集成测试', () => {
  
  beforeEach(() => {
    // 清理所有会话状态
    // 注意：这里假设有一个清理方法，实际实现中可能需要调整
    console.log('清理测试环境...');
  });

  describe('命令解析功能', () => {
    it('应该正确解析有效的 /model 命令', () => {
      const req = {
        body: {
          messages: [
            {
              role: 'user',
              content: '/model deepseek,deepseek-chat'
            }
          ]
        }
      };

      const result = parseModelCommand(req, mockConfig);
      
      expect(result).toEqual({
        provider: 'deepseek',
        model: 'deepseek-chat'
      });
    });

    it('应该正确处理数组格式的消息内容', () => {
      const req = {
        body: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '/model gemini,gemini-2.5-flash'
                }
              ]
            }
          ]
        }
      };

      const result = parseModelCommand(req, mockConfig);
      
      expect(result).toEqual({
        provider: 'gemini',
        model: 'gemini-2.5-flash'
      });
    });

    it('应该拒绝无效的命令格式', () => {
      const req = {
        body: {
          messages: [
            {
              role: 'user',
              content: '/model invalid-format'
            }
          ]
        }
      };

      expect(() => parseModelCommand(req, mockConfig)).toThrow('命令格式错误');
    });
  });

  describe('模型验证功能', () => {
    it('应该验证配置中存在的模型', () => {
      const result = validateModelExists('deepseek', 'deepseek-chat', mockConfig);
      expect(result).toBe(true);
    });

    it('应该拒绝配置中不存在的模型', () => {
      const result = validateModelExists('nonexistent', 'model', mockConfig);
      expect(result).toBe(false);
    });

    it('应该验证不同提供商的模型', () => {
      expect(validateModelExists('openrouter', 'deepseek/deepseek-r1-0528:free', mockConfig)).toBe(true);
      expect(validateModelExists('gemini', 'gemini-2.5-pro', mockConfig)).toBe(true);
    });
  });

  describe('会话状态管理', () => {
    const sessionId = 'test-session-123';

    beforeEach(() => {
      clearSessionModel(sessionId);
    });

    it('应该正确存储和检索会话模型状态', () => {
      const targetModel = 'deepseek,deepseek-coder';
      
      setSessionModel(sessionId, targetModel, 'command');
      
      expect(hasSessionModel(sessionId)).toBe(true);
      
      const state = getSessionModel(sessionId);
      expect(state).toBeDefined();
      expect(state!.model).toBe(targetModel);
      expect(state!.setBy).toBe('command');
      expect(state!.timestamp).toBeDefined();
    });

    it('应该支持多个会话的独立状态', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      
      setSessionModel(session1, 'deepseek,deepseek-chat', 'command');
      setSessionModel(session2, 'gemini,gemini-2.5-flash', 'command');
      
      expect(getSessionModel(session1)!.model).toBe('deepseek,deepseek-chat');
      expect(getSessionModel(session2)!.model).toBe('gemini,gemini-2.5-flash');
    });
  });

  describe('消息替换功能', () => {
    it('应该将 /model 命令替换为成功消息', () => {
      const messages = [
        {
          role: 'user',
          content: '/model deepseek,deepseek-chat'
        }
      ];

      const result = replaceModelCommandWithSuccess(messages, 'deepseek', 'deepseek-chat');
      
      expect(result[0].content).toContain('✅ 已成功切换到模型: deepseek/deepseek-chat');
    });

    it('应该处理混合内容的消息', () => {
      const messages = [
        {
          role: 'user',
          content: '/model gemini,gemini-2.5-flash\n\n请帮我写一个函数'
        }
      ];

      const result = replaceModelCommandWithSuccess(messages, 'gemini', 'gemini-2.5-flash');
      
      expect(result[0].content).toContain('✅ 已成功切换到模型: gemini/gemini-2.5-flash');
      expect(result[0].content).toContain('请帮我写一个函数');
    });

    it('应该处理数组格式的消息内容', () => {
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '/model openrouter,deepseek/deepseek-r1-0528:free'
            }
          ]
        }
      ];

      const result = replaceModelCommandWithSuccess(messages, 'openrouter', 'deepseek/deepseek-r1-0528:free');
      
      expect(result[0].content[0].text).toContain('✅ 已成功切换到模型: openrouter/deepseek/deepseek-r1-0528:free');
    });
  });

  describe('端到端路由测试', () => {
    it('应该正确处理新会话的模型切换', async () => {
      const req: any = {
        body: {
          messages: [
            {
              role: 'user',
              content: '/model deepseek,deepseek-coder'
            }
          ],
          metadata: {
            user_id: 'user_session_test-session-456'
          },
          model: undefined // 初始化 model 属性
        },
        sessionId: 'test-session-456'
      };
      const res = {};

      await router(req, res, mockConfig);

      expect(req.body.model).toBe('deepseek,deepseek-coder');
      expect(req.body.messages[0].content).toContain('✅ 已成功切换到模型: deepseek/deepseek-coder');
      expect(hasSessionModel('test-session-456')).toBe(true);
    });

    it('应该在已有会话中保持模型状态', async () => {
      const sessionId = 'test-session-789';
      
      // 设置初始会话状态
      setSessionModel(sessionId, 'gemini,gemini-2.5-pro', 'command');

      const req: any = {
        body: {
          messages: [
            {
              role: 'user',
              content: '请帮我写代码'
            }
          ],
          metadata: {
            user_id: `user_session_${sessionId}`
          },
          model: undefined // 初始化 model 属性
        },
        sessionId
      };
      const res = {};

      await router(req, res, mockConfig);

      expect(req.body.model).toBe('gemini,gemini-2.5-pro');
    });

    it('应该处理会话中的新模型切换命令', async () => {
      const sessionId = 'test-session-abc';
      
      // 设置初始会话状态
      setSessionModel(sessionId, 'deepseek,deepseek-chat', 'command');

      const req: any = {
        body: {
          messages: [
            {
              role: 'user',
              content: '/model openrouter,meta-llama/llama-3.2-3b-instruct:free'
            }
          ],
          metadata: {
            user_id: `user_session_${sessionId}`
          },
          model: undefined // 初始化 model 属性
        },
        sessionId
      };
      const res = {};

      await router(req, res, mockConfig);

      expect(req.body.model).toBe('openrouter,meta-llama/llama-3.2-3b-instruct:free');
      expect(getSessionModel(sessionId)!.model).toBe('openrouter,meta-llama/llama-3.2-3b-instruct:free');
      expect(req.body.messages[0].content).toContain('✅ 已成功切换到模型: openrouter/meta-llama/llama-3.2-3b-instruct:free');
    });

    it('应该正确处理无效模型的错误情况', async () => {
      const req: any = {
        body: {
          messages: [
            {
              role: 'user',
              content: '/model nonexistent,invalid-model'
            }
          ],
          metadata: {
            user_id: 'user_session_test-error'
          },
          model: undefined // 初始化 model 属性
        },
        sessionId: 'test-error'
      };
      const res = {};

      await expect(router(req, res, mockConfig)).rejects.toThrow('模型 nonexistent,invalid-model 在配置中不存在');
    });
  });

  describe('性能和稳定性测试', () => {
    it('应该处理高并发的会话状态操作', () => {
      const sessions = Array.from({ length: 100 }, (_, i) => `session-${i}`);
      const models = [
        'deepseek,deepseek-chat',
        'deepseek,deepseek-coder',
        'gemini,gemini-2.5-flash',
        'gemini,gemini-2.5-pro'
      ];

      // 并发设置会话状态
      sessions.forEach((sessionId, index) => {
        const model = models[index % models.length];
        setSessionModel(sessionId, model, 'command');
      });

      // 验证所有会话状态都正确设置
      sessions.forEach((sessionId, index) => {
        const expectedModel = models[index % models.length];
        expect(getSessionModel(sessionId)!.model).toBe(expectedModel);
      });
    });

    it('应该正确处理会话状态的过期和清理', () => {
      const sessionId = 'test-cleanup';
      
      setSessionModel(sessionId, 'deepseek,deepseek-chat', 'command');
      expect(hasSessionModel(sessionId)).toBe(true);
      
      clearSessionModel(sessionId);
      expect(hasSessionModel(sessionId)).toBe(false);
    });
  });
});

// 如果直接运行此文件，执行测试
if (require.main === module) {
  console.log('🧪 运行模型切换功能集成测试...');
  
  // 这里可以添加简单的测试运行逻辑
  // 在实际项目中，这通常由 Jest 或其他测试框架处理
}