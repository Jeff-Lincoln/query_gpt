from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from datetime import datetime
import os

Base = declarative_base()

class SessionModel(Base):
    __tablename__ = "qa_sessions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(255), nullable=False, index=True)  # Clerk user ID
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    llm_provider = Column(String(50), nullable=False, default="deepseek")
    response_time_ms = Column(Float, nullable=True)
    is_successful = Column(Boolean, nullable=False, default=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    
    # Add indexes for better query performance
    __table_args__ = (
        Index('idx_user_created', 'user_id', 'created_at'),
        Index('idx_user_successful', 'user_id', 'is_successful'),
    )
    
    def __repr__(self):
        return f"<SessionModel(id={self.id}, user_id='{self.user_id}', question='{self.question[:50]}...', created_at='{self.created_at}')>"

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.ssrswfufyrvyyakiyarr:7ugxacdF!pJ_4p6@aws-0-eu-central-1.pooler.supabase.com:5432/postgres")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def create_tables():
    """
    Create all database tables
    Call this when starting your application
    """
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

# Database utility functions
class DatabaseManager:
    @staticmethod
    def get_user_session_count(db, user_id: str) -> int:
        """Get total session count for a user"""
        return db.query(SessionModel).filter(SessionModel.user_id == user_id).count()
    
    @staticmethod
    def get_user_successful_sessions(db, user_id: str) -> int:
        """Get successful session count for a user"""
        return db.query(SessionModel).filter(
            SessionModel.user_id == user_id,
            SessionModel.is_successful == True
        ).count()
    
    @staticmethod
    def get_user_recent_sessions(db, user_id: str, limit: int = 10):
        """Get recent sessions for a user"""
        return db.query(SessionModel).filter(
            SessionModel.user_id == user_id
        ).order_by(SessionModel.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def cleanup_old_sessions(db, days_old: int = 30):
        """Clean up sessions older than specified days"""
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        deleted_count = db.query(SessionModel).filter(
            SessionModel.created_at < cutoff_date
        ).delete()
        db.commit()
        return deleted_count

# Migration helper (if you need to add user_id to existing table)
def migrate_add_user_id():
    """
    Migration script to add user_id column to existing sessions table
    Run this if you're updating an existing database
    """
    from sqlalchemy import text
    
    try:
        with engine.connect() as conn:
            # Check if user_id column exists
            result = conn.execute(text("PRAGMA table_info(qa_sessions)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'user_id' not in columns:
                # Add user_id column
                conn.execute(text("ALTER TABLE qa_sessions ADD COLUMN user_id VARCHAR(255)"))
                
                # Create index for user_id
                conn.execute(text("CREATE INDEX idx_user_id ON qa_sessions(user_id)"))
                conn.execute(text("CREATE INDEX idx_user_created ON qa_sessions(user_id, created_at)"))
                
                conn.commit()
                print("Migration completed: user_id column added")
            else:
                print("Migration not needed: user_id column already exists")
                
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    # Create tables when running this file directly
    create_tables()
