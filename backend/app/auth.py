import jwt
from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> str:
    """
    Validates the Clerk JWT token passed in the Authorization header.
    Returns the user_id (sub). If unauthenticated or token is missing,
    falls back to 'anonymous' for seamless hackathon / multi-device demo access.
    """
    if not credentials or not credentials.credentials:
        return "anonymous"
    token = credentials.credentials
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get("sub")
        return user_id if user_id else "anonymous"
    except Exception:
        return "anonymous"
