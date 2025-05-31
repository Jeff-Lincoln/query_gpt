import time
import logging
import os
from typing import Dict, Any, Tuple, Optional
from openai import OpenAI
from core.config import settings

# Set up logging for debugging
logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        # Initialize OpenAI client configured for DeepSeek using environment variable
        self.api_key = os.getenv('DEEPSEEK_API_KEY')
        if not self.api_key:
            raise ValueError("DEEPSEEK_API_KEY environment variable is required")
        
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.deepseek.com"
        )
        self.provider = "deepseek"
        logger.info("DeepSeek API client initialized successfully")
    
    async def get_answer(self, question: str, user_id: Optional[str] = None,  llm_provider: str = "default") -> Tuple[str, int, bool, str]:
        """
        Get answer from LLM provider
        Args:
            question: The user's question
            user_id: The authenticated user ID from Clerk
        Returns: (answer, response_time_ms, is_successful, error_message)
        """
        start_time = time.time()
        
        try:
            if self.provider == "deepseek":
                return await self._call_deepseek(question, start_time, user_id)
            else:
                return "", 0, False, f"Unsupported LLM provider: {self.provider}"
                
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            logger.error(f"Unexpected error in get_answer for user {user_id}: {str(e)}")
            return "", response_time, False, str(e)
    
    async def _call_deepseek(self, question: str, start_time: float, user_id: Optional[str] = None) -> Tuple[str, int, bool, str]:
        """
        Call DeepSeek API using OpenAI SDK
        """
        # Enhanced prompt for travel documentation with user context
        system_prompt = """You are a helpful travel documentation assistant. When users ask about travel requirements, provide comprehensive, accurate, and up-to-date information including:
        1. Visa requirements and application process
        2. Passport requirements (validity period, blank pages)
        3. Additional supporting documents
        4. Health requirements (vaccinations, health certificates)
        5. Travel advisories and restrictions
        6. Useful tips and recommendations
        
        Format your response clearly with sections and bullet points for easy reading.
        Be conversational and helpful while maintaining accuracy."""
        
        try:
            # Log the request (without logging sensitive data)
            logger.info(f"Making request to DeepSeek API for user: {user_id or 'anonymous'}")
            logger.debug(f"Question length: {len(question)} characters")
            
            # Make the API call with proper error handling
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question}
                ],
                max_tokens=2000,
                temperature=0.3,
                stream=False
            )
            
            response_time = int((time.time() - start_time) * 1000)
            
            # Log successful response
            logger.info(f"DeepSeek API response received successfully in {response_time}ms for user: {user_id or 'anonymous'}")
            
            # Extract and validate the answer
            if response.choices and len(response.choices) > 0:
                answer = response.choices[0].message.content
                if answer and answer.strip():
                    return answer.strip(), response_time, True, ""
                else:
                    logger.warning(f"Empty response from DeepSeek API for user: {user_id}")
                    return "", response_time, False, "Empty response from DeepSeek API"
            else:
                logger.error(f"No choices in DeepSeek API response for user: {user_id}")
                return "", response_time, False, "No choices in response from DeepSeek API"
                
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            error_str = str(e)
            
            # Enhanced error handling with user context
            if "authentication" in error_str.lower() or "unauthorized" in error_str.lower():
                error_msg = "Authentication failed. Please check your DeepSeek API key configuration."
                logger.error(f"Auth error for user {user_id}: {error_str}")
            elif "rate limit" in error_str.lower() or "quota" in error_str.lower():
                error_msg = "Rate limit exceeded or quota exhausted. Please try again later."
                logger.warning(f"Rate limit error for user {user_id}: {error_str}")
            elif "timeout" in error_str.lower():
                error_msg = "Request timeout - DeepSeek API took too long to respond"
                logger.error(f"Timeout error for user {user_id}: {error_str}")
            elif "connection" in error_str.lower() or "network" in error_str.lower():
                error_msg = f"Network error: Unable to connect to DeepSeek API"
                logger.error(f"Network error for user {user_id}: {error_str}")
            else:
                error_msg = f"DeepSeek API error: {error_str}"
                logger.error(f"General API error for user {user_id}: {error_str}")
            
            return "", response_time, False, error_msg

    # Health check method for the service
    def health_check(self) -> Dict[str, Any]:
        """
        Check the health of the LLM service
        """
        try:
            # Simple check to see if we can initialize the client
            if self.client and self.api_key:
                return {
                    "status": "healthy",
                    "provider": self.provider,
                    "api_configured": True,
                    "timestamp": time.time()
                }
            else:
                return {
                    "status": "unhealthy",
                    "provider": self.provider,
                    "api_configured": False,
                    "error": "API client not properly configured",
                    "timestamp": time.time()
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "provider": self.provider,
                "api_configured": False,
                "error": str(e),
                "timestamp": time.time()
            }

    # Placeholder methods for future LLM providers
    async def _call_openai(self, question: str, start_time: float, user_id: Optional[str] = None) -> Tuple[str, int, bool, str]:
        response_time = int((time.time() - start_time) * 1000)
        logger.info(f"OpenAI integration requested for user {user_id} but not implemented")
        return "", response_time, False, "OpenAI integration not implemented"
    
    async def _call_anthropic(self, question: str, start_time: float, user_id: Optional[str] = None) -> Tuple[str, int, bool, str]:
        response_time = int((time.time() - start_time) * 1000)
        logger.info(f"Anthropic integration requested for user {user_id} but not implemented")
        return "", response_time, False, "Anthropic integration not implemented"
    
    async def _call_google(self, question: str, start_time: float, user_id: Optional[str] = None) -> Tuple[str, int, bool, str]:
        response_time = int((time.time() - start_time) * 1000)
        logger.info(f"Google Gemini integration requested for user {user_id} but not implemented")
        return "", response_time, False, "Google Gemini integration not implemented"

# Create the service instance
llm_service = LLMService()
