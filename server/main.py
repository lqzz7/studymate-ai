from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# 创建 FastAPI 应用实例
app = FastAPI()

# 配置跨域（允许你的前端网页访问这个后端）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有源访问（开发阶段用，上线要改）
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 定义前端发过来的请求格式（必须包含 message 字段）
class ChatRequest(BaseModel):
    message: str

# 接口 1：健康检查 (GET)
@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# 接口 2：模拟聊天 (POST)
@app.post("/api/chat")
def chat(request: ChatRequest):
    # 现在不接 DeepSeek，直接返回固定文字
    return {
        "reply": "这是后端的模拟回复",
        "mock": True
    }