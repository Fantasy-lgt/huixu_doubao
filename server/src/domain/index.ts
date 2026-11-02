// 初代内部字段 department 对应新 Prisma 模型 Material.occasion；本模块为纯领域层不绑定 ORM，
// W3 由 mapper 完成 department↔occasion 与 Prisma 记录之间的映射。本任务内部类型仍沿用初代字段名 department，不改名。
//
// 领域层 barrel：只聚合纯函数、常量与类型；不引入 ORM 客户端，不做数据库与文件系统 IO。
export * from './errors.js';
export * from './validation.js';
export * from './materials.js';
export * from './draft.js';
export * from './text.js';
