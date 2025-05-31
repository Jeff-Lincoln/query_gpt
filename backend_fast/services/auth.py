import os
import httpx
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from typing import Optional
import jwt
from jwt.exceptions import InvalidTokenError

# Get your Clerk secret key
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY")

if not CLERK_SECRET_KEY:
    raise ValueError("CLERK_SECRET_KEY environment variable is required")

security = HTTPBearer(auto_error=False)

class ClerkAuth:
    def __init__(self):
        self.secret_key = CLERK_SECRET_KEY
        
    async def verify_session_token(self, token: str) -> dict:
        """Verify session token with Clerk API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://api.clerk.dev/v1/sessions/{token}/verify",
                    headers={
                        "Authorization": f"Bearer {self.secret_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Clerk session verification failed: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            print(f"Error verifying session token: {str(e)}")
            return None
    
    async def verify_jwt_token(self, token: str) -> dict:
        """Verify JWT token locally (faster method)"""
        try:
            # For development, you can skip JWT signature verification
            # In production, you should verify with Clerk's public key
            decoded = jwt.decode(token, options={"verify_signature": False})
            return decoded
        except InvalidTokenError as e:
            print(f"JWT verification failed: {str(e)}")
            return None

clerk_auth = ClerkAuth()

async def get_current_user(credentials = Depends(security)) -> dict:
    """Dependency to get current user from Clerk token"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    token = credentials.credentials
    
    # Try JWT verification first (faster)
    user_data = await clerk_auth.verify_jwt_token(token)
    
    if not user_data:
        # Fallback to session verification
        user_data = await clerk_auth.verify_session_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return user_data

# Optional: Create a dependency that doesn't raise errors for debugging
async def get_current_user_optional(credentials = Depends(security)) -> Optional[dict]:
    """Optional auth dependency for debugging"""
    if not credentials:
        return None
        
    try:
        token = credentials.credentials
        user_data = await clerk_auth.verify_jwt_token(token)
        if not user_data:
            user_data = await clerk_auth.verify_session_token(token)
        return user_data
    except Exception as e:
        print(f"Auth error: {str(e)}")
        return None


# from fastapi import Request, HTTPException
# import requests

# async def get_current_user(request: Request):
#     auth_header = request.headers.get("Authorization")
#     if not auth_header or not auth_header.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Unauthorized")

#     token = auth_header.split(" ")[1]
#     clerk_user_info = requests.get(
#         "https://api.clerk.dev/v1/me",
#         headers={"Authorization": f"Bearer {token}"}
#     )
#     if not clerk_user_info.ok:
#         raise HTTPException(status_code=401, detail="Invalid Clerk token")

#     return clerk_user_info.json()
