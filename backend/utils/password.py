"""Password handling — plain text (no hashing). For production, replace with proper hashing."""


def hash_password(plain: str) -> str:
    """Return the password as-is (no hashing)."""
    return plain


def verify_password(plain: str, stored: str) -> bool:
    """Return True if plain matches the stored value (constant-time comparison)."""
    if len(plain) != len(stored):
        return False
    return plain == stored
