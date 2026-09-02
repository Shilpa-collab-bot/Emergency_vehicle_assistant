import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base,sessionmaker

env_path=Path(__file__).resolve().parent.parent/".env"
load_dotenv(env_path)

# Default to a local SQLite database so the app works without an external DB host.
# If DATABASE_URL is set in .env and points to a remote service, it will still be used.
def get_database_url():
    configured_url = os.getenv("DATABASE_URL")
    if configured_url and "supabase.co" not in configured_url:
        return configured_url

    db_path = Path(__file__).resolve().with_name("emergency_db.db")
    return f"sqlite:///{db_path.as_posix()}"

DATABASE_URL = get_database_url()
engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
