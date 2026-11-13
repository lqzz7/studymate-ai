# StudyMate AI

一个面向学习场景的 AI 学习资料助手。

当前是 **第 4 周版本（v0.4）**：网页已经接入 FastAPI、OpenRouter 和 SQLite；可以上传 TXT / Markdown 资料，让 AI 依据资料回答和总结；对话会保存到本地数据库，并支持多轮上下文与历史会话切换。后端不可用时会自动回退到本地模拟回复。

- 最后更新：2026-11-13
- 运行方式：本地前端 + 本地后端
- 技术栈：HTML5 / CSS3 / 原生 JavaScript / Python / FastAPI / OpenRouter

---

## 项目简介

StudyMate AI 的目标是帮助学习者完成三件事：

1. 上传一份学习资料
2. 让 AI 总结重点并依据资料回答问题
3. 根据资料生成复习题

目前已经完成“真实 AI 对话”“TXT / Markdown 资料问答”和“多轮对话 + SQLite 历史记录”三层。PDF 解析、用户鉴权和线上部署会在后续阶段加入。

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
| TXT / Markdown 上传与文本提取 | ✅ |
| 后端只保留一份当前资料 | ✅ |
| 基于资料回答与总结 | ✅ |
| 刷新页面后恢复资料状态 | ✅ |
| 上传区界面与文件列表 | ✅ |
| 多轮对话上下文 | ✅ |
| SQLite 对话保存 | ✅ |
| 历史会话列表与切换 | ✅ |
| 刷新页面后恢复最近会话 | ✅ |
| 删除 / 重命名会话 | ⬜ 后续 |
| PDF 解析 | ⬜ 后续 |
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
- AI 回复支持 Markdown：标题、加粗、列表、引用、行内代码、代码块
- 连接状态徽章：`AI 已连接` / `本地模拟`
- 资料上传：
  - 点击选择或拖拽 TXT / Markdown
  - 真正上传到后端
  - 显示上传中 / 已加载 / 失败状态
  - 一次只保留一份当前资料
  - 超过 10MB 或不支持的格式会提示
  - 移除文件时同时清空后端资料
  - 刷新页面后恢复后端当前资料
- 资料总结：上传成功后启用“总结资料重点”按钮
- 历史会话：
  - 顶部下拉框列出历史会话和消息数量
  - 点击“＋ 新对话”从空白开始
  - 切换会话时加载对应消息
  - 刷新页面自动恢复最近一次会话
  - AI 回复期间禁用切换，避免状态错乱
- 桌面端双栏布局，窄屏自动切换为单栏

### 后端

- `GET /api/health` 健康检查
- `POST /api/materials` 上传并提取 TXT / Markdown 文本
- `GET /api/materials` 查询当前资料
- `DELETE /api/materials` 清空当前资料
- `POST /api/chat` 聊天接口，自动带上当前资料和最近 10 条历史消息
- `GET /api/conversations` 历史会话列表
- `GET /api/conversations/{id}/messages` 某个会话的消息
- 使用 SQLite 保存会话和消息
- 从 `server/.env` 读取 OpenRouter Key
- 90 秒请求超时
- OpenRouter 错误状态转换
- CORS 中间件
- 自动生成接口文档 `/docs`

### 暂未实现

- 删除 / 重命名历史会话
- 历史消息分页（目前只显示最近 50 条）
- 多文件资料库
- 独立的“生成复习题”按钮（目前可通过聊天提问）
- PDF 解析
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
| FastAPI | 提供聊天和资料接口 |
| Uvicorn | 启动 FastAPI 服务 |
| httpx | 后端请求 OpenRouter |
| python-dotenv | 从 `.env` 读取配置 |
| python-multipart | 解析上传文件的 `multipart/form-data` |
| marked | 把 AI 回复中的 Markdown 转成 HTML |
| DOMPurify | 清理 AI 输出，移除危险标签和属性 |
| OpenRouter | 提供真实 AI 模型调用 |
| SQLite | 本地保存会话和消息，刷新/重启后仍可读取 |

---

## 目录结构

```text
studymate-ai/
├── index.html              # 页面结构
├── css/
│   └── style.css           # 样式、响应式、动效
├── js/
│   ├── app.js              # 前端交互、调用后端、失败回退
│   └── vendor/
│       ├── marked.min.js   # Markdown 转 HTML
│       └── purify.min.js   # 清理危险 HTML
├── server/
│   ├── main.py             # 聊天、资料接口与 OpenRouter 调用
│   ├── database.py         # SQLite 会话和消息操作
│   ├── requirements.txt    # Python 依赖
│   ├── .env.example        # 环境变量模板
│   ├── .env                # 真实 Key，本地创建，不提交
│   └── studymate.db        # 本地数据库，自动生成，不提交
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

### 上传资料

```text
浏览器选择 TXT / Markdown
        │  POST /api/materials（multipart/form-data）
        ▼
FastAPI 检查格式和大小 → 解码文本 → 保存到内存 active_material
        │
        ▼
返回文件名、字数、编码和预览
```

### 聊天

```text
浏览器（localhost:5500）
        │  POST /api/chat
        │  { "message": "...", "conversation_id": 1 }
        ▼
FastAPI（127.0.0.1:8000）
        │  没有 conversation_id 就准备新建会话
        │  有编号就检查会话是否存在
        ▼
从 SQLite 读取最近 10 条消息
        │
        ▼
系统提示词（含当前资料）+ 历史消息 + 当前问题
        │  Authorization: Bearer <OPENROUTER_API_KEY>
        ▼
OpenRouter
        │  { "choices": [...] }
        ▼
FastAPI 取出回复文字
        │
        ├─ 保存用户消息到 SQLite
        ├─ 保存 AI 回复到 SQLite
        │
        ▼
{ "reply": "...", "conversation_id": 1, "used_material": true }
        │
        ▼
浏览器显示 AI 气泡
```

### 历史会话

```text
GET /api/conversations
        ▼
SQLite 查询所有会话和消息数量
        ▼
前端填充历史下拉框

GET /api/conversations/{id}/messages
        ▼
读取某个会话最近 50 条消息
        ▼
前端重新渲染历史聊天
```

API Key 只存在于后端和 OpenRouter 请求头中，浏览器看不到。

上传的资料会随聊天请求发送给 OpenRouter 和模型提供方。

---

## 接口说明

### `GET /api/health`

检查后端是否正常。

响应：

```json
{
  "status": "ok",
  "provider": "openrouter",
  "model": "openrouter/free",
  "material_loaded": false
}
```

### `POST /api/materials`

上传资料，使用 `multipart/form-data`，字段名 `file`。

只支持 `.txt`、`.md`、`.markdown`，最大 10MB。

成功响应：

```json
{
  "filename": "notes.md",
  "chars": 128,
  "size": 256,
  "encoding": "utf-8",
  "preview": "资料开头的一小段内容",
  "active": true
}
```

### `GET /api/materials`

查询当前资料。

没有资料时：

```json
{ "active": false }
```

有资料时返回文件名、字数、大小、编码和预览。

### `DELETE /api/materials`

清空当前资料：

```json
{ "active": false }
```

### `POST /api/chat`

请求：

```json
{
  "message": "什么是光合作用？",
  "conversation_id": 1
}
```

`conversation_id` 可以省略。省略时后端会新建会话。

成功响应：

```json
{
  "reply": "光合作用是植物...",
  "mock": false,
  "model": "openrouter/free",
  "used_material": true,
  "conversation_id": 1
}
```

`used_material` 表示这次回答是否使用了当前资料。

`conversation_id` 要保存到前端，下一次提问继续使用。

### `GET /api/conversations`

返回所有历史会话，按最后更新时间倒序：

```json
[
  {
    "id": 1,
    "title": "光合作用复习",
    "created_at": "2026-11-13T08:00:00+00:00",
    "updated_at": "2026-11-13T08:10:00+00:00",
    "message_count": 4
  }
]
```

### `GET /api/conversations/{id}/messages`

返回某个会话的标题和最近 50 条消息：

```json
{
  "conversation_id": 1,
  "title": "光合作用复习",
  "messages": [
    {
      "role": "user",
      "content": "光合作用发生在哪里？",
      "created_at": "2026-11-13T08:00:00+00:00"
    }
  ]
}
```

会话不存在时返回 `404`。

### 常见状态码

| 状态码 | 含义 |
|---|---|
| 200 | 成功 |
| 400 | 消息为空，或资料内容为空 |
| 413 | 上传文件超过 10MB |
| 415 | 上传了不支持的文件格式 |
| 404 | 指定的会话不存在 |
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
8. 在右侧上传 TXT / Markdown，后端会读取文字并保存为当前资料。
9. 上传成功后可以点击“总结资料重点”，或直接在聊天中提问。
10. 点击文件右侧的 `×` 会同时清空后端资料。
11. 刷新页面后，前端会向后端查询并恢复当前资料。
12. 连续提问会继续使用同一个 `conversation_id`，AI 能接上上下文。
13. 顶部下拉框可以查看并切换历史会话。
14. 点击“＋ 新对话”会清空聊天区，下一次提问创建新会话。
15. 刷新页面后，会自动加载最近一次会话及其消息。
16. 会话和消息保存在 `server/studymate.db`，重启后端不会丢失。

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

### 多轮对话与历史记录

- [ ] 第一次提问后返回 `conversation_id`
- [ ] 第二次提问的请求里带上同一个 `conversation_id`
- [ ] 追问“它还需要什么”能接上上一轮
- [ ] 顶部下拉框显示历史会话和消息数量
- [ ] 切换会话后显示对应消息
- [ ] 点击“＋ 新对话”清空聊天区并恢复欢迎页
- [ ] 刷新页面后自动加载最近一次会话
- [ ] 重启后端后历史记录仍然存在
- [ ] 请求不存在的会话返回 404

### 错误与回退

- [ ] 空消息时发送按钮禁用
- [ ] 空消息通过接口请求时返回 400
- [ ] 停止后端后发送消息，页面不会崩溃
- [ ] 停止后端时显示错误原因
- [ ] 停止后端时显示本地模拟回复
- [ ] 停止后端时徽章变为 `本地模拟`
- [ ] 重启后端后，再发送可以恢复真实回复

### 资料上传与问答

- [ ] TXT / Markdown 文件可以上传成功
- [ ] 上传时显示“上传中…”
- [ ] 上传成功后显示“已加载 · xx 字”
- [ ] 上传成功后“总结资料重点”按钮启用
- [ ] 上传 PDF 会提示只支持 TXT / Markdown
- [ ] 超过 10MB 的文件会被拒绝
- [ ] 问资料里有的内容，回答有依据
- [ ] 问资料里没有的内容，回答“资料中未提及”
- [ ] 点击“总结资料重点”能得到分点总结
- [ ] 刷新页面后资料列表能恢复
- [ ] 点击 `×` 后后端资料被清空
- [ ] 清空后刷新页面，列表保持空状态
- [ ] 重启后端后刷新页面，列表回到空状态

### 界面与安全

- [ ] 900px 以下变成单栏，无横向滚动
- [ ] AI 回复中的加粗、列表、代码块正常显示
- [ ] AI 返回 `<script>` 或 `<img onerror>` 时不会执行或显示
- [ ] 用户输入 `<b>测试</b>` 时只显示文字，不生成 HTML
- [ ] 刷新后恢复最近会话；没有历史时显示欢迎页，资料列表按后端状态恢复
- [ ] 控制台没有红色报错
- [ ] `git status` 中看不到 `server/.env`
- [ ] 仓库中没有真实 API Key

---

## 已知限制

- **只支持 TXT / Markdown**：PDF、Word 等格式暂不解析。
- **同时只有一份资料**：上传新文件会替换旧资料，所有会话共用这份资料。
- **资料只在内存中**：重启后端后需要重新上传；前端刷新会从后端恢复当前资料。
- **资料会发送给模型提供方**：提问时当前资料会进入 OpenRouter 请求，敏感资料不要上传。
- **提示词约束不是绝对安全**：模型仍可能忽略“资料中未提及”的要求；资料内的指令也可能造成提示词注入。
- **历史消息只显示最近 50 条**：暂时没有分页。
- **不能删除或重命名会话**：目前只能新建和切换。
- **多标签页不会实时同步**：一个标签页新增消息，另一个标签页需要刷新才能看到。
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
- 浏览器只请求自己的后端 `/api/chat` 和 `/api/materials`
- 后端错误信息不会返回 Key
- 上传文件只读取文本，不写入磁盘；但资料会随聊天请求发送给 OpenRouter
- AI 回复的 Markdown 会先经过 DOMPurify 清理，再写入页面
- 用户自己输入的内容始终按纯文本显示，不会被当成 HTML 或 Markdown
- `server/studymate.db` 被 `.gitignore` 忽略，数据库不提交
- 数据库中只保存会话和消息，不保存 API Key

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

### 第 5 周：完善产品

- PDF / Word 等更多资料格式
- 删除 / 重命名历史会话
- 历史消息分页
- 独立“生成复习题”按钮
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
| 2026-11-08 | 增加资料上传接口，支持 TXT / Markdown 文本提取与 GBK 解码 |
| 2026-11-09 | 资料写入聊天提示词，前端真正上传文件并支持总结按钮 |
| 2026-11-10 | 刷新页面恢复当前资料，同步静态文案 |
| 2026-11-10 | AI 回复支持安全的 Markdown 渲染（marked + DOMPurify） |
| 2026-11-11 | 增加 SQLite 数据层，聊天保存消息并支持多轮上下文 |
| 2026-11-13 | 增加历史会话接口和前端历史界面，刷新恢复最近会话 |

相关提交：

```text
67ad593 feat: add conversation history UI
bd533eb feat: keep conversation id across messages
ed39eb6 feat: add conversation history endpoints
22ad497 feat: persist conversations and add chat context
9185884 feat: add SQLite conversation storage
6c42456 feat: render AI replies as sanitized markdown
8765878 chore: sync static UI copy with material upload
b1fce59 feat: restore active material on page load
aaf559d feat: upload materials from frontend
687594b feat: use uploaded material in chat prompt
7f18bb4 feat: add text material upload API
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
