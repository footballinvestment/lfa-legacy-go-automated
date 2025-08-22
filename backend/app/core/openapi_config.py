# === backend/app/core/openapi_config.py ===
# LFA Legacy GO - Comprehensive OpenAPI Configuration
# Enhanced documentation with examples, error codes, and detailed schemas

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from typing import Dict, Any, Optional


def create_custom_openapi_schema(app: FastAPI) -> Dict[str, Any]:
    """Create comprehensive OpenAPI schema with enhanced documentation"""

    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="LFA Legacy GO API",
        version="3.0.0",
        description="""
        # 🏆 Football Training Platform - Complete API Documentation

        A comprehensive football training and tournament management system with gamification elements inspired by Pokémon GO.

        ## 🚀 Quick Start Guide

        1. **Authentication**: Register or login to get JWT token
        2. **Explore**: Use the interactive documentation below
        3. **Rate Limits**: 100 requests per 60 seconds
        4. **Base URL**: https://lfa-legacy-go.ew.r.appspot.com

        ## 🔐 Authentication Flow

        ```javascript
        // 1. Register or Login
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'your_username',
                password: 'your_password'
            })
        });

        const { access_token } = await response.json();

        // 2. Use token in subsequent requests
        const apiResponse = await fetch('/api/tournaments', {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });
        ```

        ## 📊 Response Format Standards

        All API endpoints follow consistent response formats:

        ### Success Response
        ```json
        {
            "success": true,
            "data": { /* Response data */ },
            "message": "Operation completed successfully",
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "uuid-string"
        }
        ```

        ### Error Response
        ```json
        {
            "success": false,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid input parameters",
                "details": { /* Error details */ }
            },
            "timestamp": "2025-08-21T14:00:00Z",
            "request_id": "uuid-string"
        }
        ```

        ## 🏷️ Error Codes Reference

        | Code | HTTP Status | Description |
        |------|-------------|-------------|
        | `VALIDATION_ERROR` | 400 | Invalid input parameters |
        | `UNAUTHORIZED` | 401 | Invalid or missing authentication |
        | `TOKEN_EXPIRED` | 401 | JWT token has expired |
        | `FORBIDDEN` | 403 | Insufficient permissions |
        | `NOT_FOUND` | 404 | Resource not found |
        | `USER_NOT_FOUND` | 404 | User does not exist |
        | `CONFLICT` | 409 | Resource already exists |
        | `RATE_LIMITED` | 429 | Too many requests |
        | `INTERNAL_ERROR` | 500 | Server error |

        ## 🎮 Core Features

        - **Authentication & Authorization**: JWT-based secure authentication
        - **Tournament System**: Create and manage football tournaments
        - **Location Services**: Find and book training locations
        - **Social Features**: Friends, challenges, and leaderboards
        - **Credit System**: Virtual currency for platform services
        - **Game Analytics**: Performance tracking and statistics
        - **Admin Panel**: User and system management

        ## 📱 Integration Examples

        ### JavaScript/React
        ```javascript
        import { useState, useEffect } from 'react';

        const useAuth = () => {
            const [token, setToken] = useState(localStorage.getItem('token'));

            const login = async (username, password) => {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    setToken(data.access_token);
                    localStorage.setItem('token', data.access_token);
                    return data;
                }
                throw new Error('Login failed');
            };

            return { token, login };
        };
        ```

        ### Python Client
        ```python
        import requests

        class LFAClient:
            def __init__(self, base_url='https://lfa-legacy-go.ew.r.appspot.com'):
                self.base_url = base_url
                self.token = None

            def login(self, username, password):
                response = requests.post(f'{self.base_url}/api/auth/login',
                    json={'username': username, 'password': password})

                if response.status_code == 200:
                    self.token = response.json()['access_token']
                    return True
                return False

            def get_tournaments(self):
                headers = {'Authorization': f'Bearer {self.token}'}
                return requests.get(f'{self.base_url}/api/tournaments', headers=headers)
        ```

        ## 🔒 Security Features

        - **JWT Authentication**: Secure token-based authentication
        - **Password Hashing**: Bcrypt encryption for user passwords
        - **Rate Limiting**: 100 requests per 60 seconds per IP
        - **CORS Protection**: Configurable origin restrictions
        - **Security Headers**: OWASP-compliant security headers
        - **Request Size Limits**: 10MB maximum request size
        - **SSL/TLS**: HTTPS encryption for all endpoints

        ## 📈 Rate Limiting

        All endpoints are subject to rate limiting:
        - **Limit**: 100 requests per 60 seconds
        - **Headers**: Rate limit info in response headers
        - **Overages**: HTTP 429 with retry-after header

        ## 🌍 Environment

        - **Production**: https://lfa-legacy-go.ew.r.appspot.com
        - **Documentation**: /docs (this page)
        - **Alternative Docs**: /redoc
        - **OpenAPI Spec**: /openapi.json

        ## 🆘 Support

        - **Email**: support@lfa-legacy-go.com
        - **Documentation**: This interactive documentation
        - **Status Page**: /health endpoint
        """,
        routes=app.routes,
        contact={
            "name": "LFA Legacy GO Support",
            "email": "support@lfa-legacy-go.com",
            "url": "https://lfa-legacy-go.ew.r.appspot.com",
        },
        license_info={
            "name": "MIT License",
            "url": "https://opensource.org/licenses/MIT",
        },
    )

    # Add enhanced component schemas
    openapi_schema["components"]["schemas"].update(get_enhanced_schemas())

    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "JWTAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT token obtained from /api/auth/login or /api/auth/register",
        }
    }

    # Add server information
    openapi_schema["servers"] = [
        {
            "url": "https://lfa-legacy-go.ew.r.appspot.com",
            "description": "Production server",
        },
        {"url": "http://localhost:8000", "description": "Development server"},
    ]

    # Add enhanced path documentation with examples
    enhance_path_documentation(openapi_schema)

    app.openapi_schema = openapi_schema
    return app.openapi_schema


def get_enhanced_schemas() -> Dict[str, Any]:
    """Get enhanced schema definitions with examples"""

    return {
        "StandardSuccessResponse": {
            "type": "object",
            "properties": {
                "success": {"type": "boolean", "example": True},
                "data": {"type": "object", "description": "Response data"},
                "message": {
                    "type": "string",
                    "example": "Operation completed successfully",
                },
                "timestamp": {
                    "type": "string",
                    "format": "date-time",
                    "example": "2025-08-21T14:00:00Z",
                },
                "request_id": {"type": "string", "example": "uuid-string"},
            },
            "required": ["success", "message", "timestamp"],
        },
        "StandardErrorResponse": {
            "type": "object",
            "properties": {
                "success": {"type": "boolean", "example": False},
                "error": {
                    "type": "object",
                    "properties": {
                        "code": {"type": "string", "example": "VALIDATION_ERROR"},
                        "message": {
                            "type": "string",
                            "example": "Invalid input parameters",
                        },
                        "details": {"type": "object", "description": "Error details"},
                    },
                },
                "timestamp": {
                    "type": "string",
                    "format": "date-time",
                    "example": "2025-08-21T14:00:00Z",
                },
                "request_id": {"type": "string", "example": "uuid-string"},
            },
            "required": ["success", "error", "timestamp"],
        },
        "AuthenticationRequest": {
            "type": "object",
            "properties": {
                "username": {
                    "type": "string",
                    "example": "player123",
                    "description": "User's username",
                },
                "password": {
                    "type": "string",
                    "example": "securePassword123",
                    "description": "User's password",
                },
            },
            "required": ["username", "password"],
        },
        "RegistrationRequest": {
            "type": "object",
            "properties": {
                "username": {
                    "type": "string",
                    "example": "newplayer",
                    "description": "Unique username",
                },
                "email": {
                    "type": "string",
                    "format": "email",
                    "example": "player@example.com",
                    "description": "User's email address",
                },
                "password": {
                    "type": "string",
                    "example": "securePassword123",
                    "description": "Strong password",
                },
                "full_name": {
                    "type": "string",
                    "example": "John Doe",
                    "description": "User's full name",
                },
            },
            "required": ["username", "email", "password", "full_name"],
        },
        "UserProfile": {
            "type": "object",
            "properties": {
                "id": {"type": "integer", "example": 123},
                "username": {"type": "string", "example": "player123"},
                "email": {
                    "type": "string",
                    "format": "email",
                    "example": "player@example.com",
                },
                "full_name": {"type": "string", "example": "John Doe"},
                "display_name": {"type": "string", "example": "John D."},
                "level": {
                    "type": "integer",
                    "example": 5,
                    "description": "User's current level",
                },
                "credits": {
                    "type": "integer",
                    "example": 150,
                    "description": "Available credits",
                },
                "is_active": {"type": "boolean", "example": True},
                "created_at": {"type": "string", "format": "date-time"},
                "last_login": {"type": "string", "format": "date-time"},
                "user_type": {
                    "type": "string",
                    "enum": ["user", "admin", "moderator"],
                    "example": "user",
                },
            },
        },
        "TournamentCreate": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "example": "Summer Championship",
                    "description": "Tournament name",
                },
                "description": {
                    "type": "string",
                    "example": "Annual summer football tournament",
                    "description": "Tournament description",
                },
                "location_id": {
                    "type": "integer",
                    "example": 5,
                    "description": "Location where tournament will be held",
                },
                "start_date": {
                    "type": "string",
                    "format": "date-time",
                    "example": "2025-09-01T10:00:00Z",
                },
                "end_date": {
                    "type": "string",
                    "format": "date-time",
                    "example": "2025-09-01T18:00:00Z",
                },
                "max_participants": {
                    "type": "integer",
                    "example": 16,
                    "description": "Maximum number of participants",
                },
                "entry_fee": {
                    "type": "integer",
                    "example": 10,
                    "description": "Entry fee in credits",
                },
                "prize_pool": {
                    "type": "integer",
                    "example": 100,
                    "description": "Total prize pool in credits",
                },
            },
            "required": [
                "name",
                "location_id",
                "start_date",
                "end_date",
                "max_participants",
            ],
        },
        "Location": {
            "type": "object",
            "properties": {
                "id": {"type": "integer", "example": 1},
                "location_id": {"type": "string", "example": "FIELD_001"},
                "name": {"type": "string", "example": "Central Football Field"},
                "address": {"type": "string", "example": "123 Football Street, City"},
                "city": {"type": "string", "example": "Budapest"},
                "latitude": {"type": "number", "format": "float", "example": 47.4979},
                "longitude": {"type": "number", "format": "float", "example": 19.0402},
                "capacity": {"type": "integer", "example": 22},
                "amenities": {
                    "type": "array",
                    "items": {"type": "string"},
                    "example": ["WiFi", "Parking", "Changing Rooms", "Showers"]
                },
                "hourly_rate": {"type": "integer", "example": 25},
                "is_available": {"type": "boolean", "example": True},
            },
        },
        "Tournament": {
            "type": "object",
            "properties": {
                "id": {"type": "integer", "example": 42},
                "tournament_id": {"type": "string", "example": "SUMMER_CHAMP_2025"},
                "name": {"type": "string", "example": "Summer Championship"},
                "description": {"type": "string", "example": "Annual summer football tournament"},
                "tournament_type": {
                    "type": "string", 
                    "enum": ["knockout", "league", "daily_challenge"],
                    "example": "knockout"
                },
                "status": {
                    "type": "string",
                    "enum": ["upcoming", "ongoing", "completed", "cancelled"],
                    "example": "upcoming"
                },
                "location": {"$ref": "#/components/schemas/Location"},
                "organizer": {"$ref": "#/components/schemas/UserProfile"},
                "participants": {
                    "type": "array",
                    "items": {"$ref": "#/components/schemas/UserProfile"}
                },
                "max_participants": {"type": "integer", "example": 16},
                "current_participants": {"type": "integer", "example": 8},
                "entry_fee": {"type": "integer", "example": 10},
                "prize_pool": {"type": "integer", "example": 100},
                "start_time": {"type": "string", "format": "date-time"},
                "end_time": {"type": "string", "format": "date-time"},
                "registration_deadline": {"type": "string", "format": "date-time"},
                "created_at": {"type": "string", "format": "date-time"},
            },
        },
        "GameResult": {
            "type": "object",
            "properties": {
                "id": {"type": "integer", "example": 789},
                "match_id": {"type": "string", "example": "MATCH_001_2025"},
                "tournament_id": {"type": "string", "example": "SUMMER_CHAMP_2025"},
                "player1": {"$ref": "#/components/schemas/UserProfile"},
                "player2": {"$ref": "#/components/schemas/UserProfile"},
                "score_player1": {"type": "integer", "example": 3},
                "score_player2": {"type": "integer", "example": 2},
                "winner_id": {"type": "integer", "example": 123},
                "match_duration": {"type": "integer", "example": 90, "description": "Duration in minutes"},
                "status": {
                    "type": "string",
                    "enum": ["scheduled", "ongoing", "completed", "cancelled"],
                    "example": "completed"
                },
                "played_at": {"type": "string", "format": "date-time"},
                "location": {"$ref": "#/components/schemas/Location"},
            },
        },
        "CreditBalance": {
            "type": "object",
            "properties": {
                "user_id": {"type": "integer", "example": 123},
                "total_credits": {"type": "integer", "example": 150},
                "pending_credits": {"type": "integer", "example": 25},
                "last_updated": {"type": "string", "format": "date-time"},
                "transactions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer", "example": 456},
                            "amount": {"type": "integer", "example": 10},
                            "type": {
                                "type": "string",
                                "enum": ["earned", "spent", "bonus", "refund"],
                                "example": "earned"
                            },
                            "description": {"type": "string", "example": "Tournament entry fee"},
                            "timestamp": {"type": "string", "format": "date-time"},
                        }
                    }
                }
            },
        },
        "HealthCheck": {
            "type": "object",
            "properties": {
                "service": {"type": "string", "example": "lfa-legacy-go-api"},
                "status": {
                    "type": "string",
                    "enum": ["healthy", "degraded", "unhealthy"],
                    "example": "healthy"
                },
                "version": {"type": "string", "example": "3.0.0"},
                "timestamp": {"type": "string", "format": "date-time"},
                "uptime": {"type": "number", "example": 3600.5, "description": "Uptime in seconds"},
                "database": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string", "example": "connected"},
                        "response_time": {"type": "number", "example": 15.2, "description": "Response time in ms"}
                    }
                },
                "memory": {
                    "type": "object", 
                    "properties": {
                        "used": {"type": "number", "example": 128.5, "description": "Used memory in MB"},
                        "total": {"type": "number", "example": 512.0, "description": "Total memory in MB"}
                    }
                }
            },
        },
    }


def enhance_path_documentation(openapi_schema: Dict[str, Any]) -> None:
    """Add enhanced documentation with examples to API paths"""

    # Authentication endpoints examples
    auth_examples = {
        "/api/auth/login": {
            "post": {
                "summary": "🔐 User Login",
                "description": """
                Authenticate user and receive JWT token for API access.

                **Example Usage:**
                ```javascript
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: 'player123',
                        password: 'securePassword'
                    })
                });
                ```

                **Success Response Example:**
                ```json
                {
                    "success": true,
                    "data": {
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "token_type": "bearer",
                        "expires_in": 2592000,
                        "user": {
                            "id": 123,
                            "username": "player123",
                            "email": "player@example.com",
                            "level": 5,
                            "credits": 150
                        }
                    },
                    "message": "Login successful",
                    "timestamp": "2025-08-21T14:00:00Z",
                    "request_id": "auth-req-001"
                }
                ```
                """,
                "tags": ["Authentication"],
            }
        },
        "/api/auth/register": {
            "post": {
                "summary": "🆕 User Registration",
                "description": """
                Create new user account and receive JWT token.

                **Validation Rules:**
                - Username: 3-30 characters, alphanumeric + underscore
                - Email: Valid email format
                - Password: Minimum 8 characters
                - Full name: Minimum 2 characters

                **Example Usage:**
                ```javascript
                const newUser = {
                    username: 'newplayer',
                    email: 'newplayer@example.com',
                    password: 'securePassword123',
                    full_name: 'Jane Doe'
                };

                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser)
                });
                ```
                """,
                "tags": ["Authentication"],
            }
        },
    }

    # Apply enhanced documentation
    for path, methods in auth_examples.items():
        if path in openapi_schema["paths"]:
            for method, enhancement in methods.items():
                if method in openapi_schema["paths"][path]:
                    openapi_schema["paths"][path][method].update(enhancement)


def setup_enhanced_openapi(app: FastAPI) -> None:
    """Setup enhanced OpenAPI documentation for the FastAPI app"""

    # Override the openapi method
    def custom_openapi():
        return create_custom_openapi_schema(app)

    app.openapi = custom_openapi

    return app
