# 兼容性说明

| 组件 | 已验证环境 | 声明范围 |
| --- | --- | --- |
| DeepSeek Harness / dsh | `0.1.0-rc.6` | `0.1.x` 对等接口 |
| Node.js | `22.19+`、`24+` | `^22.19.0 || >=24.0.0` |
| Web UI | 官方 `web` Profile | 必需 |
| 操作系统 | Windows | 已验证；目录打开实现同时提供 macOS/Linux 命令适配 |
| 主题 | 浅色、深色、跟随系统 | 支持 |
| 动效偏好 | `prefers-reduced-motion` | 支持 |
| 桌面封装 | 加载同源 Web UI 的封装 | 支持 |

DeepSeek Harness 仍处于开发者预览阶段，后续版本可能包含不兼容改动。本插件依赖以下 Harness 能力：

- Host：会话存储、会话持久化、工作区注册表、代理状态与 Web Server；
- Client：会话、工作区、Locale、UI primitives 和 `settings.section` 插槽；
- 所有 `@deepseek-ai/*` 运行时模块均声明为对等依赖，复用 Profile 提供的实例；
- 不查询、监听或修改 Harness 所有的 DOM 节点。

每次发布必须完成：

1. TypeScript 类型检查与单元测试；
2. 生产构建与 npm 包内容检查；
3. 在全新 `DSH_HOME` 和 Web Profile 中安装打包后的插件；
4. 验证列表、详情、归档和恢复；
5. 使用临时工作区验证文件安全边界与删除确认；
6. 从 Profile 中移除插件，且不修改 Harness 官方包。

CI 覆盖 Node.js 22.19 和 24，并在 Windows、Linux 与 macOS 上执行静态检查和单元测试。扩大兼容范围前，应先完成对应 Harness 版本和平台的实际运行验证。
