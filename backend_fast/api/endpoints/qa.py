from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging
import jwt
import httpx
import os
from datetime import datetime
from sqlalchemy.orm import Session
from core.database import get_db, SessionModel
from services.llm_service import llm_service
from dotenv import load_dotenv


# Set up logging
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

load_dotenv(".env")

# Pydantic models
class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000, description="The question to ask the LLM")
    llm_provider: str = Field(default="deepseek", description="LLM provider to use")

class QuestionResponse(BaseModel):
    answer: str
    response_time_ms: int
    is_successful: bool = True
    error_message: Optional[str] = ""
    session_id: Optional[int] = None

class SessionResponse(BaseModel):
    id: int
    question: str
    answer: str
    llm_provider: str
    response_time_ms: int
    created_at: str
    is_successful: bool

class HistoryResponse(BaseModel):
    sessions: List[SessionResponse]
    total: int
    page: int
    size: int

class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: float
    llm_service_status: Dict[str, Any]

class DeleteResponse(BaseModel):
    message: str
    deleted_count: Optional[int] = None

# Enhanced Clerk JWT verification with proper security
async def verify_clerk_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Verify Clerk JWT token and return user ID with proper security
    """
    if not credentials:
        logger.error("No authentication credentials provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token = credentials.credentials
    logger.info(f"Received token: {token[:20]}..." if len(token) > 20 else f"Received token: {token}")
    
    # Get environment variables
    clerk_secret_key = os.getenv('CLERK_SECRET_KEY')
    environment = os.getenv('ENVIRONMENT', 'development')
    
    # For development with Clerk setup
    if environment == 'development':
        logger.info("Running in development mode with authentication")
        
        # Option 1: If you have Clerk Secret Key, verify properly
        if clerk_secret_key:
            try:
                logger.info("Attempting Clerk API verification...")
                async with httpx.AsyncClient(timeout=10.0) as client:
                    # Verify session with Clerk
                    response = await client.get(
                        f"https://api.clerk.com/v1/sessions/{token}",
                        headers={"Authorization": f"Bearer {clerk_secret_key}"}
                    )
                    
                    if response.status_code == 200:
                        session_data = response.json()
                        user_id = session_data.get("user_id")
                        if user_id:
                            logger.info(f"Successfully verified user: {user_id}")
                            return user_id
                    else:
                        logger.warning(f"Clerk API returned status: {response.status_code}")
                        
            except httpx.TimeoutException:
                logger.error("Clerk API request timed out")
            except Exception as e:
                logger.error(f"Clerk API verification failed: {e}")
        
        # Option 2: Development JWT decode (if token is a JWT)
        try:
            logger.info("Attempting JWT decode...")
            # First check if it looks like a JWT
            if token.count('.') == 2:
                payload = jwt.decode(token, options={"verify_signature": False})
                user_id = payload.get("sub") or payload.get("user_id") or payload.get("userId")
                if user_id:
                    logger.info(f"JWT decoded successfully for user: {user_id}")
                    return user_id
                else:
                    logger.error("No user ID found in JWT payload")
                    logger.info(f"JWT payload keys: {list(payload.keys())}")
            else:
                logger.info("Token doesn't appear to be a JWT, treating as session token")
                
        except jwt.InvalidTokenError as e:
            logger.error(f"JWT decode error: {e}")
        except Exception as e:
            logger.error(f"Unexpected JWT error: {e}")
    
    # Production mode - strict verification
    elif clerk_secret_key:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"https://api.clerk.com/v1/sessions/verify",
                    headers={"Authorization": f"Bearer {clerk_secret_key}"},
                        json={"token": token}
                )
                
                if response.status_code == 200:
                    session_data = response.json()
                    user_id = session_data.get("user_id")
                    if user_id:
                        return user_id
                        
        except Exception as e:
            logger.error(f"Production Clerk verification failed: {e}")
    
    # If we get here, authentication failed
    logger.error("Authentication failed - invalid or expired token")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )

# Optional authentication helper
async def optional_auth(request: Request) -> Optional[str]:
    """
    Optional authentication - returns user_id if authenticated, None otherwise
    """
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        return await verify_clerk_token(credentials)
    except HTTPException:
        return None
    except Exception as e:
        logger.debug(f"Optional auth failed: {e}")
        return None

# Initialize router
router = APIRouter(prefix="/api/v1", tags=["QA"])

@router.post("/qa/ask", response_model=QuestionResponse)
async def ask_question(
    request: QuestionRequest,
    user_id: str = Depends(verify_clerk_token),
    db: Session = Depends(get_db)
):
    """
    Ask a question to the LLM and store the session for the authenticated user
    """
    try:
        logger.info(f"Question received from user {user_id}: {request.question[:50]}...")
        
        # Validate input
        if not request.question.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question cannot be empty"
            )
        
        # Get answer from LLM service
        start_time = datetime.utcnow()
        try:
            answer, response_time, is_successful, error_message = await llm_service.get_answer(
                question=request.question,
                user_id=user_id,
                llm_provider=request.llm_provider
            )
        except Exception as llm_error:
            logger.error(f"LLM service error: {llm_error}")
            answer = "I apologize, but I encountered an error processing your question."
            response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            is_successful = False
            error_message = str(llm_error)
        
        # Store the session in database
        session_id = None
        try:
            session = SessionModel(
                user_id=user_id,
                question=request.question,
                answer=answer,
                response_time_ms=response_time,
                is_successful=is_successful,
                error_message=error_message if not is_successful else None,
                created_at=datetime.utcnow()
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            session_id = session.id
            
            logger.info(f"Session {session_id} created for user {user_id}")
            
        except Exception as db_error:
            logger.error(f"Database error for user {user_id}: {str(db_error)}")
            db.rollback()
            # Continue without storing - the user still gets their answer
        
        return QuestionResponse(
            answer=answer,
            response_time_ms=response_time,
            is_successful=is_successful,
            error_message=error_message if not is_successful else "",
            session_id=session_id
        )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing question for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process question. Please try again."
        )

@router.get("/qa/history", response_model=HistoryResponse)
async def get_user_history(
    page: int = 1,
    size: int = 50,
    user_id: str = Depends(verify_clerk_token),
    db: Session = Depends(get_db)
):
    """
    Get conversation history for the authenticated user with pagination
    """
    try:
        # Validate and sanitize pagination parameters
        page = max(1, page)
        size = max(1, min(100, size))  # Limit to prevent abuse
        offset = (page - 1) * size
        
        # Query sessions for the specific user
        query = db.query(SessionModel).filter(SessionModel.user_id == user_id)
        total = query.count()
        
        sessions = (query
                   .order_by(SessionModel.created_at.desc())
                   .offset(offset)
                   .limit(size)
                   .all())
        
        # Convert to response format
        sessions_data = []
        for session in sessions:
            sessions_data.append(SessionResponse(
                id=session.id,
                question=session.question,
                answer=session.answer,
                llm_provider=session.llm_provider or "deepseek",
                response_time_ms=session.response_time_ms,
                is_successful=session.is_successful,
                created_at=session.created_at.isoformat() if session.created_at else datetime.utcnow().isoformat()
            ))
        
        logger.info(f"Retrieved {len(sessions_data)} sessions for user {user_id} (page {page}, total: {total})")
        
        return HistoryResponse(
            sessions=sessions_data,
            total=total,
            page=page,
            size=size
        )
        
    except Exception as e:
        logger.error(f"Error retrieving history for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation history"
        )

@router.delete("/qa/history/{session_id}", response_model=DeleteResponse)
async def delete_session(
    session_id: int,
    user_id: str = Depends(verify_clerk_token),
    db: Session = Depends(get_db)
):
    """
    Delete a specific session for the authenticated user
    """
    try:
        # Validate session_id
        if session_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session ID"
            )
        
        session = db.query(SessionModel).filter(
            SessionModel.id == session_id,
            SessionModel.user_id == user_id
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )
        
        db.delete(session)
        db.commit()
        
        logger.info(f"Session {session_id} deleted by user {user_id}")
        return DeleteResponse(message="Session deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session {session_id} for user {user_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete session"
        )

@router.delete("/qa/history", response_model=DeleteResponse)
async def clear_user_history(
    user_id: str = Depends(verify_clerk_token),
    db: Session = Depends(get_db)
):
    """
    Clear all conversation history for the authenticated user
    """
    try:
        deleted_count = db.query(SessionModel).filter(SessionModel.user_id == user_id).delete()
        db.commit()
        
        logger.info(f"Cleared {deleted_count} sessions for user {user_id}")
        return DeleteResponse(
            message=f"Successfully cleared {deleted_count} sessions",
            deleted_count=deleted_count
        )
        
    except Exception as e:
        logger.error(f"Error clearing history for user {user_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear conversation history"
        )

@router.get("/health", response_model=HealthResponse)
async def health_check(user_id: Optional[str] = Depends(optional_auth)):
    """
    Comprehensive health check endpoint
    """
    try:
        # Check LLM service health
        llm_health = llm_service.health_check()
        
        # Check database connectivity
        db_healthy = True
        try:
            db = next(get_db())
            db.execute("SELECT 1")
            db.close()
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            db_healthy = False
        
        # Determine overall health
        is_healthy = (
            llm_health.get("status") == "healthy" and 
            db_healthy
        )
        
        health_status = {
            "database": "healthy" if db_healthy else "unhealthy",
            "llm_service": llm_health
        }
        
        return HealthResponse(
            status="healthy" if is_healthy else "unhealthy",
            message="All services operational" if is_healthy else "Some services have issues",
            timestamp=datetime.utcnow().timestamp(),
            llm_service_status=health_status
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthResponse(
            status="unhealthy",
            message=f"Health check failed: {str(e)}",
            timestamp=datetime.utcnow().timestamp(),
            llm_service_status={"status": "error", "error": str(e)}
        )

# Simple health endpoint for basic monitoring
@router.get("/health/simple")
async def simple_health_check():
    """Simple health check endpoint for basic monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "qa-api"
    }

# Additional utility endpoints
@router.get("/qa/stats")
async def get_user_stats(
    user_id: str = Depends(verify_clerk_token),
    db: Session = Depends(get_db)
):
    """Get basic statistics for the user"""
    try:
        total_sessions = db.query(SessionModel).filter(SessionModel.user_id == user_id).count()
        successful_sessions = db.query(SessionModel).filter(
            SessionModel.user_id == user_id,
            SessionModel.is_successful == True
        ).count()
        
        # Calculate average response time
        avg_response = db.query(SessionModel.response_time_ms).filter(
            SessionModel.user_id == user_id,
            SessionModel.is_successful == True
        ).all()
        
        avg_response_time = 0
        if avg_response:
            avg_response_time = sum(r[0] for r in avg_response if r[0]) / len(avg_response)
        
        return {
            "total_sessions": total_sessions,
            "successful_sessions": successful_sessions,
            "success_rate": (successful_sessions / total_sessions * 100) if total_sessions > 0 else 0,
            "average_response_time_ms": round(avg_response_time, 2)
        }
        
    except Exception as e:
        logger.error(f"Error getting stats for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user statistics"
        )
