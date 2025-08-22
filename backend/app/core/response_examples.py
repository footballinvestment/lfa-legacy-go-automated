# === backend/app/core/response_examples.py ===
# LFA Legacy GO - Comprehensive API Response Examples
# Enhanced documentation examples for all endpoints

from typing import Dict, Any

# Authentication Examples
AUTH_EXAMPLES = {
    "login_request": {
        "summary": "Login Request",
        "description": "User credentials for authentication",
        "value": {"username": "player123", "password": "securePassword123"},
    },
    "login_success": {
        "summary": "Login Success",
        "description": "Successful authentication response",
        "value": {
            "success": True,
            "data": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE2OTg4NjQwMDB9.ABC123",
                "token_type": "bearer",
                "expires_in": 2592000,
                "user": {
                    "id": 123,
                    "username": "player123",
                    "email": "player@example.com",
                    "full_name": "John Doe",
                    "display_name": "John D.",
                    "level": 5,
                    "credits": 150,
                    "is_active": True,
                    "user_type": "user",
                    "created_at": "2025-01-01T10:00:00Z",
                    "last_login": "2025-08-21T14:00:00Z",
                },
            },
            "message": "Login successful",
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "auth-req-001",
        },
    },
    "register_request": {
        "summary": "Registration Request",
        "description": "New user registration data",
        "value": {
            "username": "newplayer",
            "email": "newplayer@example.com",
            "password": "securePassword123",
            "full_name": "Jane Doe",
        },
    },
    "register_success": {
        "summary": "Registration Success",
        "description": "Successful user registration with immediate login",
        "value": {
            "success": True,
            "data": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjQiLCJleHAiOjE2OTg4NjQwMDB9.XYZ789",
                "token_type": "bearer",
                "expires_in": 2592000,
                "user": {
                    "id": 124,
                    "username": "newplayer",
                    "email": "newplayer@example.com",
                    "full_name": "Jane Doe",
                    "display_name": "Jane Doe",
                    "level": 1,
                    "credits": 5,
                    "is_active": True,
                    "user_type": "user",
                    "created_at": "2025-08-21T14:00:00Z",
                    "last_login": "2025-08-21T14:00:00Z",
                },
            },
            "message": "Registration successful",
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "auth-reg-001",
        },
    },
}

# Tournament Examples
TOURNAMENT_EXAMPLES = {
    "create_tournament": {
        "summary": "Create Tournament",
        "description": "Request to create a new tournament",
        "value": {
            "name": "Summer Championship 2025",
            "description": "Annual summer football tournament with exciting prizes",
            "location_id": 5,
            "start_date": "2025-09-01T10:00:00Z",
            "end_date": "2025-09-01T18:00:00Z",
            "max_participants": 16,
            "entry_fee": 10,
            "prize_pool": 100,
            "tournament_type": "single_elimination",
        },
    },
    "tournament_created": {
        "summary": "Tournament Created",
        "description": "Successfully created tournament response",
        "value": {
            "success": True,
            "data": {
                "id": 45,
                "name": "Summer Championship 2025",
                "description": "Annual summer football tournament with exciting prizes",
                "status": "registration_open",
                "location_id": 5,
                "creator_id": 123,
                "start_date": "2025-09-01T10:00:00Z",
                "end_date": "2025-09-01T18:00:00Z",
                "max_participants": 16,
                "current_participants": 1,
                "entry_fee": 10,
                "prize_pool": 100,
                "tournament_type": "single_elimination",
                "created_at": "2025-08-21T14:00:00Z",
            },
            "message": "Tournament created successfully",
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "tourn-create-001",
        },
    },
    "tournament_list": {
        "summary": "Tournament List",
        "description": "List of available tournaments",
        "value": {
            "success": True,
            "data": {
                "tournaments": [
                    {
                        "id": 45,
                        "name": "Summer Championship 2025",
                        "status": "registration_open",
                        "start_date": "2025-09-01T10:00:00Z",
                        "current_participants": 8,
                        "max_participants": 16,
                        "entry_fee": 10,
                        "prize_pool": 100,
                    },
                    {
                        "id": 44,
                        "name": "Weekly Challenge",
                        "status": "in_progress",
                        "start_date": "2025-08-20T18:00:00Z",
                        "current_participants": 12,
                        "max_participants": 12,
                        "entry_fee": 5,
                        "prize_pool": 50,
                    },
                ],
                "total": 2,
                "page": 1,
                "per_page": 10,
            },
            "message": "Tournaments retrieved successfully",
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "tourn-list-001",
        },
    },
}

# Location Examples
LOCATION_EXAMPLES = {
    "location_list": {
        "summary": "Training Locations",
        "description": "Available training locations near user",
        "value": {
            "success": True,
            "data": {
                "locations": [
                    {
                        "id": 5,
                        "name": "Central Park Football Field",
                        "address": "Central Park, New York, NY",
                        "latitude": 40.7829,
                        "longitude": -73.9654,
                        "location_type": "outdoor_field",
                        "capacity": 22,
                        "hourly_rate": 5,
                        "amenities": ["lighting", "changing_rooms", "parking"],
                        "distance": 1.2,
                        "availability_status": "available",
                    },
                    {
                        "id": 6,
                        "name": "Sports Complex Indoor Arena",
                        "address": "123 Sports Ave, New York, NY",
                        "latitude": 40.7580,
                        "longitude": -73.9855,
                        "location_type": "indoor_arena",
                        "capacity": 16,
                        "hourly_rate": 8,
                        "amenities": [
                            "air_conditioning",
                            "changing_rooms",
                            "parking",
                            "sound_system",
                        ],
                        "distance": 2.5,
                        "availability_status": "limited",
                    },
                ],
                "total": 2,
                "user_location": {"latitude": 40.7831, "longitude": -73.9712},
            },
            "message": "Locations retrieved successfully",
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "loc-list-001",
        },
    }
}

# Error Examples
ERROR_EXAMPLES = {
    "validation_error": {
        "summary": "Validation Error",
        "description": "Invalid input parameters",
        "value": {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid input parameters",
                "details": {
                    "username": ["Username must be at least 3 characters long"],
                    "email": ["Invalid email format"],
                },
            },
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "err-val-001",
        },
    },
    "unauthorized": {
        "summary": "Unauthorized",
        "description": "Authentication required",
        "value": {
            "success": False,
            "error": {
                "code": "UNAUTHORIZED",
                "message": "Authentication required",
                "details": {
                    "reason": "Missing or invalid JWT token",
                    "hint": "Include 'Authorization: Bearer <token>' header",
                },
            },
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "err-auth-001",
        },
    },
    "not_found": {
        "summary": "Not Found",
        "description": "Resource not found",
        "value": {
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": "Resource not found",
                "details": {"resource": "tournament", "id": 999},
            },
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "err-404-001",
        },
    },
    "rate_limited": {
        "summary": "Rate Limited",
        "description": "Too many requests",
        "value": {
            "success": False,
            "error": {
                "code": "RATE_LIMITED",
                "message": "Rate limit exceeded",
                "details": {"limit": 100, "window": 60, "retry_after": 30},
            },
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "err-rate-001",
        },
    },
}

# Social Features Examples
SOCIAL_EXAMPLES = {
    "friend_request": {
        "summary": "Send Friend Request",
        "description": "Request to add another user as friend",
        "value": {
            "target_user_id": 125,
            "message": "Hey! Want to play football together?",
        },
    },
    "friends_list": {
        "summary": "Friends List",
        "description": "User's current friends with their activity status",
        "value": {
            "success": True,
            "data": {
                "friends": [
                    {
                        "user_id": 125,
                        "username": "footballer99",
                        "display_name": "Mike Johnson",
                        "level": 7,
                        "status": "online",
                        "last_active": "2025-08-21T13:45:00Z",
                        "friendship_since": "2025-07-15T10:00:00Z",
                    },
                    {
                        "user_id": 126,
                        "username": "soccerstar",
                        "display_name": "Sarah Wilson",
                        "level": 4,
                        "status": "offline",
                        "last_active": "2025-08-20T22:30:00Z",
                        "friendship_since": "2025-08-01T14:20:00Z",
                    },
                ],
                "total": 2,
                "online_count": 1,
            },
            "message": "Friends retrieved successfully",
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "social-friends-001",
        },
    },
}

# Credits Examples
CREDIT_EXAMPLES = {
    "credit_balance": {
        "summary": "Credit Balance",
        "description": "User's current credit balance and transaction history",
        "value": {
            "success": True,
            "data": {
                "balance": 150,
                "total_earned": 275,
                "total_spent": 125,
                "recent_transactions": [
                    {
                        "id": 501,
                        "type": "earned",
                        "amount": 20,
                        "description": "Tournament victory bonus",
                        "timestamp": "2025-08-21T12:00:00Z",
                    },
                    {
                        "id": 500,
                        "type": "spent",
                        "amount": 10,
                        "description": "Tournament entry fee",
                        "timestamp": "2025-08-21T11:00:00Z",
                    },
                ],
            },
            "message": "Credit information retrieved successfully",
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "credits-bal-001",
        },
    }
}

# Combine all examples
ALL_EXAMPLES = {
    "auth": AUTH_EXAMPLES,
    "tournaments": TOURNAMENT_EXAMPLES,
    "locations": LOCATION_EXAMPLES,
    "social": SOCIAL_EXAMPLES,
    "credits": CREDIT_EXAMPLES,
    "errors": ERROR_EXAMPLES,
}
