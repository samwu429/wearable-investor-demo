# Wearable Trust Field — 投资人线上演示

无硬件的 **手表 + 眼镜** 双 Part 交互演示，用于向投资人同步叙事与产品气质。技术实现为纯前端静态站点，可托管在 **GitHub Pages**。

## 网页一片白？

几乎都是因为 Pages 在发布 **`main` 分支根目录**（里面有指向 `/src/main.tsx` 的开发用 `index.html`）。  
**请读 [DEPLOY.md](./DEPLOY.md)**：把 Pages 改为 **`gh-pages` 分支 + /(root)**。CI 会自动把构建好的 `dist/` 推到 `gh-pages`。

## 在线访问（部署后）

将仓库在 GitHub 打开 **Settings → Pages → GitHub Actions** 后，地址一般为：

`https://<你的用户名>.github.io/wearable-investor-demo/`

若你改名了仓库，请同步修改 `vite.config.ts` 里的 `repo` 常量，并在 GitHub Actions 里使用 `GH_PAGES=1` 构建。

## 本地运行

```bash
npm install
npm run dev
```

## 生产构建

```bash
npm run build
```

GitHub Pages（子路径）构建：

```bash
# Windows PowerShell
$env:GH_PAGES='1'; npm run build

# Unix
GH_PAGES=1 npm run build
```

## 项目结构

- `/` 概览与叙事入口  
- `/watch` 手表演示：PEH 握手步骤、Hub/SLM/SE 状态、事件日志  
- `/glasses` 眼镜演示：JIT 合同浮窗、信任圈标识、瞳孔波形示意  

## 安全说明（重要）

- **请勿**在仓库或 Issue 中提交任何 Google / OpenAI 等 API Key。  
- 静态站点若在前端直接调用云端大模型，**密钥会暴露给所有访客**，因此本演示 **不集成** 需密钥的在线 AI。  
- 若未来需要「对话式路演助手」，请使用 **服务端或 Edge Function** 保管密钥，或让访问者登录后使用其自有密钥。

## 推送到 GitHub（本机未装 Git 到 PATH 时，可用 Git Bash 或完整路径）

在仓库根目录执行（将 `samwu429` 换成你的用户名；若仓库名不同，请改 `vite.config.ts` 里的 `repo`）：

```bash
git branch -M main
git remote add origin https://github.com/samwu429/wearable-investor-demo.git
git push -u origin main
```

然后在 GitHub：**Settings → Pages** → Source 选 **Deploy from a branch** → 分支选 **`gh-pages`** → 文件夹 **`/(root)`**。  
等 **Actions** 里 **Build and deploy to gh-pages branch** 跑绿后再访问站点。

## 许可证

MIT（可按需修改）
