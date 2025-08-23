/**
 * 配置模块 Mock
 * 
 * 模拟配置文件读写操作，用于单元测试
 */

export const readConfigFile = jest.fn();
export const writeConfigFile = jest.fn();
export const backupConfigFile = jest.fn();