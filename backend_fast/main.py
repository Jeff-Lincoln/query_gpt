from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

# Import your router - choose the correct import based on your file structure:
# Option 1: If you have api/endpoints/qa.py
from api.endpoints.qa import router as qa_router

# Option 2: If you have a file named router.py in the same directory
# from router import router as qa_router

# Option 3: If you have qa_router.py in the same directory
# from qa_router import router as qa_router

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting up Query GPT API...")
    # You can add any startup logic here (database initialization, etc.)
    yield
    # Shutdown
    logger.info("Shutting down Query GPT API...")

# Create FastAPI app
app = FastAPI(
    title="Query GPT API",
    version="1.0.0",
    description="AI Chat API with Clerk Authentication",
    lifespan=lifespan
)

# CORS middleware - critical for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://localhost:3000",  # In case you use HTTPS locally
        # Add your production frontend URLs here
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include your QA router
app.include_router(qa_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Query GPT API",
        "version": "1.0.0",
        "status": "running"
    }

# Simple health check endpoint (in addition to the one in your router)
@app.get("/health")
async def health():
    """Simple health check for the frontend"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",  # Adjust this if your file is named differently
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
