# 部署说明（白屏修复 — 请按顺序做）

## 为什么会出现白屏？

若 GitHub Pages 发布的是 **`main` 分支根目录**，访问到的 `index.html` 里会是开发入口：

```html
<script type="module" src="/src/main.tsx"></script>
```

浏览器**无法**直接运行 TSX → **整页空白**。

正确做法是：只发布 **`npm run build` 生成的 `dist/`** 里的文件（里面是打包后的 `.js`）。

---

## 本项目采用的可靠方式：`gh-pages` 分支

CI 会把 **`dist/` 整份推送到 `gh-pages` 分支`**（使用 `peaceiris/actions-gh-pages`）。

你只需要在 GitHub 上把 Pages **指到这个分支的根目录**。

### ① 等一次 Actions 跑绿

1. 打开仓库 **Actions**
2. 找到 **Build and deploy to gh-pages branch**
3. 确认是绿色成功（第一次跑完才会生成 `gh-pages` 分支）

### ② 设置 Pages（关键）

1. **Settings** → **Pages**
2. **Build and deployment**
   - **Source** 选：**Deploy from a branch**
   - **Branch** 选：**gh-pages**（不要选 main）
   - **Folder** 选：**/ (root)**
3. Save

### ③ 打开网站

`https://samwu429.github.io/wearable-investor-demo/`  
（用户名或仓库名若不同，请相应替换）

### ④ 自检：看网页源代码（Ctrl+U）

应看到类似：

```html
<script type="module" crossorigin src="/wearable-investor-demo/assets/index-xxxx.js"></script>
```

**不应**再出现 `main.tsx`。

---

## 不要用这些组合（会再次白屏）

| 错误设置 | 结果 |
|----------|------|
| Branch = **main**，Folder = **/** | 发布源码 `index.html` → 白屏 |
| 只用「GitHub Actions」源但从未成功产出 artifact | 可能仍指向旧内容 |

**正确组合**：Branch = **gh-pages**，Folder = **/**。

---

## 子路径刷新（/watch、/glasses）

构建产物里包含 **`404.html`**（与 `index.html` 相同），便于在 GitHub Pages 上直接打开或刷新子路由。

---

## 若你改了仓库名

同步修改 **`vite.config.ts`** 里的：

```ts
const repo = '你的仓库名'
```

推送后等 Actions 再部署一次。
