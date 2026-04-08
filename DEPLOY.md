# 部署说明（解决「网页一片白」）

## 白屏原因（你已经遇到的情况）

若 GitHub Pages 的发布源选成了 **Deploy from a branch**，并且目录是 **`/`（仓库根目录）**，  
那么网站会直接提供仓库里的 **`index.html` 源码**，其中写的是：

```html
<script type="module" src="/src/main.tsx"></script>
```

浏览器**不会**像本地 `npm run dev` 那样用 Vite 编译 TSX，于是脚本加载失败 → **白屏**。

正确做法是：只发布 **`npm run build` 生成的 `dist/`** 目录里的静态文件（里面是打包后的 `.js` / `.css`）。

---

## 正确设置（必须做一次）

1. 打开 GitHub 仓库 → **Settings** → **Pages**（左侧）。
2. **Build and deployment** → **Source** 选择 **GitHub Actions**。  
   - 不要选 *Deploy from a branch*。若选过，请改掉。
3. 打开 **Actions** 标签页，确认 **Deploy to GitHub Pages** 工作流已成功跑绿。  
   - 若从未跑过：进入该 workflow → **Run workflow** → 手动运行一次。
4. 等几分钟后访问：  
   `https://<你的用户名>.github.io/wearable-investor-demo/`

---

## 如何确认已经修好

在浏览器里 **查看网页源代码**（Ctrl+U），你应当看到类似：

```html
<script type="module" crossorigin src="/wearable-investor-demo/assets/index-xxxx.js"></script>
```

**不应**再出现 `src/main.tsx`。

---

## 直接打开子路径（/watch、/glasses）

GitHub Pages 对子路径默认返回 404。本项目构建时会生成 **`404.html`**（与 `index.html` 相同），  
用于让刷新或直接打开 `/wearable-investor-demo/watch` 时仍能加载单页应用。

---

## 仓库改名时

若 GitHub 仓库名不是 `wearable-investor-demo`，请同步修改 **`vite.config.ts`** 里的：

```ts
const repo = '你的仓库名'
```

然后推送，等待 Actions 重新部署。
