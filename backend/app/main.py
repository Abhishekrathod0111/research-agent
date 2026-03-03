from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import research, history
from app.db.database import init_db
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://research-agent.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(research.router, prefix="/research", tags=["research"])
app.include_router(history.router, prefix="/research", tags=["history"])