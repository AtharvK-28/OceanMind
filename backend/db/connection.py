"""
OceanMind — Database connection manager.
Reads config from .env; exposes get_db() for FastAPI dependency injection.
"""
import os
from contextlib import contextmanager
from typing import Generator

import psycopg
from psycopg.rows import dict_row
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from loguru import logger

load_dotenv()

# ── Connection string ──────────────────────────────────────────────────────────
def _build_url() -> str:
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db   = os.getenv("POSTGRES_DB",   "oceanmind")
    user = os.getenv("POSTGRES_USER", "postgres")
    pwd  = os.getenv("POSTGRES_PASSWORD", "")
    return f"postgresql://{user}:{pwd}@{host}:{port}/{db}"

DATABASE_URL = _build_url()

# ── SQLAlchemy engine ──────────────────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL.replace("postgresql://", "postgresql+psycopg://"),
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,       # reconnects on stale connections
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── FastAPI dependency ─────────────────────────────────────────────────────────
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Raw psycopg2 for geo queries ───────────────────────────────────────────────
@contextmanager
def get_raw_conn():
    """Use for raw PostGIS queries that need dict_row."""
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    try:
        yield conn
    finally:
        conn.close()

# ── Health check ───────────────────────────────────────────────────────────────
def check_db_connection() -> bool:
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT PostGIS_Version();"))
            version = result.scalar()
            logger.info(f"PostGIS connected: {version}")
            return True
    except Exception as e:
        logger.error(f"DB connection failed: {e}")
        return False

def init_schema(schema_path: str = None) -> None:
    """Run schema.sql to create all tables if they don't exist."""
    if schema_path is None:
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r") as f:
        sql = f.read()
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
    logger.info("Schema initialised successfully.")
