/* =========================================================
   StudyMate AI · 第 3 周前端交互
   目标：
   1. 发送消息并显示用户气泡
   2. 调用 FastAPI 后端，获取 OpenRouter 的真实回复
   3. 后端不可用时，自动回退到本地模拟回复
   4. 上传 TXT / Markdown 资料，并显示上传状态
   5. 上传成功后，可以一键总结当前资料
   说明：
   - 不把 API Key 写进前端
   - 文件发送到自己的后端，再由后端交给模型
   ========================================================= */

(() => {
  "use strict";

  /* ---------- 1. 获取页面元素 ---------- */
  const chatLog = document.getElementById("chat-log");
  const welcome = document.getElementById("welcome");
  const composer = document.getElementById("composer");
  const input = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const fileList = document.getElementById("file-list");
  const fileCount = document.getElementById("file-count");
  const uploadHint = document.querySelector(".upload-hint");
  const summarizeButton = document.getElementById("summarize-button");

  /* ---------- 2. 常量与状态 ---------- */
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_EXTENSIONS = [".txt", ".md", ".markdown"];
  const MAX_INPUT_HEIGHT = 160;

  // 本地后端地址；前端不接触 OpenRouter Key
  const API_CHAT_URL = "http://127.0.0.1:8000/api/chat";
  const API_MATERIALS_URL = "http://127.0.0.1:8000/api/materials";
  const REQUEST_TIMEOUT_MS = 95 * 1000; // 比后端 90 秒超时多留 5 秒

  const state = {
    isReplying: false,
    isUploading: false,
  };

  // 只在界面里记录文件信息，不保存文件内容
  let selectedFiles = [];
  let nextFileId = 0;
  let dragDepth = 0;
  let uploadNoticeTimer = null;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- 3. 通用工具函数 ---------- */
  function formatClock(date = new Date()) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function getExtension(fileName) {
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex === -1) return "";
    return fileName.slice(dotIndex).toLowerCase();
  }

  function shorten(text, maxLength = 60) {
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  }

  function scrollToBottom() {
    chatLog.scrollTo({
      top: chatLog.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  /* ---------- 4. 消息渲染 ---------- */

  // 创建一条消息的外壳：头像 + 内容容器
  function createMessageShell(role) {
    const message = document.createElement("div");
    message.className = `message message--${role}`;

    const avatar = document.createElement("span");
    avatar.className = "message-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = role === "user" ? "你" : "AI";

    const body = document.createElement("div");
    body.className = "message-body";

    message.append(avatar, body);
    return { message, body };
  }

  function hideWelcome() {
    // 注意：CSS 里 .welcome 设置了 display:flex，
    // 单靠 hidden 属性可能被样式覆盖，所以直接把节点移出页面。
    if (welcome.isConnected) {
      welcome.remove();
    }
  }

  function appendMessage(role, text) {
    const { message, body } = createMessageShell(role);

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    // 用 textContent 而不是 innerHTML：用户输入不会被当成 HTML 执行
    bubble.textContent = text;

    const meta = document.createElement("span");
    meta.className = "message-meta";
    meta.textContent =
      role === "user"
        ? `你 · ${formatClock()}`
        : `StudyMate AI · 演示回复 · ${formatClock()}`;

    body.append(bubble, meta);
    chatLog.append(message);
    scrollToBottom();
  }

  function showTyping() {
    const { message, body } = createMessageShell("ai");

    const bubble = document.createElement("div");
    bubble.className = "message-bubble message-bubble--typing";
    bubble.setAttribute("aria-label", "StudyMate AI 正在输入");

    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement("span");
      dot.className = "typing-dot";
      dot.setAttribute("aria-hidden", "true");
      bubble.append(dot);
    }

    const meta = document.createElement("span");
    meta.className = "message-meta";
    meta.textContent = "正在输入…";

    body.append(bubble, meta);
    chatLog.append(message);
    scrollToBottom();
    return message;
  }

  /* ---------- 5. 本地模拟回复（后端不可用时的兜底） ---------- */
  function buildMockReply(question) {
    if (/你好|hello|hi/i.test(question)) {
      return [
        "【本地模拟】你好，我是 StudyMate AI。",
        "",
        "当前没有连接上后端，所以我先用本地回复演示对话流程。",
        "你可以试试问我“帮我总结重点”或“出三道复习题”。",
      ].join("\n");
    }

    if (/总结|摘要|重点|概括/.test(question)) {
      return [
        "【本地模拟】这是资料总结的示例：",
        "",
        "1. 核心概念：先用自己的话复述主题，确认没有理解偏差。",
        "2. 关键细节：记录定义、使用条件和典型例子。",
        "3. 易混点：把相似概念放在一起对比，比单独背诵更有效。",
        "",
        "后端恢复后，这里会返回真实模型生成的摘要。",
      ].join("\n");
    }

    if (/复习|检验|测验|出题|问题/.test(question)) {
      return [
        "【本地模拟】先来 3 道示例复习题：",
        "",
        "1. 这份资料想解决的核心问题是什么？",
        "2. 哪两个概念最容易混淆？请说明它们的区别。",
        "3. 如果用自己的话向同学解释，你会怎么讲？",
        "",
        "后端恢复后，这里会根据资料内容生成题目和参考答案。",
      ].join("\n");
    }

    if (/解释|简单|通俗|看不懂|举例/.test(question)) {
      return [
        "【本地模拟】可以这样理解：",
        "",
        "把新知识想象成一张地图。先找到“主线概念”，再把它和已经会的内容连起来；",
        "孤立的知识点容易忘，有连接的知识点更容易被想起来。",
        "",
        "这是本地兜底解释；后端恢复后会由真实模型回答。",
      ].join("\n");
    }

    return [
      `【本地模拟】我收到了你的问题：“${shorten(question)}”`,
      "",
      "当前无法连接后端，所以先使用本地模拟回复。",
      "请确认 uvicorn 已在 8000 端口启动，然后重新发送。",
    ].join("\n");
  }

  /* ---------- 6. 发送流程 ---------- */
  function updateSendState() {
    const hasText = input.value.trim().length > 0;
    sendButton.disabled = !hasText || state.isReplying;
  }

  function autoResizeInput() {
    input.style.height = "auto";
    const nextHeight = Math.min(input.scrollHeight, MAX_INPUT_HEIGHT);
    input.style.height = `${nextHeight}px`;
    input.style.overflowY =
      input.scrollHeight > MAX_INPUT_HEIGHT ? "auto" : "hidden";
  }

  async function requestAIReply(message) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    try {
      const response = await fetch(API_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;

        if (data && typeof data.detail === "string") {
          detail = data.detail;
        } else if (data && Array.isArray(data.detail)) {
          detail = "请求格式不正确";
        }

        throw new Error(detail);
      }

      if (!data || typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("后端返回格式异常");
      }

      return data.reply.trim();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("请求超时，请稍后再试");
      }

      if (error instanceof TypeError) {
        throw new Error("无法连接后端，请确认 uvicorn 已在 8000 端口启动");
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function setModeBadge(online) {
    const badge = document.querySelector(".mode-badge");
    if (!badge) return;

    badge.replaceChildren();

    const dot = document.createElement("span");
    dot.className = "mode-dot";
    dot.setAttribute("aria-hidden", "true");

    badge.append(dot, document.createTextNode(online ? "AI 已连接" : "本地模拟"));
    badge.title = online
      ? "正在使用后端 AI 回复"
      : "后端不可用，当前使用本地模拟回复";
  }

  function buildFallbackReply(question, reason) {
    return [
      `⚠️ 无法获取真实回复：${reason}`,
      "",
      buildMockReply(question),
    ].join("\n");
  }

  async function sendMessage(rawText) {
    const text = rawText.trim();

    // 空消息或上一条还在回复时，直接忽略
    if (!text || state.isReplying) return;

    hideWelcome();
    appendMessage("user", text);

    input.value = "";
    autoResizeInput();

    state.isReplying = true;
    chatLog.setAttribute("aria-busy", "true");
    updateSendState();
    updateSummarizeState();

    const typingMessage = showTyping();

    try {
      const reply = await requestAIReply(text);

      typingMessage.remove();
      appendMessage("ai", reply);
      setModeBadge(true);
    } catch (error) {
      typingMessage.remove();

      const reason = error instanceof Error ? error.message : "未知错误";
      appendMessage("ai", buildFallbackReply(text, reason));
      setModeBadge(false);
    } finally {
      state.isReplying = false;
      chatLog.removeAttribute("aria-busy");
      updateSendState();
      updateSummarizeState();

      // 如果用户是用鼠标点的发送按钮，回复后把焦点还给输入框
      if (document.activeElement === sendButton) {
        input.focus();
      }
    }
  }

  /* ---------- 7. 输入框与示例问题 ---------- */
  composer.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });

  input.addEventListener("input", () => {
    autoResizeInput();
    updateSendState();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    // 中文输入法选词时按 Enter 不应该发送消息
    if (event.isComposing || event.keyCode === 229) return;

    // Shift + Enter 交给浏览器执行换行
    if (event.shiftKey) return;

    event.preventDefault();
    if (!sendButton.disabled) {
      sendMessage(input.value);
    }
  });

  document.querySelectorAll(".suggestion").forEach((button) => {
    button.addEventListener("click", () => {
      const question = button.dataset.question || button.textContent.trim();
      input.value = question;
      updateSendState();
      autoResizeInput();
      input.focus();
      input.setSelectionRange(question.length, question.length);
    });
  });

  /* ---------- 8. 资料上传区 ---------- */
  // 单独创建一行状态提示，用于上传中 / 成功 / 失败的反馈
  const uploadStatus = document.createElement("p");
  uploadStatus.className = "upload-hint";
  uploadStatus.setAttribute("role", "status");
  uploadStatus.setAttribute("aria-live", "polite");
  uploadStatus.hidden = true;
  uploadHint.after(uploadStatus);

  function showUploadNotice(message) {
    uploadStatus.textContent = message;
    uploadStatus.hidden = false;

    window.clearTimeout(uploadNoticeTimer);
    uploadNoticeTimer = window.setTimeout(() => {
      uploadStatus.hidden = true;
    }, 4000);
  }

  async function uploadMaterial(file) {
    const formData = new FormData();
    formData.append("file", file);

    // 不要手动设置 Content-Type，浏览器会自动生成 multipart 边界
    const response = await fetch(API_MATERIALS_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;

      if (data && typeof data.detail === "string") {
        detail = data.detail;
      } else if (data && Array.isArray(data.detail)) {
        detail = "文件格式不正确";
      }

      throw new Error(detail);
    }

    return data;
  }

  function updateSummarizeState() {
    const hasMaterial = selectedFiles.some(
      (file) => file.status === "uploaded"
    );

    summarizeButton.disabled = !hasMaterial || state.isReplying;
    summarizeButton.title = hasMaterial
      ? "根据当前资料生成总结"
      : "请先上传 TXT 或 Markdown 资料";

    const tag = document.querySelector(".tag");
    if (tag) {
      tag.textContent = hasMaterial ? "已加载" : "TXT / MD";
    }
  }

  async function removeMaterial(file) {
    if (file.status === "uploading") return;

    let warning = false;

    try {
      const response = await fetch(API_MATERIALS_URL, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      warning = true;
    }

    selectedFiles = [];
    renderFiles();

    showUploadNotice(
      warning
        ? `已从界面移除 ${file.name}，但后端资料可能仍然存在`
        : `已移除 ${file.name}`
    );
  }

  function renderFiles() {
    fileList.replaceChildren();
    fileCount.textContent = String(selectedFiles.length);

    if (selectedFiles.length === 0) {
      const empty = document.createElement("li");
      empty.className = "file-empty";
      empty.id = "file-empty";
      empty.textContent = "还没有资料。支持 TXT / Markdown。";
      fileList.append(empty);
      updateSummarizeState();
      return;
    }

    selectedFiles.forEach((file) => {
      const item = document.createElement("li");
      item.className = "file-item";
      item.title = file.error || file.name;

      const icon = document.createElement("span");
      icon.className = "file-item-icon";
      icon.textContent = file.extension;

      const info = document.createElement("div");
      info.className = "file-item-info";

      const name = document.createElement("span");
      name.className = "file-item-name";
      name.textContent = file.name;
      name.title = file.name;

      const size = document.createElement("span");
      size.className = "file-item-size";

      let statusText = "";
      if (file.status === "uploading") {
        statusText = "上传中…";
      } else if (file.status === "uploaded") {
        statusText = `已加载 · ${file.chars} 字`;
      } else if (file.status === "error") {
        statusText = "上传失败";
      }

      size.textContent = statusText
        ? `${formatFileSize(file.size)} · ${statusText}`
        : formatFileSize(file.size);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "file-item-remove";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", `移除 ${file.name}`);

      if (file.status === "uploading") {
        removeButton.disabled = true;
        removeButton.title = "上传中，请稍候";
      } else {
        removeButton.addEventListener("click", () => {
          removeMaterial(file);
        });
      }

      info.append(name, size);
      item.append(icon, info, removeButton);
      fileList.append(item);
    });

    updateSummarizeState();
  }

  async function addFiles(fileCollection) {
    const incoming = Array.from(fileCollection || []);
    if (incoming.length === 0) return;

    if (state.isUploading) {
      showUploadNotice("请等待当前文件上传完成");
      return;
    }

    if (incoming.length > 1) {
      showUploadNotice("目前一次只能上传一份资料，已使用第一个文件");
    }

    const file = incoming[0];
    const extension = getExtension(file.name);

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      showUploadNotice("目前只支持 TXT / Markdown 文件");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showUploadNotice("文件不能超过 10MB");
      return;
    }

    state.isUploading = true;

    // 先清空后端旧资料，避免新文件上传失败时继续使用旧资料
    if (selectedFiles.length > 0) {
      try {
        await fetch(API_MATERIALS_URL, { method: "DELETE" });
      } catch (error) {
        // 清空失败也继续尝试上传，成功时后端会覆盖旧资料
      }
    }

    selectedFiles = [
      {
        id: nextFileId,
        name: file.name,
        size: file.size,
        extension: extension.replace(".", "").toUpperCase(),
        status: "uploading",
      },
    ];
    nextFileId += 1;

    renderFiles();
    showUploadNotice("正在上传资料…");

    try {
      const result = await uploadMaterial(file);

      selectedFiles[0].status = "uploaded";
      selectedFiles[0].chars = result.chars;
      selectedFiles[0].encoding = result.encoding;

      showUploadNotice(`已加载 ${result.filename}，共 ${result.chars} 字`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "未知错误";
      selectedFiles[0].status = "error";
      selectedFiles[0].error = reason;
      showUploadNotice(`上传失败：${reason}`);
    } finally {
      state.isUploading = false;
      renderFiles();
    }
  }

  summarizeButton.addEventListener("click", () => {
    if (summarizeButton.disabled || state.isReplying) return;

    const prompt = "请根据当前资料总结 3-5 个重点，分点说明。";
    input.value = prompt;
    updateSendState();
    autoResizeInput();
    sendMessage(prompt);
  });

  fileInput.addEventListener("change", () => {
    addFiles(fileInput.files);
    // 清空 value，允许再次选择同一个文件
    fileInput.value = "";
  });

  // 拖拽进入 / 离开时切换高亮，拖动经过子元素时不会闪烁
  dropzone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dragDepth += 1;
    dropzone.classList.add("is-dragover");
  });

  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  });

  dropzone.addEventListener("dragleave", (event) => {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) {
      dropzone.classList.remove("is-dragover");
    }
  });

  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dragDepth = 0;
    dropzone.classList.remove("is-dragover");
    if (event.dataTransfer) {
      addFiles(event.dataTransfer.files);
    }
  });

  // 防止文件被拖到上传区以外时，浏览器直接打开文件
  window.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  window.addEventListener("drop", (event) => {
    event.preventDefault();
  });

  /* ---------- 9. 初始化 ---------- */
  fileInput.accept = ".txt,.md,.markdown";
  uploadHint.textContent =
    "支持 TXT、Markdown，单个文件不超过 10MB。资料只保存在后端内存中。";

  const panelNote = document.querySelector(".panel-note");
  if (panelNote) {
    panelNote.textContent = "资料只在本次会话中有效，重启后端后需要重新上传。";
  }

  updateSendState();
  updateSummarizeState();
  autoResizeInput();

  const composerNote = document.querySelector(".composer-note");
  if (composerNote) {
    composerNote.textContent =
      "回复由后端 AI 生成；后端不可用时自动回退到本地模拟。";
  }

  console.info(
    "StudyMate AI 已加载：聊天接口 /api/chat，资料接口 /api/materials。"
  );
})();
