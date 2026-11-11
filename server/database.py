"""StudyMate AI 的 SQLite 数据访问层。

这一层只负责“怎么存、怎么读”，不负责聊天和调用 AI。
main.py 之后会调用这里的函数。
"""

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

# 数据库文件位置：server/studymate.db
# 这个文件会被 .gitignore 忽略，不提交到 Git
DB_PATH = Path(__file__).resolve().parent / "studymate.db"

VALID_ROLES = {"user", "assistant"}


@contextmanager
def get_connection():
    """打开数据库，用完自动提交并关闭。"""
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")

    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def utc_now() -> str:
    """返回 UTC 时间字符串，方便排序和显示。"""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def init_db() -> None:
    """创建会话表和消息表；已经存在时不会重复创建。"""
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (conversation_id)
                    REFERENCES conversations(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_messages_conversation
                ON messages(conversation_id, id);
            """
        )


def create_conversation(title: str) -> int:
    """新建一个会话，返回会话 id。"""
    clean_title = (title or "").strip()[:60] or "新对话"
    now = utc_now()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO conversations (title, created_at, updated_at)
            VALUES (?, ?, ?)
            """,
            (clean_title, now, now),
        )
        return int(cursor.lastrowid)


def save_message(conversation_id: int, role: str, content: str) -> int:
    """保存一条消息，并更新所属会话的最后更新时间。"""
    if role not in VALID_ROLES:
        raise ValueError("role 必须是 user 或 assistant")

    clean_content = (content or "").strip()
    if not clean_content:
        raise ValueError("消息内容不能为空")

    now = utc_now()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO messages (conversation_id, role, content, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (conversation_id, role, clean_content, now),
        )

        connection.execute(
            "UPDATE conversations SET updated_at = ? WHERE id = ?",
            (now, conversation_id),
        )

        return int(cursor.lastrowid)


def get_messages(conversation_id: int, limit: int = 10) -> list[dict]:
    """读取会话最近的消息，按时间从旧到新返回。"""
    safe_limit = max(1, min(int(limit), 50))

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT role, content, created_at
            FROM messages
            WHERE conversation_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (conversation_id, safe_limit),
        ).fetchall()

    # SQL 取的是“最近 N 条”，倒序后再翻回来，才是正常聊天顺序
    return [dict(row) for row in reversed(rows)]


def list_conversations() -> list[dict]:
    """列出所有会话，并附带每个会话的消息数量。"""
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                c.id,
                c.title,
                c.created_at,
                c.updated_at,
                COUNT(m.id) AS message_count
            FROM conversations AS c
            LEFT JOIN messages AS m ON m.conversation_id = c.id
            GROUP BY c.id, c.title, c.created_at, c.updated_at
            ORDER BY c.updated_at DESC
            """
        ).fetchall()

    return [dict(row) for row in rows]


def get_conversation(conversation_id: int) -> dict | None:
    """按 id 查一个会话；不存在时返回 None。"""
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, title, created_at, updated_at
            FROM conversations
            WHERE id = ?
            """,
            (conversation_id,),
        ).fetchone()

    return dict(row) if row else None
