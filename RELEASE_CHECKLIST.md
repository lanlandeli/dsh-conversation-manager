# 发布清单

## 需要发布者确认

- [x] npm 包名确定为 `dsh-conversation-manager`；2026-08-17 查询 npm 官方 registry 时尚未被占用。
- [ ] 确认 `package.json` 中的 `name`、`repository`、`homepage`、`bugs` 与最终公开仓库完全一致。
- [ ] 准备一张最新版浅色界面截图；如有条件，再补充深色截图或短 GIF。
- [ ] 在 GitHub 仓库设置中启用私密漏洞报告。
- [ ] 在 npm 包设置中配置 Trusted Publisher：仓库 `lanlandeli/dsh-conversation-manager`、工作流 `publish.yml`、Environment `npm`。

## 每次发布

1. 更新 `package.json` 版本和 `CHANGELOG.md`。
2. 执行 `npm ci`。
3. 执行 `npm run release:check`。
4. 使用 `npm pack` 生成 tarball，并在全新 Web Profile 中安装验证。
5. 检查列表、搜索、工作区分组、子代理展开、多详情展开、归档和恢复。
6. 使用临时会话验证永久删除确认、运行中会话保护、记录目录定位和产出文件安全边界。
7. 合并到 `main`，确认 CI 全部通过。
8. 创建与版本一致的 tag，例如 `v0.2.0`。
9. tag 推送后确认 Publish 工作流成功，并检查 npm 包文件、README 和 provenance。
10. 创建 GitHub Release，发布说明从对应 Changelog 条目整理。

## 首次发布后的设置

- [ ] 验证安装：`dsh plugin --profile web add <最终包名>`。
- [ ] 限制传统 npm token 发布权限，优先保留 Trusted Publishing。
- [ ] 为 `v*` 添加 tag 保护规则。
- [ ] 设置仓库 Topics：`deepseek-harness`、`dsh-plugin`、`session-manager`、`archive`。
