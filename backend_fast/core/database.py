# core/database.py
import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to individual components if DATABASE_URL is not set
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_HOST = os.getenv("DB_HOST", "")
    DB_PORT = os.getenv("DB_PORT", "6543")
    DB_NAME = os.getenv("DB_NAME", "postgres")
    
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

logger.info(f"Database URL configured: {DATABASE_URL.split('@')[0]}@***")

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False  # Set to True for SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()

# Session model
class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    llm_provider = Column(String, default="deepseek")
    response_time_ms = Column(Integer, default=0)
    is_successful = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False)

    def __repr__(self):
        return f"<SessionModel(id={self.id}, user_id='{self.user_id}', question='{self.question[:50]}...')>"

# Dependency to get database session
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# Function to create tables
def create_tables():
    """Create all tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise

# Function to test database connection
def test_connection():
    """Test database connection"""
    try:
        db = SessionLocal()
        result = db.execute("SELECT 1").fetchone()
        db.close()
        logger.info("Database connection test successful")
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False

# Initialize database on import
if __name__ == "__main__":
    create_tables()
    test_connection()



# # core/database.py
# from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker
# from datetime import datetime
# from core.config import settings

# # Create engine based on database URL
# if settings.DATABASE_URL.startswith("postgresql://"):
#     # PostgreSQL configuration
#     engine = create_engine(
#         settings.DATABASE_URL + "?sslmode=require",
#         pool_pre_ping=True,
#         pool_recycle=300,
#         pool_size=10,
#         max_overflow=20
#     )
# elif settings.DATABASE_URL.startswith("sqlite://"):
#     # SQLite configuration
#     engine = create_engine(
#         settings.DATABASE_URL,
#         connect_args={"check_same_thread": False},
#         pool_pre_ping=True
#     )
# else:
#     # Default configuration
#     engine = create_engine(
#         settings.DATABASE_URL,
#         pool_pre_ping=True
#     )

# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()

# # Dependency to get database session
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # Define SessionModel (likely a SQLAlchemy model)
# class SessionModel(Base):
#     __tablename__ = "qa_sessions"
    
#     id = Column(Integer, primary_key=True, index=True)
#     session_id = Column(String, unique=True, index=True)
#     user_id = Column(String, index=True)
#     question = Column(Text)
#     answer = Column(Text)
#     created_at = Column(DateTime, default=datetime.utcnow)
#     updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
#     is_active = Column(Boolean, default=True)

# # Create tables
# try:
#     Base.metadata.create_all(bind=engine)
#     print("Database tables created successfully")
# except Exception as e:
#     print(f"Error creating database tables: {e}")
#     # Don't raise the error during import, let the app handle it
# # from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
# # from sqlalchemy.ext.declarative import declarative_base
# # from sqlalchemy.orm import sessionmaker, Session
# # from datetime import datetime
# # from core.config import settings

# # # Create engine
# # engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})

# # # Create session
# # SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# # # Create base class
# # Base = declarative_base()

# # # Session model (example)
# # class SessionModel(Base):
# #     __tablename__ = "sessions"
    
# #     id = Column(Integer, primary_key=True, index=True)
# #     session_id = Column(String, unique=True, index=True)
# #     user_id = Column(String, index=True)
# #     created_at = Column(DateTime, default=datetime.utcnow)
# #     updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# # # Create tables
# # Base.metadata.create_all(bind=engine)

# # # Dependency to get database session
# # def get_db():
# #     db = SessionLocal()
# #     try:
# #         yield db
# #     finally:
# #         db.close()



# # # from sqlalchemy import create_engine
# # # from sqlalchemy.ext.declarative import declarative_base
# # # from sqlalchemy.orm import sessionmaker
# # # from .config import settings

# # # engine = create_engine(
# # #     settings.DATABASE_URL,
# # #     connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
# # # )
# # # SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# # # Base = declarative_base()

# # # def get_db():
# # #     db = SessionLocal()
# # #     try:
# # #         yield db
# # #     finally:
# # #         db.close()