from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def migrate_schema(target_engine=engine):
    """
    Idempotent schema migration helper for SQLite databases.
    Adds newly defined columns to existing tables without data loss.
    """
    from sqlalchemy import inspect, text
    inspector = inspect(target_engine)
    existing_tables = inspector.get_table_names()

    with target_engine.connect() as conn:
        # 1. outcome_records columns
        if "outcome_records" in existing_tables:
            columns = [c["name"] for c in inspector.get_columns("outcome_records")]
            if "citizen_confirmation_status" not in columns:
                conn.execute(text("ALTER TABLE outcome_records ADD COLUMN citizen_confirmation_status VARCHAR(50) DEFAULT 'not_requested'"))
            if "citizen_confirmation_comment" not in columns:
                conn.execute(text("ALTER TABLE outcome_records ADD COLUMN citizen_confirmation_comment TEXT"))
            if "citizen_confirmed_at" not in columns:
                conn.execute(text("ALTER TABLE outcome_records ADD COLUMN citizen_confirmed_at DATETIME"))

        # 2. challenges columns
        if "challenges" in existing_tables:
            columns = [c["name"] for c in inspector.get_columns("challenges")]
            if "related_outcome_id" not in columns:
                conn.execute(text("ALTER TABLE challenges ADD COLUMN related_outcome_id INTEGER REFERENCES outcome_records(id)"))
            conn.execute(text("UPDATE challenges SET status = LOWER(status) WHERE status IS NOT NULL"))

        # 3. users columns
        if "users" in existing_tables:
            columns = [c["name"] for c in inspector.get_columns("users")]
            if "phone" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(50)"))
            # Set default phone for demo institutional users who have NULL phone
            conn.execute(text("UPDATE users SET phone = '+919876543210' WHERE phone IS NULL"))

        conn.commit()

