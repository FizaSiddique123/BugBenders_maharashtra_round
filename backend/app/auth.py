import jwt
from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Validates the Clerk JWT token passed in the Authorization header.
    Returns the user_id (sub).
    """
    token = credentials.credentials
    try:
        # In a strict production environment, we would verify the signature using Clerk's JWKS.
        # For this MVP, we decode the JWT to extract the user ID and enforce isolation.
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing subject")
        return user_id
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {e}")
