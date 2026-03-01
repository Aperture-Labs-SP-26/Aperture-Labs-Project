import os
import uuid
import pytest

# Set env vars before any app imports so pydantic-settings
# can load them when config.py is first imported
os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5433/appdb_test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("MINIO_ENDPOINT", "localhost:9000")
os.environ.setdefault("MINIO_ACCESS_KEY", "minioadmin")
os.environ.setdefault("MINIO_SECRET_KEY", "minioadmin")
os.environ.setdefault("MINIO_USE_SSL", "false")
os.environ.setdefault("DETECTION_WEBHOOK_SECRET", "test-webhook-secret")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from main import app
from db.models import Base
from db.session import get_db


# -------------------------
# Test Database Setup
# -------------------------

TEST_DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables once for the entire test session, drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clear_tables():
    """Truncate all tables before each test so every test starts clean."""
    yield
    with engine.begin() as conn:
        conn.execute(text(
            "TRUNCATE TABLE anomalies, submissions, project_members, projects, users RESTART IDENTITY CASCADE"
        ))


@pytest.fixture
def db():
    """Plain database session — tables are cleared by clear_tables fixture."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    """FastAPI TestClient with get_db overridden to use the test session."""
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()