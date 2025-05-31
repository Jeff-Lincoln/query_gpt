from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="User question")
    
class QuestionResponse(BaseModel):
    id: int
    question: str
    answer: str
    llm_provider: str
    response_time_ms: Optional[int]
    created_at: datetime
    is_successful: bool
    
    class Config:
        from_attributes = True

class HistoryResponse(BaseModel):
    sessions: List[QuestionResponse]
    total: int
    page: int
    size: int