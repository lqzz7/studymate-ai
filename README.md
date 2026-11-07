# StudyMate AI

一个面向学习场景的 AI 学习资料助手。

当前是 **第 2 周版本（v0.2）**：网页已经接入 FastAPI 后端，并通过 OpenRouter 调用真实 AI；后端不可用时会自动回退到本地模拟回复。

- 最后更新：2026-11-07
- 运行方式：本地前端 + 本地后端
- 技术栈：HTML5 / CSS3 / 原生 JavaScript / Python / FastAPI / OpenRouter

---

## 项目简介

StudyMate AI 的目标是帮助学习者完成三件事：

1. 上传一份学习资料
2. 让 AI 总结重点并依据资料回答问题
3. 根据资料生成复习题

目前已经完成“真实 AI 对话”这一层。资料读取、资料问答、复习题和历史记录会在后续阶段加入。

---

## 当前状态

| 项目 | 状态 |
|---|---|
| 网页可以本地运行 | ✅ |
| 聊天界面与消息气泡 | ✅ |
| 发送消息、加载状态 | ✅ |
| FastAPI 后端 | ✅ |
| OpenRouter 真实 AI 回复 | ✅ |
| 后端不可用时本地回退 | ✅ |
| 上传区界面与文件列表 | ✅（仅界面） |
| 响应式布局 | ✅ |
| 读取和解析资料内容 | ⬜ 第 3 周 |
| 基于资料的总结与出题 | ⬜ 第 3 周 |
| 对话历史保存 | ⬜ 第 4 周 |
| 完整深色模式 | ⬜ 后续完善 |
| 线上部署 | ⬜ 第 6 周 |

---

## 功能范围

### 前端

- 顶部导航、欢迎页、示例问题
- 用户消息与 AI 消息气泡
- 发送按钮状态管理
- `Enter` 发送，`Shift + Enter` 换行
- 中文输入法选词时按 `Enter` 不会误发送
- 输入框高度随内容自动调整
- “正在输入…”加载状态
- 真实 AI 回复与本地模拟回退
- 连接状态徽章：`AI 已连接` / `本地模拟`
- 上传区界面：
  - 点击选择或拖拽文件
  - 显示文件名、大小、类型
  - 文件计数
  - 重复文件提示并跳过
  - 不支持格式或超过 10MB 的文件提示并跳过
  - 移除已添加文件
- 桌面端双栏布局，窄屏自动切换为单栏

### 后端

- `GET /api/health` 健康检查
- `POST /api/chat` 聊天接口
- 从 `server/.env` 读取 OpenRouter Key
- 90 秒请求超时
- OpenRouter 错误状态转换
- CORS 中间件
- 自动生成接口文档 `/docs`

### 暂未实现

- 读取 TXT / Markdown / PDF 的内容
- 真正的资料总结与资料问答
- 自动生成复习题
- 多轮对话上下文
- 保存和查看历史对话
- 用户登录、鉴权、限流
- 流式输出
- 自动化测试与线上部署

---

## 技术栈

| 技术 | 用途 |
|---|---|
| HTML5 | 页面结构 |
| CSS3 | 布局、主题变量、响应式、动效 |
| 原生 JavaScript | 聊天交互、`fetch` 请求、本地回退 |
| Python 3.12 | 后端运行时 |
| FastAPI | 提供 `/api/health` 和 `/api/chat` |
| Uvicorn | 启动 FastAPI 服务 |
| httpx | 后端请求 OpenRouter |
| python-dotenv | 从 `.env` 读取配置 |
| OpenRouter | 提供真实 AI 模型调用 |
| SQLite | 计划第 4 周用于保存历史记录 |

---

## 目录结构

```text
studymate-ai/
├── index.html              # 页面结构
├── css/
│   └── style.css           # 样式、响应式、动效
├── js/
│   └── app.js              # 前端交互、调用后端、失败回退
├── server/
│   ├── main.py             # FastAPI 接口与 OpenRouter 调用
│   ├── requirements.txt    # Python 依赖
│   ├── .env.example        # 环境变量模板
│   └── .env                # 真实 Key，本地创建，不提交
├── .gitignore              # 忽略 .env、缓存和系统文件
├── .gitattributes          # 统一换行符
└── README.md               # 本文件
```

> `server/.env` 只存在于本地，不会出现在 Git 仓库中。

---

## 运行方式

### 环境要求

- Windows 10 / 11
- Python 3.10 或更高版本（开发时使用 Python 3.12）
- Chrome / Edge 等现代浏览器
- 一个 OpenRouter API Key

检查 Python：

```powershell
python --version
```

### 1. 安装后端依赖

```powershell
cd "$env:USERPROFILE\Desktop\studymate-ai"
python -m pip install -r server\requirements.txt
```

### 2. 配置 OpenRouter Key

第一次使用时，从模板复制一份 `.env`：

```powershell
Copy-Item server\.env.example server\.env
code server\.env
```

如果 `code` 命令不可用，直接在 VS Code 左侧资源管理器中打开 `server/.env`。

在 `server/.env` 中填写：

```text
OPENROUTER_API_KEY=你的真实Key
OPENROUTER_MODEL=openrouter/free
OPENROUTER_APP_NAME=StudyMate AI
OPENROUTER_SITE_URL=http://localhost:5500
```

注意：

- Key 只放在 `server/.env`
- 不要提交 `.env`
- 不要把 Key 写进前端代码、截图或 README

检查是否被 Git 忽略：

```powershell
git check-ignore -v server/.env
```

### 3. 启动后端

```powershell
cd "$env:USERPROFILE\Desktop\studymate-ai\server"
python -m uvicorn main:app --reload --port 8000
```

看到类似输出即可：

```text
Uvicorn running on http://127.0.0.1:8000
```

测试健康检查：

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

也可以打开接口文档：

```text
http://127.0.0.1:8000/docs
```

### 4. 启动前端

另开一个 PowerShell 窗口：

```powershell
cd "$env:USERPROFILE\Desktop\studymate-ai"
python -m http.server 5500
```

浏览器打开：

```text
http://localhost:5500
```

### 停止服务

分别回到两个终端，按 `Ctrl + C`。

> 只启动前端、不启动后端也可以打开页面，但发消息时会显示错误并回退到本地模拟回复。

---

## 请求流程

```text
浏览器（localhost:5500）
        │  POST /api/chat
        │  { "message": "什么是光合作用？" }
        ▼
FastAPI（127.0.0.1:8000）
        │  Authorization: Bearer <OPENROUTER_API_KEY>
        ▼
OpenRouter
        │  { "choices": [...] }
        ▼
FastAPI 取出回复文字
        │  { "reply": "...", "mock": false }
        ▼
浏览器显示 AI 气泡
```

API Key 只存在于后端和 OpenRouter 请求头中，浏览器看不到。

---

## 接口说明

### `GET /api/health`

检查后端是否正常。

响应：

```json
{
  "status": "ok",
  "provider": "openrouter",
  "model": "openrouter/free"
}
```

### `POST /api/chat`

请求：

```json
{
  "message": "什么是光合作用？"
}
```

成功响应：

```json
{
  "reply": "光合作用是植物...",
  "mock": false,
  "model": "openrouter/free"
}
```

### 常见状态码

| 状态码 | 含义 |
|---|---|
| 200 | 成功 |
| 400 | 消息为空 |
| 422 | JSON 格式错误或缺少 `message` |
| 500 | 后端没有配置 `OPENROUTER_API_KEY` |
| 502 | OpenRouter 认证失败、额度不足、限流、网络错误等 |

前端收到错误时，会把错误原因和本地模拟回复一起显示，不会一直转圈。

---

## 使用说明

1. 在输入框输入问题。
2. 按 `Enter` 或点击“发送”。
3. 页面显示“正在输入…”。
4. 后端请求 OpenRouter。
5. 成功后显示真实回复，徽章变为 `AI 已连接`。
6. 失败时显示错误原因，并回退到 `【本地模拟】` 回复，徽章变为 `本地模拟`。
7. 点击示例问题可以填入输入框。
8. 上传文件只会更新右侧列表，不会读取或上传内容。
9. 刷新页面会清空消息和文件列表。

---

## 测试清单

### 基础检查

- [ ] `python --version` 能显示 Python 3.10+
- [ ] `python -m pip install -r server\requirements.txt` 成功
- [ ] `server/.env` 存在，且 `git check-ignore -v server/.env` 有输出
- [ ] 后端能在 8000 端口启动
- [ ] `http://127.0.0.1:8000/docs` 能打开
- [ ] `GET /api/health` 返回 200

### 真实对话

- [ ] 前端能在 5500 端口打开
- [ ] 输入问题后发送按钮启用
- [ ] 发送后出现用户气泡
- [ ] 出现“正在输入…”
- [ ] 等待后出现真实 AI 回复
- [ ] 徽章显示 `AI 已连接`
- [ ] 回复内容不是 `【本地模拟】`
- [ ] 中文输入法选词时按 `Enter` 不会误发送
- [ ] `Shift + Enter` 只换行，不发送

### 错误与回退

- [ ] 空消息时发送按钮禁用
- [ ] 空消息通过接口请求时返回 400
- [ ] 停止后端后发送消息，页面不会崩溃
- [ ] 停止后端时显示错误原因
- [ ] 停止后端时显示本地模拟回复
- [ ] 停止后端时徽章变为 `本地模拟`
- [ ] 重启后端后，再发送可以恢复真实回复

### 上传区

- [ ] TXT / Markdown / PDF 文件可以加入列表
- [ ] 文件计数正确
- [ ] 重复文件被跳过
- [ ] 超过 10MB 或不支持的格式被跳过
- [ ] 点击 `×` 可以移除文件

### 界面与安全

- [ ] 900px 以下变成单栏，无横向滚动
- [ ] 刷新后恢复欢迎页
- [ ] 控制台没有红色报错
- [ ] `git status` 中看不到 `server/.env`
- [ ] 仓库中没有真实 API Key

---

## 已知限制

- **没有多轮上下文**：前端每次只发送当前这一条消息，之前的对话不会传给后端。
- **上传不解析**：只记录文件名、大小和扩展名，不读取内容。
- **没有历史记录**：刷新页面后消息全部丢失。
- **没有流式输出**：要等模型生成完整回复，页面才显示文字。
- **免费模型路由有波动**：`openrouter/free` 会随机选择免费模型，速度、质量和可用性可能变化。
- **CORS 仍是开发配置**：后端当前允许所有来源，上线前需要限制。
- **没有用户鉴权和限流**：不适合直接公开部署。
- **深色模式不完整**：只覆盖了一部分界面。
- **没有自动化测试**：当前按上面的手工清单验收。
- **未部署**：只能在本地运行。

---

## 安全说明

- API Key 只保存在 `server/.env`
- `.env` 已被 `.gitignore` 忽略
- 前端代码不包含 Key
- 浏览器只请求自己的后端 `/api/chat`
- 后端错误信息不会返回 Key
- 上传文件不会真正上传或读取

上线前还需要：

1. 把 CORS 从 `*` 改成实际域名
2. 增加用户鉴权和请求限流
3. 使用 HTTPS
4. 不要把 `.env` 打包进镜像或压缩包

---

## 常见问题

| 现象 | 检查 |
|---|---|
| 500 未配置 Key | `server/.env` 是否存在，变量名是否为 `OPENROUTER_API_KEY` |
| 502 认证失败 | Key 是否正确、是否过期 |
| 502 余额不足 | OpenRouter 免费额度是否用完 |
| 502 找不到模型 | `OPENROUTER_MODEL` 是否正确 |
| 502 请求过于频繁 | 稍后再试，免费路由有限流 |
| 502 无法连接 | 网络、代理或防火墙 |
| 前端提示无法连接后端 | 后端是否在 8000 端口启动 |
| 浏览器 CORS 报错 | 后端是否启动，CORS 中间件是否生效 |
| 改了 `.env` 没变化 | 重启 uvicorn，`.env` 不一定会触发 `--reload` |
| 8000 端口被占用 | 停止旧服务，或换端口并同步修改前端 `API_CHAT_URL` |

---

## 下一步

### 第 3 周：让 AI 读取学习资料

- 上传 TXT / Markdown 文件
- 后端读取文本内容
- 把资料内容加入提示词
- 生成结构化摘要
- 根据资料回答问题和生成复习题

### 第 4 周：历史记录

- 使用 SQLite 保存对话
- 查看和区分不同会话

### 第 5 周：完善产品

- 错误处理与边界测试
- 提示词优化
- 代码整理

### 第 6 周：部署与展示

- README 完善
- 部署或本地可复现运行
- 录制项目演示视频

---

## 开发记录

| 日期 | 内容 |
|---|---|
| 2026-10-31 | 完成 HTML / CSS / JavaScript 网页原型，本地模拟聊天 |
| 2026-11-04 | 补充 README，完成 Git 首次提交和 GitHub 首次推送 |
| 2026-11-05 | 创建 FastAPI 模拟后端，完成健康检查和固定回复 |
| 2026-11-07 | 切换 OpenRouter，接入真实 AI，前端增加失败回退 |

相关提交：

```text
3f7ea0d feat: connect frontend to FastAPI backend
c098223 feat: switch AI provider to OpenRouter
b686585 feat: add FastAPI mock backend
aa86088 feat: complete week 1 StudyMate AI prototype
```

---

## 反馈

这是一个学习中的项目。如果发现问题，欢迎记录：

- 复现步骤
- 预期结果
- 实际结果
- 浏览器和系统版本
