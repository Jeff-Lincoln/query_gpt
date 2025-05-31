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


# import time
# import logging
# from typing import Dict, Any, Tuple
# from openai import OpenAI
# from core.config import settings

# # Set up logging for debugging
# logger = logging.getLogger(__name__)

# class LLMService:
#     def __init__(self):
#         # Initialize OpenAI client configured for DeepSeek
#         self.client = OpenAI(
#             api_key='sk-03444534bf9c4f639909cd57a2f99a99',
#             base_url="https://api.deepseek.com"
#         )
#         self.provider = "deepseek"
#         print("DEEPSEEK_API_KEY: yes", settings.DEEPSEEK_API_KEY)  # Debugging line to check if the key is loaded
#     async def get_answer(self, question: str) -> Tuple[str, int, bool, str]:
#         """
#         Get answer from LLM provider
#         Returns: (answer, response_time_ms, is_successful, error_message)
#         """
#         start_time = time.time()
        
#         try:
#             if self.provider == "deepseek":
#                 return await self._call_deepseek(question, start_time)
#             else:
#                 return "", 0, False, f"Unsupported LLM provider: {self.provider}"
                
#         except Exception as e:
#             response_time = int((time.time() - start_time) * 1000)
#             logger.error(f"Unexpected error in get_answer: {str(e)}")
#             return "", response_time, False, str(e)
    
#     async def _call_deepseek(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
#         """
#         Call DeepSeek API using OpenAI SDK
#         """
#         # Enhanced prompt for travel documentation
#         system_prompt = """You are a helpful travel documentation assistant. When users ask about travel requirements, provide comprehensive, accurate, and up-to-date information including:
#         1. Visa requirements and application process
#         2. Passport requirements (validity period, blank pages)
#         3. Additional supporting documents
#         4. Health requirements (vaccinations, health certificates)
#         5. Travel advisories and restrictions
#         6. Useful tips and recommendations
        
#         Format your response clearly with sections and bullet points for easy reading."""
        
#         try:
#             # Debug logging (remove in production)
#             logger.info(f"Making request to DeepSeek API with model: deepseek-chat")
            
#             # Note: OpenAI SDK doesn't have native async support for chat completions
#             # We'll use the sync version. If you need true async, consider using asyncio.to_thread()
#             response = self.client.chat.completions.create(
#                 model="deepseek-chat",
#                 messages=[
#                     {"role": "system", "content": system_prompt},
#                     {"role": "user", "content": question}
#                 ],
#                 max_tokens=2000,
#                 temperature=0.3,
#                 stream=False
#             )
            
#             response_time = int((time.time() - start_time) * 1000)
            
#             # Debug logging
#             logger.info(f"DeepSeek API response received successfully in {response_time}ms")
            
#             # Extract the answer from the response
#             if response.choices and len(response.choices) > 0:
#                 answer = response.choices[0].message.content
#                 if answer:
#                     return answer.strip(), response_time, True, ""
#                 else:
#                     return "", response_time, False, "Empty response from DeepSeek API"
#             else:
#                 return "", response_time, False, "No choices in response from DeepSeek API"
                
#         except Exception as e:
#             response_time = int((time.time() - start_time) * 1000)
#             error_str = str(e)
            
#             # Handle specific OpenAI SDK exceptions
#             if "authentication" in error_str.lower() or "unauthorized" in error_str.lower():
#                 error_msg = "Authentication failed. Please check your DeepSeek API key."
#                 logger.error(f"Auth error: {error_str}")
#             elif "rate limit" in error_str.lower() or "quota" in error_str.lower():
#                 error_msg = "Rate limit exceeded or quota exhausted. Please try again later."
#                 logger.warning(f"Rate limit error: {error_str}")
#             elif "timeout" in error_str.lower():
#                 error_msg = "Request timeout - DeepSeek API took too long to respond"
#                 logger.error(f"Timeout error: {error_str}")
#             elif "connection" in error_str.lower() or "network" in error_str.lower():
#                 error_msg = f"Network error: Unable to connect to DeepSeek API"
#                 logger.error(f"Network error: {error_str}")
#             else:
#                 error_msg = f"DeepSeek API error: {error_str}"
#                 logger.error(f"General API error: {error_str}")
            
#             return "", response_time, False, error_msg

#     # Alternative async version using asyncio.to_thread() for true async support
#     async def _call_deepseek_async(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
#         """
#         Async wrapper for DeepSeek API call
#         """
#         import asyncio
        
#         # Enhanced prompt for travel documentation
#         system_prompt = """You are a helpful travel documentation assistant. When users ask about travel requirements, provide comprehensive, accurate, and up-to-date information including:
#         1. Visa requirements and application process
#         2. Passport requirements (validity period, blank pages)
#         3. Additional supporting documents
#         4. Health requirements (vaccinations, health certificates)
#         5. Travel advisories and restrictions
#         6. Useful tips and recommendations
        
#         Format your response clearly with sections and bullet points for easy reading."""
        
#         def sync_call():
#             return self.client.chat.completions.create(
#                 model="deepseek-chat",
#                 messages=[
#                     {"role": "system", "content": system_prompt},
#                     {"role": "user", "content": question}
#                 ],
#                 max_tokens=2000,
#                 temperature=0.3,
#                 stream=False
#             )
        
#         try:
#             # Run the sync call in a thread pool
#             response = await asyncio.to_thread(sync_call)
            
#             response_time = int((time.time() - start_time) * 1000)
            
#             if response.choices and len(response.choices) > 0:
#                 answer = response.choices[0].message.content
#                 if answer:
#                     return answer.strip(), response_time, True, ""
#                 else:
#                     return "", response_time, False, "Empty response from DeepSeek API"
#             else:
#                 return "", response_time, False, "No choices in response from DeepSeek API"
                
#         except Exception as e:
#             response_time = int((time.time() - start_time) * 1000)
#             error_str = str(e)
            
#             if "authentication" in error_str.lower():
#                 error_msg = "Authentication failed. Please check your DeepSeek API key."
#             elif "rate limit" in error_str.lower():
#                 error_msg = "Rate limit exceeded. Please try again later."
#             else:
#                 error_msg = f"DeepSeek API error: {error_str}"
            
#             return "", response_time, False, error_msg

#     # Keep the other methods for future use
#     async def _call_openai(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
#         response_time = int((time.time() - start_time) * 1000)
#         return "", response_time, False, "OpenAI integration not implemented"
    
#     async def _call_anthropic(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
#         response_time = int((time.time() - start_time) * 1000)
#         return "", response_time, False, "Anthropic integration not implemented"
    
#     async def _call_google(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
#         response_time = int((time.time() - start_time) * 1000)
#         return "", response_time, False, "Google Gemini integration not implemented"

# # Create the service instance
# llm_service = LLMService()

# # import httpx
# # import json
# # import time
# # from typing import Dict, Any, Tuple
# # from core.config import settings

# # class LLMService:
# #     def __init__(self):
# #         # Fixed: Use the actual API key, not convert to lowercase for provider selection
# #         self.api_key = settings.DEEPSEEK_API_KEY
# #         self.provider = "deepseek"  # Set to deepseek since that's what we're implementing
        
# #     async def get_answer(self, question: str) -> Tuple[str, int, bool, str]:
# #         """
# #         Get answer from LLM provider
# #         Returns: (answer, response_time_ms, is_successful, error_message)
# #         """
# #         start_time = time.time()
        
# #         try:
# #             if self.provider == "deepseek":
# #                 return await self._call_deepseek(question, start_time)
# #             else:
# #                 return "", 0, False, f"Unsupported LLM provider: {self.provider}"
                
# #         except Exception as e:
# #             response_time = int((time.time() - start_time) * 1000)
# #             return "", response_time, False, str(e)
    
# #     async def _call_deepseek(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
# #         """
# #         Call DeepSeek API
# #         """
# #         headers = {
# #             "Authorization": f"Bearer {self.api_key}",
# #             "Content-Type": "application/json"
# #         }
        
# #         # Enhanced prompt for travel documentation
# #         system_prompt = """You are a helpful travel documentation assistant. When users ask about travel requirements, provide comprehensive, accurate, and up-to-date information including:
# #         1. Visa requirements and application process
# #         2. Passport requirements (validity period, blank pages)
# #         3. Additional supporting documents
# #         4. Health requirements (vaccinations, health certificates)
# #         5. Travel advisories and restrictions
# #         6. Useful tips and recommendations
        
# #         Format your response clearly with sections and bullet points for easy reading."""
        
# #         data = {
# #             "model": "deepseek-chat",  # DeepSeek's chat model
# #             "messages": [
# #                 {"role": "system", "content": system_prompt},
# #                 {"role": "user", "content": question}
# #             ],
# #             "max_tokens": 2000,
# #             "temperature": 0.3,
# #             "stream": False
# #         }
        
# #         try:
# #             async with httpx.AsyncClient(timeout=60.0) as client:
# #                 response = await client.post(
# #                     "https://api.deepseek.com/chat/completions",  # Correct DeepSeek API endpoint
# #                     headers=headers,
# #                     json=data
# #                 )
                
# #                 response_time = int((time.time() - start_time) * 1000)
                
# #                 if response.status_code == 200:
# #                     result = response.json()
                    
# #                     # Check if the response has the expected structure
# #                     if "choices" in result and len(result["choices"]) > 0:
# #                         answer = result["choices"][0]["message"]["content"]
# #                         return answer.strip(), response_time, True, ""
# #                     else:
# #                         return "", response_time, False, "Invalid response structure from DeepSeek API"
                        
# #                 elif response.status_code == 401:
# #                     error_msg = "Authentication failed. Please check your DeepSeek API key."
# #                     return "", response_time, False, error_msg
                    
# #                 elif response.status_code == 429:
# #                     error_msg = "Rate limit exceeded. Please try again later."
# #                     return "", response_time, False, error_msg
                    
# #                 elif response.status_code == 400:
# #                     try:
# #                         error_detail = response.json()
# #                         error_msg = f"Bad request: {error_detail.get('error', {}).get('message', 'Unknown error')}"
# #                     except:
# #                         error_msg = f"Bad request: {response.text}"
# #                     return "", response_time, False, error_msg
                    
# #                 else:
# #                     error_msg = f"DeepSeek API error: {response.status_code} - {response.text}"
# #                     return "", response_time, False, error_msg
                    
# #         except httpx.TimeoutException:
# #             response_time = int((time.time() - start_time) * 1000)
# #             return "", response_time, False, "Request timeout - DeepSeek API took too long to respond"
            
# #         except httpx.RequestError as e:
# #             response_time = int((time.time() - start_time) * 1000)
# #             return "", response_time, False, f"Network error: {str(e)}"
            
# #         except json.JSONDecodeError:
# #             response_time = int((time.time() - start_time) * 1000)
# #             return "", response_time, False, "Invalid JSON response from DeepSeek API"
            
# #         except Exception as e:
# #             response_time = int((time.time() - start_time) * 1000)
# #             return "", response_time, False, f"Unexpected error: {str(e)}"

# #     # Keep the other methods for future use, but make them return not implemented messages
# #     async def _call_openai(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
# #         response_time = int((time.time() - start_time) * 1000)
# #         return "", response_time, False, "OpenAI integration not implemented"
    
# #     async def _call_anthropic(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
# #         response_time = int((time.time() - start_time) * 1000)
# #         return "", response_time, False, "Anthropic integration not implemented"
    
# #     async def _call_google(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
# #         response_time = int((time.time() - start_time) * 1000)
# #         return "", response_time, False, "Google Gemini integration not implemented"

# # # Create the service instance
# # llm_service = LLMService()



# # # import httpx
# # # import json
# # # import time
# # # from typing import Dict, Any, Tuple
# # # from core.config import settings

# # # class LLMService:
# # #     def __init__(self):
# # #         self.provider = settings.DEEPSEEK_API_KEY.lower()
        
# # #     async def get_answer(self, question: str) -> Tuple[str, int, bool, str]:
# # #         """
# # #         Get answer from LLM provider
# # #         Returns: (answer, response_time_ms, is_successful, error_message)
# # #         """
# # #         start_time = time.time()
        
# # #         try:
# # #             if self.provider == "openai":
# # #                 return await self._call_openai(question, start_time)
# # #             elif self.provider == "anthropic":
# # #                 return await self._call_anthropic(question, start_time)
# # #             elif self.provider == "google":
# # #                 return await self._call_google(question, start_time)
# # #             elif self.provider == "deepseek":
# # #                 return await self._call_deepseek(question, start_time)
# # #             else:
# # #                 return "", 0, False, f"Unsupported LLM provider: {self.provider}"
                
# # #         except Exception as e:
# # #             response_time = int((time.time() - start_time) * 1000)
# # #             return "", response_time, False, str(e)
    
# # #     async def _call_openai(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
# # #         headers = {
# # #             "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
# # #             "Content-Type": "application/json"
# # #         }
        
# # #         # Enhanced prompt for travel documentation
# # #         system_prompt = """You are a helpful travel documentation assistant. When users ask about travel requirements, provide comprehensive, accurate, and up-to-date information including:
# # #         1. Visa requirements and application process
# # #         2. Passport requirements (validity period, blank pages)
# # #         3. Additional supporting documents
# # #         4. Health requirements (vaccinations, health certificates)
# # #         5. Travel advisories and restrictions
# # #         6. Useful tips and recommendations
        
# # #         Format your response clearly with sections and bullet points for easy reading."""
        
# # #         data = {
# # #             "model": "gpt-3.5-turbo",
# # #             "messages": [
# # #                 {"role": "system", "content": system_prompt},
# # #                 {"role": "user", "content": question}
# # #             ],
# # #             "max_tokens": 1000,
# # #             "temperature": 0.3
# # #         }
        
# # #         async with httpx.AsyncClient() as client:
# # #             response = await client.post(
# # #                 "https://api.deepseek.com",
# # #                 headers=headers,
# # #                 json=data,
# # #                 timeout=30.0
# # #             )
            
# # #             response_time = int((time.time() - start_time) * 1000)
            
# # #             if response.status_code == 200:
# # #                 result = response.json()
# # #                 answer = result["choices"][0]["message"]["content"]
# # #                 return answer, response_time, True, ""
# # #             else:
# # #                 error_msg = f"OpenAI API error: {response.status_code} - {response.text}"
# # #                 return "", response_time, False, error_msg
    
# # #     async def _call_anthropic(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
# # #         headers = {
# # #             "x-api-key": settings.DEEPSEEK_API_KEY,
# # #             "Content-Type": "application/json",
# # #             "anthropic-version": "2023-06-01"
# # #         }
        
# # #         system_prompt = """You are a helpful travel documentation assistant. Provide comprehensive travel requirement information with clear formatting."""
        
# # #         data = {
# # #             "model": "claude-3-haiku-20240307",
# # #             "max_tokens": 1000,
# # #             "system": system_prompt,
# # #             "messages": [{"role": "user", "content": question}]
# # #         }
        
# # #         async with httpx.AsyncClient() as client:
# # #             response = await client.post(
# # #                 "https://api.deepseek.com",
# # #                 headers=headers,
# # #                 json=data,
# # #                 timeout=30.0
# # #             )
            
# # #             response_time = int((time.time() - start_time) * 1000)
            
# # #             if response.status_code == 200:
# # #                 result = response.json()
# # #                 answer = result["content"][0]["text"]
# # #                 return answer, response_time, True, ""
# # #             else:
# # #                 error_msg = f"Anthropic API error: {response.status_code} - {response.text}"
# # #                 return "", response_time, False, error_msg
    
# # #     async def _call_google(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
# # #         # Implement Google Gemini API call
# # #         # This is a placeholder - implement based on Google's API documentation
# # #         return "Google Gemini integration - implement based on API docs", 0, True, ""
    
# # #     async def _call_deepseek(self, question: str, start_time: float) -> Tuple[str, int, bool, str]:
# # #         # Implement DeepSeek API call
# # #         # This is a placeholder - implement based on DeepSeek's API documentation
# # #         return "DeepSeek integration - implement based on API docs", 0, True, ""

# # # llm_service = LLMService()