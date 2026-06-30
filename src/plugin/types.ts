import type { Command } from 'commander';
import type { NewsSource } from '../core/types.js';

/** 插件必须导出的接口 */
export interface Plugin {
  /** 插件唯一标识 */
  readonly name: string;
  /** 语义化版本 */
  readonly version: string;
  /** 注册入口：插件内部调用 program.command(...) 和 registry.registerSource(...) */
  register(program: Command, registry: PluginRegistry): void | Promise<void>;
}

/** 插件可用的注册能力 */
export interface PluginRegistry {
  registerSource(source: NewsSource): void;
}

/** 已安装插件的元信息（从 package.json 读取） */
export interface PluginMeta {
  name: string;
  version: string;
  /** 安装路径（绝对路径） */
  path: string;
  /** 'local' | 'global' */
  scope: 'local' | 'global';
  /** 插件目录下的入口文件路径 */
  entryFile: string;
}
