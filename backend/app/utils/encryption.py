import os
import base64
from cryptography.fernet import Fernet

# Fallback development key if not provided
_DEV_KEY = b"f9g8E3j4W6h2qP1aL0oK5sM7vX9yZ2rN4tF1uC6bD8e="

def get_fernet() -> Fernet:
    key_str = os.getenv("ENCRYPTION_KEY")
    if key_str:
        key = key_str.encode()
    else:
        key = _DEV_KEY
    return Fernet(key)

def encrypt(text: str) -> str:
    if not text:
        return ""
    f = get_fernet()
    return f.encrypt(text.encode()).decode()

def decrypt(encrypted_text: str) -> str:
    if not encrypted_text:
        return ""
    f = get_fernet()
    try:
        return f.decrypt(encrypted_text.encode()).decode()
    except Exception:
        return ""
