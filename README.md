# 🗂️ dsh-conversation-manager

[English](./README.en.md)

> 为 DeepSeek Harness 提供安全、清晰的会话归档与记录管理。

[![npm version](https://img.shields.io/npm/v/dsh-conversation-manager?style=flat-square&logo=npm)](https://www.npmjs.com/package/dsh-conversation-manager)
[![npm downloads](https://img.shields.io/npm/dm/dsh-conversation-manager?style=flat-square)](https://www.npmjs.com/package/dsh-conversation-manager)
[![CI](https://img.shields.io/github/actions/workflow/status/lanlandeli/dsh-conversation-manager/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/lanlandeli/dsh-conversation-manager/actions)
[![Node](https://img.shields.io/badge/node-%3E%3D22.19%20%7C%7C%20%3E%3D24-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/npm/l/dsh-conversation-manager?style=flat-square)](./LICENSE)

`dsh-conversation-manager` 是面向 DeepSeek Harness Web UI 的会话管理插件。它把活跃会话、归档会话、子代理关系、活动摘要和本地产出文件集中到一个界面中，并为永久删除操作设置明确的确认与文件系统边界。

插件通过 Harness 提供的服务和 UI 插槽集成，不修改官方 npm 包或 Web UI DOM。会话数据只在本机读取和处理。

```sh
dsh plugin --profile web add dsh-conversation-manager
```

重启 Web Profile 后，在「设置」中打开 **会话管理**。

更新或卸载：

```sh
dsh plugin --profile web update dsh-conversation-manager
dsh plugin --profile web remove dsh-conversation-manager
```

## 🎬 效果演示

> 以下素材使用纯演示数据生成，不包含真实会话、路径或文件信息。

![会话管理效果演示](./assets/session-manager-demo.gif)

## 🖼️ 界面截图

<details>
<summary>查看浅色主题</summary>

![浅色主题](./assets/session-manager-light.png)

</details>

<details>
<summary>查看深色主题</summary>

![深色主题](./assets/session-manager-dark.png)

</details>

## ✨ 功能概览

| 模块 | 说明 |
| --- | --- |
| 📥 **归档与恢复** | 将对话移入归档或恢复到活跃列表，保留原始会话记录 |
| 📚 **批量管理** | 支持拖动连续选择、全选、批量归档、恢复与永久删除；失败项会保留选择以便重试 |
| 🔎 **搜索与分组** | 按标题或会话 ID 搜索，并可在单列表与工作区分组之间切换 |
| 🌳 **子代理关系** | 子代理默认隐藏，在父会话下按需展开；多级关系与搜索结果保持正确归属 |
| 📊 **会话详情** | 查看磁盘占用、更新时间、消息与工具调用统计、网络获取记录及父子会话关系 |
| 📁 **记录目录** | 选择单个会话后，在系统文件管理器中打开实际用于计算占用空间的记录目录 |
| 🧹 **产出文件清理** | 仅允许删除该会话记录过、且位于已注册工作区内的普通文件 |
| 🌐 **中英文界面** | 自动跟随 Harness 的语言设置切换中文或英文 |

## ⚠️ 删除行为

- **归档对话**只改变归档状态，不删除会话记录。
- **删除选中**会永久删除所选会话的持久化记录，无法撤销。
- 删除父会话不会级联删除子代理；只有明确选中的会话会被删除。
- 正在运行的会话会被拒绝删除。当前页面打开的会话在界面中不可选择。
- **删除选中文件**会永久删除磁盘文件，仅用于无需保留的会话产出。

重要数据仍建议自行备份。插件不是备份或回收站工具。

## 🔒 安全边界

产出文件删除必须同时满足以下条件：

1. 请求包含有效的会话 ID；
2. 文件路径存在于该会话的产出文件列表；
3. 目标是普通文件，不是目录或符号链接；
4. 解析后的真实路径严格位于 Harness 已注册的工作区内部，且不能是工作区根目录。

会话记录目录同样会被限制在 `DSH_HOME/sessions` 内。浏览器接口只接受本机回环地址上的同源 POST 请求，并限制请求体大小。详细信息见 [安全策略](./SECURITY.md) 和 [隐私说明](./PRIVACY.md)。

## 🧩 兼容性

目前已在 DeepSeek Harness `0.1.0-rc.6`、Node.js `22.19+` 和 `24+`、官方 Web Profile 上验证。界面支持浅色、深色主题以及加载同源 Web UI 的桌面封装。

Harness 仍处于快速迭代阶段。其他版本可能能够运行，但不属于当前验证范围；详见 [兼容性说明](./docs/COMPATIBILITY.md)。

## 🛠️ 开发

```sh
npm ci
npm run release:check
```

源码结构：

| 路径 | 用途 |
| --- | --- |
| `src/index.ts` | Host API、详情聚合、归档、恢复与删除操作 |
| `src/server/path-security.ts` | 会话记录和工作区文件的真实路径安全围栏 |
| `src/client/index.tsx` | 设置页界面、详情卡片和交互状态 |
| `src/client/model.ts` | 搜索、工作区分组与子代理树模型 |
| `src/client/batch.ts` | 保留逐项成功/失败结果的批处理器 |
| `src/client/i18n.ts` | 中英文界面文案 |
| `src/client/styles.ts` | 响应式样式、主题和动效 |
| `tests/` | 路径安全、批处理和状态模型测试 |

构建产物位于 `lib/`，不要直接编辑。贡献前请阅读 [开发说明](./CONTRIBUTING.md)。

## 🐛 遇到问题

如果出现插件入口缺失、会话列表不完整、目录定位错误或界面异常，请 [提交 Issue](https://github.com/lanlandeli/dsh-conversation-manager/issues/new)，并尽量附上：

- DeepSeek Harness、插件和 Node.js 版本；
- 安装或更新插件时执行的命令；
- 可复现问题的操作步骤；
- 已脱敏的错误日志或界面截图。

请勿在公开 Issue 中提交 API 密钥、访问令牌、提示词、会话日志或本机完整路径。安全问题请按 [安全策略](./SECURITY.md) 私密报告。

## 📜 许可证

[MIT](./LICENSE)。项目包含基于上游 MIT 许可代码修改的部分，版权声明见 `LICENSE`。
