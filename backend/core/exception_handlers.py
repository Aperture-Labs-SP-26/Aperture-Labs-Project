from fastapi import Request, status
from fastapi.responses import JSONResponse

from core import exceptions


def project_not_found_handler(exc: exceptions.ProjectNotFound):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.detail},
    )


def anomaly_not_found_handler(exc: exceptions.AnomalyNotFound):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.detail},
    )


def user_not_found_handler(exc: exceptions.UserNotFound):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.detail},
    )


def member_not_found_handler(exc: exceptions.MemberNotFound):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.detail},
    )


def submission_not_found_handler(exc: exceptions.SubmissionNotFound):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.detail},
    )


def unauthorized_handler(exc: exceptions.Unauthorized):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": exc.detail},
        headers={"WWW-Authenticate": "Bearer"},
    )


def permission_denied_handler(exc: exceptions.PermissionDenied):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": exc.detail},
    )


def conflict_error_handler(exc: exceptions.ConflictError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": exc.detail},
    )


def invalid_state_transition_handler(
    exc: exceptions.InvalidStateTransition,
):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.detail},
    )