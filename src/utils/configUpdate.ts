/**
 * 安全配置更新模块
 * 
 * 提供原子性和安全的配置文件更新功能，包括文件锁定、
 * 备份、验证和回滚机制，确保配置更新的数据完整性和并发安全性
 */

import fs from "node:fs/promises";
import path from "node:path";
import { readConfigFile, writeConfigFile, backupConfigFile } from './index';

/**
 * 配置更新结果接口
 */
export interface ConfigUpdateResult {
  success: boolean;
  message: string;
  previousValue?: string;
  newValue?: string;
  backupPath?: string;
}

/**
 * 文件锁管理类
 * 使用文件系统实现简单的互斥锁机制
 */
class FileLock {
  private lockPath: string;
  private acquired: boolean = false;
  
  constructor(configPath: string) {
    this.lockPath = `${configPath}.lock`;
  }
  
  /**
   * 尝试获取文件锁
   * @param timeoutMs 超时时间(毫秒)
   * @returns 是否成功获取锁
   */
  async acquire(timeoutMs: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        // 尝试创建锁文件，如果文件已存在会抛出错误
        await fs.writeFile(this.lockPath, process.pid.toString(), { flag: 'wx' });
        this.acquired = true;
        return true;
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // 锁文件已存在，等待后重试
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        throw error;
      }
    }
    
    return false;
  }
  
  /**
   * 释放文件锁
   */
  async release(): Promise<void> {
    if (this.acquired) {
      try {
        await fs.unlink(this.lockPath);
        this.acquired = false;
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.warn('Failed to release file lock:', error);
        }
      }
    }
  }
}

/**
 * 验证配置文件的完整性和格式
 * @param config 配置对象
 * @returns 验证结果
 */
function validateConfig(config: any): { valid: boolean; error?: string } {
  try {
    // 检查基本结构
    if (!config || typeof config !== 'object') {
      return { valid: false, error: '配置必须是有效的对象' };
    }
    
    // 检查必需的顶级字段
    if (!config.Providers || !Array.isArray(config.Providers)) {
      return { valid: false, error: 'Providers字段必须存在且为数组' };
    }
    
    if (!config.Router || typeof config.Router !== 'object') {
      return { valid: false, error: 'Router字段必须存在且为对象' };
    }
    
    // 检查Router.default字段格式
    if (config.Router.default) {
      if (typeof config.Router.default !== 'string') {
        return { valid: false, error: 'Router.default必须是字符串' };
      }
      
      // 验证格式：provider,model
      const parts = config.Router.default.split(',');
      if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
        return { valid: false, error: 'Router.default格式必须为 "provider,model"' };
      }
    }
    
    // 检查Providers数组中每个元素的结构
    for (let i = 0; i < config.Providers.length; i++) {
      const provider = config.Providers[i];
      if (!provider || typeof provider !== 'object') {
        return { valid: false, error: `Providers[${i}]必须是对象` };
      }
      
      if (!provider.name || typeof provider.name !== 'string') {
        return { valid: false, error: `Providers[${i}].name必须是非空字符串` };
      }
      
      if (!provider.models || !Array.isArray(provider.models)) {
        return { valid: false, error: `Providers[${i}].models必须是数组` };
      }
    }
    
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: `配置验证异常: ${error.message}` };
  }
}

/**
 * 验证新的默认模型值是否有效
 * @param newDefaultModel 新的默认模型字符串 (格式: "provider,model")
 * @param config 当前配置对象
 * @returns 验证结果
 */
function validateDefaultModel(newDefaultModel: string, config: any): { valid: boolean; error?: string } {
  const parts = newDefaultModel.split(',');
  if (parts.length !== 2) {
    return { valid: false, error: '默认模型格式必须为 "provider,model"' };
  }
  
  const [providerName, modelName] = parts.map(p => p.trim());
  if (!providerName || !modelName) {
    return { valid: false, error: 'provider和model名称不能为空' };
  }
  
  // 检查provider是否存在
  const provider = config.Providers?.find((p: any) => p.name === providerName);
  if (!provider) {
    return { valid: false, error: `Provider "${providerName}" 不存在于配置中` };
  }
  
  // 检查model是否存在于该provider中
  if (!provider.models?.includes(modelName)) {
    return { valid: false, error: `Model "${modelName}" 不存在于Provider "${providerName}" 中` };
  }
  
  return { valid: true };
}

/**
 * 原子性更新默认模型配置
 * 
 * 实现流程：获取锁 → 备份 → 读取 → 修改 → 验证 → 写入 → 释放锁
 * 任何步骤失败都会自动回滚到备份状态
 * 
 * @param newDefaultModel 新的默认模型 (格式: "provider,model")
 * @returns 更新结果
 */
export async function updateDefaultModel(newDefaultModel: string): Promise<ConfigUpdateResult> {
  const fileLock = new FileLock(await import('../constants').then(c => c.CONFIG_FILE));
  let backupPath: string | null = null;
  
  try {
    // 1. 获取文件锁，防止并发修改
    const lockAcquired = await fileLock.acquire(5000);
    if (!lockAcquired) {
      return {
        success: false,
        message: '无法获取配置文件锁，可能有其他进程正在修改配置。请稍后重试。'
      };
    }
    
    // 2. 创建配置文件备份
    backupPath = await backupConfigFile();
    if (!backupPath) {
      return {
        success: false,
        message: '无法创建配置文件备份，操作已取消'
      };
    }
    
    // 3. 读取当前配置
    const currentConfig = await readConfigFile();
    const previousValue = currentConfig.Router?.default || '';
    
    // 4. 验证新的默认模型值
    const modelValidation = validateDefaultModel(newDefaultModel, currentConfig);
    if (!modelValidation.valid) {
      return {
        success: false,
        message: `模型验证失败: ${modelValidation.error}`,
        previousValue,
        backupPath
      };
    }
    
    // 5. 创建修改后的配置对象（深拷贝避免修改原对象）
    const updatedConfig = JSON.parse(JSON.stringify(currentConfig));
    updatedConfig.Router = updatedConfig.Router || {};
    updatedConfig.Router.default = newDefaultModel;
    
    // 6. 验证修改后的配置完整性
    const configValidation = validateConfig(updatedConfig);
    if (!configValidation.valid) {
      return {
        success: false,
        message: `配置完整性验证失败: ${configValidation.error}`,
        previousValue,
        backupPath
      };
    }
    
    // 7. 原子性写入配置文件
    await writeConfigFile(updatedConfig);
    
    // 8. 验证写入结果（重新读取并验证）
    const verificationConfig = await readConfigFile();
    if (verificationConfig.Router?.default !== newDefaultModel) {
      throw new Error('配置写入验证失败：写入的值与预期不符');
    }
    
    return {
      success: true,
      message: `默认模型已成功更新从 "${previousValue}" 到 "${newDefaultModel}"`,
      previousValue,
      newValue: newDefaultModel,
      backupPath
    };
    
  } catch (error: any) {
    // 发生任何错误时尝试回滚
    if (backupPath) {
      try {
        const { CONFIG_FILE } = await import('../constants');
        await fs.copyFile(backupPath, CONFIG_FILE);
        return {
          success: false,
          message: `配置更新失败: ${error.message}。已自动回滚到备份状态。`,
          backupPath
        };
      } catch (rollbackError: any) {
        return {
          success: false,
          message: `配置更新失败: ${error.message}。回滚也失败: ${rollbackError.message}。请手动恢复配置文件。`,
          backupPath
        };
      }
    }
    
    return {
      success: false,
      message: `配置更新失败: ${error.message}`
    };
  } finally {
    // 确保释放文件锁
    await fileLock.release();
  }
}