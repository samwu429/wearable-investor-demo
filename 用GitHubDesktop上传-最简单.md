# 最容易的上传方式：GitHub Desktop（不用记命令）

我（AI）**不能替你登录 GitHub**，所以没法代替你点「上传」。  
下面这个方法**全程鼠标**，最适合不想用命令行的人。

---

## ① 安装 GitHub Desktop

浏览器打开：https://desktop.github.com/  
下载安装，打开后用你的 **GitHub 账号登录**（它会打开浏览器让你点一下授权）。

---

## ② 在网页上先建一个空仓库（只要做一次）

1. 打开 https://github.com/new  
2. **Repository name** 填：`wearable-investor-demo`  
3. 选 **Public**  
4. **不要**勾选 README / .gitignore / license（保持空的）  
5. 点 **Create repository**  
6. **关掉**网页上让你敲命令的那一页（我们不用命令行）

---

## ③ 用 Desktop 把本地文件夹加进去

1. 打开 **GitHub Desktop**  
2. 菜单 **File → Add Local Repository**（添加本地仓库）  
3. 点 **Choose…**，选中这个文件夹：  
   `C:\Users\wu200\Projects\wearable-investor-demo`  
4. 若提示「这不是一个 Git 仓库」：点 **create a repository**，路径仍选上面这个文件夹，再确定（一般你已经有 `.git`，会直接加进来）

---

## ④ 发布到 GitHub

1. 菜单 **Repository → Repository Settings → Remote**  
   确认已经连上远程；若没有：  
   **Repository → Publish repository**（发布仓库）  
2. **Name** 填：`wearable-investor-demo`（和网页上建的名字一致）  
3. 勾选 **Keep this code private** 若你要私有；给投资人看一般选 **不勾**（公开）  
4. 点 **Publish Repository**

---

## ⑤ 以后改了代码怎么再上传？

1. 打开 GitHub Desktop  
2. 左边会列出你改过的文件  
3. 下面 **Summary** 随便写一句，例如：`更新文案`  
4. 点 **Commit to main**  
5. 点 **Push origin**

---

## 若仓库名不是 `wearable-investor-demo`

可以，但要把项目里的 `vite.config.ts` 这一行改成**和 GitHub 仓库名一模一样**：

```ts
const repo = '你的仓库名'
```

否则以后用 GitHub Pages 部署时，网页可能加载不出样式。

---

## 还是不想装软件？

可以用 **Cursor / VS Code** 左侧 **源代码管理** 面板，登录 GitHub 后也有「发布到 GitHub」类按钮（不同版本文案略有差别）。  
核心都一样：**必须先登录你的账号**，这一步只能你自己完成。
