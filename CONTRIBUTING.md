# 开发说明

## 本地环境

使用 Node.js 22.19+ 或 24+：

```sh
npm ci
npm run release:check
```

## 修改要求

- 只使用 Harness 服务与 UI 插槽，不依赖或修改 Harness Web UI 的 DOM；
- 所有文件系统操作都必须经过真实路径解析，并保持在明确的会话或工作区边界内；
- 新增永久删除能力时必须有明确确认、最小目标范围和对应安全测试；
- 用户可见行为变化时同步更新 `README.md`、`README.en.md` 和 `CHANGELOG.md`；
- 搜索、分组、子代理关系、批处理或路径行为变化时添加回归测试；
- 不添加遥测，不记录凭据、提示词正文、回复正文或文件内容；
- 不直接编辑 `lib/`，构建产物由发布检查生成。

## 发布检查

发布前更新版本号和 `CHANGELOG.md`，运行 `npm run release:check`，并在全新的 Web Profile 中安装 `npm pack` 生成的包进行冒烟测试。正式版本建议通过 npm Trusted Publishing 发布。
