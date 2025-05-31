from sqlalchemy.orm import Session
from core.database import get_db

# Database dependency
def get_database() -> Session:
    return next(get_db())