"""
Unit tests for auth_service.login and auth_service.logout.

These tests call the service layer directly against a real test database.
No HTTP layer is involved — that lives in tests/api/test_auth.py.
"""

import pytest

from services import auth_service
from schemas.auth import LoginRequest
from common import make_user


pytestmark = pytest.mark.unit

# -------------------------
# login
# -------------------------

def test_login_returns_success_for_valid_credentials(db):
    make_user(db, email="alice@example.com", password="password123")

    result = auth_service.login(
        db=db,
        payload=LoginRequest(email="alice@example.com", password="password123"),
    )

    assert result.success is True
    assert result.user is not None
    assert result.user.email == "alice@example.com"


def test_login_returns_user_id_on_success(db):
    user = make_user(db, email="alice@example.com", password="password123")

    result = auth_service.login(
        db=db,
        payload=LoginRequest(email="alice@example.com", password="password123"),
    )

    assert result.user.id == user.id


def test_login_fails_for_wrong_password(db):
    make_user(db, email="alice@example.com", password="password123")

    result = auth_service.login(
        db=db,
        payload=LoginRequest(email="alice@example.com", password="wrongpassword"),
    )

    assert result.success is False
    assert result.user is None
    assert result.message == "Invalid email or password"


def test_login_fails_for_unknown_email(db):
    result = auth_service.login(
        db=db,
        payload=LoginRequest(email="nobody@example.com", password="password123"),
    )

    assert result.success is False
    assert result.user is None
    assert result.message == "Invalid email or password"


def test_login_does_not_raise_for_unknown_email(db):
    """Verify unknown email returns a response rather than raising an exception."""
    try:
        auth_service.login(
            db=db,
            payload=LoginRequest(email="nobody@example.com", password="password123"),
        )
    except Exception as e:
        pytest.fail(f"login raised an unexpected exception: {e}")


def test_login_fails_for_empty_password(db):
    make_user(db, email="alice@example.com", password="password123")

    result = auth_service.login(
        db=db,
        payload=LoginRequest(email="alice@example.com", password=""),
    )

    assert result.success is False


def test_login_is_case_sensitive_for_password(db):
    make_user(db, email="alice@example.com", password="password123")

    result = auth_service.login(
        db=db,
        payload=LoginRequest(email="alice@example.com", password="PASSWORD123"),
    )

    assert result.success is False


def test_login_two_users_do_not_interfere(db):
    make_user(db, email="alice@example.com", password="alicepass")
    make_user(db, email="bob@example.com", password="bobpass")

    alice_result = auth_service.login(
        db=db,
        payload=LoginRequest(email="alice@example.com", password="alicepass"),
    )
    bob_result = auth_service.login(
        db=db,
        payload=LoginRequest(email="bob@example.com", password="bobpass"),
    )

    assert alice_result.success is True
    assert alice_result.user.email == "alice@example.com"
    assert bob_result.success is True
    assert bob_result.user.email == "bob@example.com"


def test_login_wrong_user_password_fails(db):
    """Alice's password should not work for Bob's account."""
    make_user(db, email="alice@example.com", password="alicepass")
    make_user(db, email="bob@example.com", password="bobpass")

    result = auth_service.login(
        db=db,
        payload=LoginRequest(email="bob@example.com", password="alicepass"),
    )

    assert result.success is False


# -------------------------
# logout
# -------------------------

def test_logout_returns_none(db):
    """Logout is a no-op for now — just verify it doesn't raise."""
    result = auth_service.logout(db=db)
    assert result is None