import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 明确从 server/.env 读取配置，避免受启动目录影响
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

# 创建 FastAPI 应用实例
app = FastAPI(title="StudyMate AI API", version="0.1.0")

# 配置跨域（开发阶段允许所有来源，上线前应限制为实际前端地址）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 定义前端发过来的请求格式（必须包含 message 字段）
class ChatRequest(BaseModel):
    message: str


# 定义返回给前端的格式
class ChatResponse(BaseModel):
    reply: str
    mock: bool = False
    model: str


def get_api_key() -> str:
    """读取并检查 API Key，避免把 Key 写死在代码里。"""
    api_key = os.getenv("DEEPSEEK_API_KEY", "").strip()

    if not api_key or api_key == "your_key_here":
        raise HTTPException(
            status_code=500,
            detail="未配置 DEEPSEEK_API_KEY，请在 server/.env 中填写真实 Key",
        )

    return api_key


# 接口 1：健康检查 (GET)
@app.get("/api/health")
def health_check():
    return {"status": "ok", "model": DEEPSEEK_MODEL}


# 接口 2：真实 AI 聊天 (POST)
@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    message = request.message.strip()

    if not message:
        raise HTTPException(status_code=400, detail="消息不能为空")

    api_key = get_api_key()

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "你是 StudyMate AI，一个面向中文学习者的 AI 学习助手。"
                    "请用清晰、简洁的中文回答，必要时分点说明，"
                    "优先帮助用户理解概念、总结重点和生成复习题。"
                ),
            },
            {"role": "user", "content": message},
        ],
        "temperature": 0.7,
        "stream": False,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        # 60 秒超时，避免网络异常时请求一直挂着
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                DEEPSEEK_API_URL,
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        status_code = exc.response.status_code

        if status_code == 401:
            detail = "DeepSeek 认证失败，请检查 API Key 是否正确"
        elif status_code == 429:
            detail = "请求过于频繁或额度不足，请稍后再试"
        else:
            detail = f"DeepSeek 请求失败（HTTP {status_code}）"

        raise HTTPException(status_code=502, detail=detail) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail="无法连接 DeepSeek，请检查网络或代理设置",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail="DeepSeek 返回了无法解析的数据",
        ) from exc

    try:
        reply = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError, AttributeError) as exc:
        raise HTTPException(
            status_code=502,
            detail="DeepSeek 返回格式异常",
        ) from exc

    if not reply:
        raise HTTPException(status_code=502, detail="DeepSeek 返回了空回复")

    return ChatResponse(reply=reply, mock=False, model=DEEPSEEK_MODEL)
