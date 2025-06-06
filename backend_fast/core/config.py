import os
import logging
from typing import List, Union
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import field_validator, Field

# Load environment variables from .env.local and .env files
# Try .env.local first, then fallback to .env
import os


load_dotenv(".env.local")
load_dotenv(".env")


class Settings(BaseSettings):
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_DEBUG: bool = False
    
    # Application Info
    APP_NAME: str = "Travel Documentation Assistant"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-powered travel documentation and visa assistance"
    
    # Database Configuration
    DATABASE_URL: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", ""), description="Database connection URL")

    # Additional database fields (to handle your .env variables)
    user: str = ""
    password: str = ""
    host: str = ""
    port: str = ""
    dbname: str = ""
    
    # LLM Configuration
    LLM_PROVIDER: str = "deepseek"
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    
    # Clerk Authentication
    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""
    
    # App Configuration
    SECRET_KEY: str = "your-secret-key-change-in-production"
    DEBUG: bool = True
    
    # CORS Configuration - Store as strings, convert to lists via validators
    CORS_ORIGINS: Union[str, List[str]] = Field(default="http://localhost:3000,http://127.0.0.1:3000,https://travelling-gpt.vercel.app")
    ALLOWED_ORIGINS: Union[str, List[str]] = Field(default="http://localhost:3000,https://travelling-gpt.vercel.app")

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Q&A System"
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "app.log"
    
    # Security Configuration
    JWT_SECRET_KEY: str = "your-default-secret-key-change-in-production"
    TOKEN_EXPIRE_HOURS: int = 24
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60
    
    # LLM Configuration
    DEFAULT_LLM_PROVIDER: str = "deepseek"
    MAX_TOKENS: int = 2000
    TEMPERATURE: float = 0.3
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 50
    MAX_PAGE_SIZE: int = 100
    
    model_config = {
        "env_file": [".env.local", ".env"],
        "case_sensitive": True,
        "extra": "ignore"  # This will ignore extra fields from .env
    }
    
    @field_validator("DEEPSEEK_API_KEY", mode="before")
    @classmethod
    def validate_deepseek_key(cls, v):
        if v and not v.startswith("sk-"):
            raise ValueError("DEEPSEEK_API_KEY must start with 'sk-'")
        return v or ""
    
    @field_validator("CLERK_SECRET_KEY", mode="before")
    @classmethod
    def validate_clerk_key(cls, v):
        if v and not v.startswith("sk_"):
            raise ValueError("CLERK_SECRET_KEY must start with 'sk_'")
        return v or ""
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def validate_cors_origins(cls, v) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000", "https://travelling-gpt.vercel.app"]
    
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def validate_origins(cls, v) -> List[str]:
        # Convert string to list for CORS
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "https://travelling-gpt.vercel.app"]
    
    @field_validator("LOG_LEVEL", mode="before")
    @classmethod
    def validate_log_level(cls, v):
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v = v or "INFO"
        if v.upper() not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of {valid_levels}")
        return v.upper()
    
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=getattr(logging, self.LOG_LEVEL),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.LOG_FILE),
                logging.StreamHandler()
            ]
        )
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins as a list"""
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        return [origin.strip() for origin in str(self.CORS_ORIGINS).split(",")]
    
    def get_allowed_origins(self) -> List[str]:
        """Get allowed origins as a list"""
        if isinstance(self.ALLOWED_ORIGINS, list):
            return self.ALLOWED_ORIGINS
        return [origin.strip() for origin in str(self.ALLOWED_ORIGINS).split(",")]

# # Create settings instance
# settings = Settings()
try:
    settings = Settings()
    print("✅ Configuration loaded successfully")
except Exception as e:
    print(f"❌ Configuration error: {e}")
    raise

