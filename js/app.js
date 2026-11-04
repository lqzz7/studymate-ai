/* =========================================================
   StudyMate AI · 第 1 周原型交互
   目标：
   1. 发送消息并显示用户气泡
   2. 用本地数据模拟 AI 回复
   3. 输入框、按钮、示例问题、上传区的界面交互
   说明：
   - 不调用任何真实 API
   - 不上传、不读取文件内容
   - 所有 AI 回复都标注为“演示回复”
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
  const ALLOWED_EXTENSIONS = [".txt", ".md", ".markdown", ".pdf"];
  const MAX_INPUT_HEIGHT = 160;

  const state = {
    isReplying: false,
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

  /* ---------- 5. 本地模拟回复 ---------- */
  function buildMockReply(question) {
    if (/你好|hello|hi/i.test(question)) {
      return [
        "【演示回复】你好，我是 StudyMate AI。",
        "",
        "现在还没有连接真实模型，但我可以演示对话流程。",
        "你可以试试问我“帮我总结重点”或“出三道复习题”。",
      ].join("\n");
    }

    if (/总结|摘要|重点|概括/.test(question)) {
      return [
        "【演示回复】这是模拟的资料总结效果：",
        "",
        "1. 核心概念：先用自己的话复述主题，确认没有理解偏差。",
        "2. 关键细节：记录定义、使用条件和典型例子。",
        "3. 易混点：把相似概念放在一起对比，比单独背诵更有效。",
        "",
        "接入真实 AI 后，这里会读取你上传的资料，并生成对应摘要。",
      ].join("\n");
    }

    if (/复习|检验|测验|出题|问题/.test(question)) {
      return [
        "【演示回复】先来 3 道模拟复习题：",
        "",
        "1. 这份资料想解决的核心问题是什么？",
        "2. 哪两个概念最容易混淆？请说明它们的区别。",
        "3. 如果用自己的话向同学解释，你会怎么讲？",
        "",
        "正式版会根据资料内容自动生成题目和参考答案。",
      ].join("\n");
    }

    if (/解释|简单|通俗|看不懂|举例/.test(question)) {
      return [
        "【演示回复】可以这样理解：",
        "",
        "把新知识想象成一张地图。先找到“主线概念”，再把它和已经会的内容连起来；",
        "孤立的知识点容易忘，有连接的知识点更容易被想起来。",
        "",
        "这只是模拟解释，真实回答会在接入 API 后由模型生成。",
      ].join("\n");
    }

    return [
      `【演示回复】我收到了你的问题：“${shorten(question)}”`,
      "",
      "当前是本地模拟模式，还没有连接真实 AI API。",
      "第 2 周我们会用后端接入 DeepSeek，让这里返回真正的回答。",
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

  function sendMessage(rawText) {
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

    const typingMessage = showTyping();

    // 700–1200ms 后再出现回复，模拟真实网络等待
    const delay = 700 + Math.round(Math.random() * 500);

    window.setTimeout(() => {
      typingMessage.remove();
      appendMessage("ai", buildMockReply(text));

      state.isReplying = false;
      chatLog.removeAttribute("aria-busy");
      updateSendState();

      // 如果用户是用鼠标点的发送按钮，回复后把焦点还给输入框
      if (document.activeElement === sendButton) {
        input.focus();
      }
    }, delay);
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

  /* ---------- 8. 资料上传区（仅界面） ---------- */
  // 单独创建一行状态提示，用于“已添加 / 已跳过”的反馈
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

  function renderFiles() {
    fileList.replaceChildren();
    fileCount.textContent = String(selectedFiles.length);

    if (selectedFiles.length === 0) {
      const empty = document.createElement("li");
      empty.className = "file-empty";
      empty.id = "file-empty";
      empty.textContent = "还没有资料。上传功能将在第 3 周接入。";
      fileList.append(empty);
      return;
    }

    selectedFiles.forEach((file) => {
      const item = document.createElement("li");
      item.className = "file-item";

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
      size.textContent = formatFileSize(file.size);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "file-item-remove";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", `移除 ${file.name}`);

      removeButton.addEventListener("click", () => {
        selectedFiles = selectedFiles.filter((itemFile) => itemFile.id !== file.id);
        renderFiles();
        showUploadNotice(`已从列表移除 ${file.name}`);
      });

      info.append(name, size);
      item.append(icon, info, removeButton);
      fileList.append(item);
    });
  }

  function addFiles(fileCollection) {
    const incoming = Array.from(fileCollection || []);
    if (incoming.length === 0) return;

    let added = 0;
    let rejected = 0;
    let duplicated = 0;

    incoming.forEach((file) => {
      const extension = getExtension(file.name);
      const allowed = ALLOWED_EXTENSIONS.includes(extension);
      const sizeAllowed = file.size <= MAX_FILE_SIZE;

      if (!allowed || !sizeAllowed) {
        rejected += 1;
        return;
      }

      const exists = selectedFiles.some(
        (item) => item.name === file.name && item.size === file.size
      );

      if (exists) {
        duplicated += 1;
        return;
      }

      selectedFiles.push({
        id: nextFileId,
        name: file.name,
        size: file.size,
        extension: extension.replace(".", "").toUpperCase(),
      });
      nextFileId += 1;
      added += 1;
    });

    renderFiles();

    const messages = [];
    if (added > 0) {
      messages.push(`已添加 ${added} 个文件（演示模式，不会上传）`);
    }
    if (duplicated > 0) {
      messages.push(`跳过 ${duplicated} 个重复文件`);
    }
    if (rejected > 0) {
      messages.push(`跳过 ${rejected} 个不支持或超过 10MB 的文件`);
    }
    if (messages.length > 0) {
      showUploadNotice(messages.join("；"));
    }
  }

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
  summarizeButton.title = "资料解析将在第 3 周接入";
  updateSendState();
  autoResizeInput();

  console.info("StudyMate AI 原型已加载：当前为本地模拟回复，未连接真实 API。");
})();
