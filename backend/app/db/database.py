import aiosqlite
import json
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "research_history.db"

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS research_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                plan TEXT,
                final_report TEXT,
                approved INTEGER,
                critique TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()

async def save_research(query, plan, final_report, approved, critique):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO research_history (query, plan, final_report, approved, critique)
            VALUES (?, ?, ?, ?, ?)
        """, (query, plan, final_report, 1 if approved else 0, critique))
        await db.commit()

async def get_history(limit=20):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT id, query, plan, final_report, approved, critique, created_at
            FROM research_history
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]