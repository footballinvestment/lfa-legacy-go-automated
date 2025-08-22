# 🏆 LFA Legacy GO API - Developer Guide

**Version:** 3.0.0  
**Production URL:** https://lfa-legacy-go.ew.r.appspot.com  
**Documentation:** https://lfa-legacy-go.ew.r.appspot.com/docs  

---

## 🚀 Quick Start

### 1. Get API Access
```bash
# No API key required - JWT token authentication
# Register at: /api/auth/register
# Login at: /api/auth/login
```

### 2. First API Call
```javascript
// 1. Authenticate
const response = await fetch('https://lfa-legacy-go.ew.r.appspot.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'your_username',
        password: 'your_password'
    })
});

const { access_token } = await response.json();

// 2. Make authenticated request
const tournaments = await fetch('https://lfa-legacy-go.ew.r.appspot.com/api/tournaments', {
    headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
    }
});
```

### 3. Postman Collection
Import our complete Postman collection for testing:
- **Collection:** `LFA_Legacy_GO_Postman_Collection.json`
- **Environment:** `LFA_Legacy_GO_Postman_Environment.json`

---

## 🔐 Authentication

### JWT Token Authentication
All protected endpoints require a JWT bearer token.

#### Get Token (Login)
```http
POST /api/auth/login
Content-Type: application/json

{
    "username": "your_username", 
    "password": "your_password"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "token_type": "bearer",
        "expires_in": 2592000,
        "user": { /* user profile */ }
    },
    "message": "Login successful"
}
```

#### Use Token
Include in all subsequent requests:
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

#### Token Properties
- **Expires:** 30 days (2,592,000 seconds)
- **Format:** JWT (JSON Web Token)
- **Algorithm:** HS256
- **Refresh:** Re-login when expired (no refresh endpoint)

---

## 📊 API Response Standards

### Success Response Format
```json
{
    "success": true,
    "data": { /* Response data */ },
    "message": "Operation completed successfully",
    "timestamp": "2025-08-21T14:00:00Z",
    "request_id": "uuid-string"
}
```

### Error Response Format
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable error message",
        "details": { /* Additional error information */ }
    },
    "timestamp": "2025-08-21T14:00:00Z",
    "request_id": "uuid-string"
}
```

### Standard Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input parameters |
| 400 | `INVALID_INPUT` | Malformed request data |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 401 | `TOKEN_EXPIRED` | JWT token has expired |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource does not exist |
| 404 | `USER_NOT_FOUND` | User does not exist |
| 409 | `CONFLICT` | Resource already exists |
| 409 | `ALREADY_EXISTS` | Duplicate entry attempted |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 500 | `DATABASE_ERROR` | Database operation failed |

---

## 🎮 Core Features

### 👤 User Management
```javascript
// Register new user
const newUser = await apiCall('POST', '/api/auth/register', {
    username: 'newplayer',
    email: 'player@example.com', 
    password: 'securePassword123',
    full_name: 'John Doe'
});

// Get current user profile
const profile = await apiCall('GET', '/api/auth/me');

// Update profile
const updated = await apiCall('PUT', '/api/auth/me', {
    display_name: 'John D.',
    bio: 'Passionate footballer!'
});
```

### 🏆 Tournament System
```javascript
// List tournaments
const tournaments = await apiCall('GET', '/api/tournaments?status=open');

// Create tournament
const newTournament = await apiCall('POST', '/api/tournaments', {
    name: 'Summer Championship',
    location_id: 5,
    start_date: '2025-09-01T10:00:00Z',
    end_date: '2025-09-01T18:00:00Z',
    max_participants: 16,
    entry_fee: 10
});

// Join tournament
const joined = await apiCall('POST', `/api/tournaments/${tournamentId}/join`);
```

### 📍 Location Services
```javascript
// Find nearby locations
const locations = await apiCall('GET', '/api/locations', {
    latitude: 40.7831,
    longitude: -73.9712,
    radius: 10
});

// Get location details
const location = await apiCall('GET', `/api/locations/${locationId}`);
```

### 👥 Social Features
```javascript
// Get friends list
const friends = await apiCall('GET', '/api/social/friends');

// Send friend request
const request = await apiCall('POST', '/api/social/friend-requests', {
    target_user_id: 123,
    message: 'Want to play together?'
});

// Get challenges
const challenges = await apiCall('GET', '/api/social/challenges');
```

### 💰 Credits System
```javascript
// Check balance
const balance = await apiCall('GET', '/api/credits/balance');

// Transaction history
const transactions = await apiCall('GET', '/api/credits/transactions');

// Purchase credits (if implemented)
const purchase = await apiCall('POST', '/api/credits/purchase', {
    amount: 100,
    payment_method: 'stripe'
});
```

---

## 🛡️ Rate Limiting

### Current Limits
- **Rate:** 100 requests per 60 seconds per IP
- **Headers:** Rate limit info included in responses
- **Overages:** HTTP 429 with `Retry-After` header

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1692628800
```

### Best Practices
1. **Cache responses** when possible
2. **Batch requests** for bulk operations  
3. **Check headers** before making more requests
4. **Implement exponential backoff** for 429 responses

---

## 🔧 Integration Examples

### React Hook for Authentication
```javascript
import { useState, useEffect } from 'react';

export const useAuth = () => {
    const [token, setToken] = useState(localStorage.getItem('lfa_token'));
    const [user, setUser] = useState(null);

    const login = async (username, password) => {
        try {
            const response = await fetch('https://lfa-legacy-go.ew.r.appspot.com/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (data.success) {
                setToken(data.data.access_token);
                setUser(data.data.user);
                localStorage.setItem('lfa_token', data.data.access_token);
                return { success: true, user: data.data.user };
            }
            
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: { message: 'Network error' } };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('lfa_token');
    };

    const apiCall = async (method, endpoint, data = null) => {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(`https://lfa-legacy-go.ew.r.appspot.com${endpoint}`, config);
        return response.json();
    };

    return { token, user, login, logout, apiCall };
};
```

### Python Client Class
```python
import requests
from typing import Dict, Any, Optional

class LFAClient:
    def __init__(self, base_url: str = 'https://lfa-legacy-go.ew.r.appspot.com'):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.user: Optional[Dict] = None
        
    def login(self, username: str, password: str) -> Dict[str, Any]:
        """Authenticate and store JWT token"""
        response = requests.post(
            f'{self.base_url}/api/auth/login',
            json={'username': username, 'password': password}
        )
        
        data = response.json()
        
        if data.get('success'):
            self.token = data['data']['access_token']
            self.user = data['data']['user']
            
        return data
    
    def _headers(self) -> Dict[str, str]:
        """Get headers with authentication"""
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        return headers
    
    def get_tournaments(self, **params) -> Dict[str, Any]:
        """Get list of tournaments"""
        response = requests.get(
            f'{self.base_url}/api/tournaments',
            headers=self._headers(),
            params=params
        )
        return response.json()
    
    def create_tournament(self, tournament_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new tournament"""
        response = requests.post(
            f'{self.base_url}/api/tournaments',
            headers=self._headers(),
            json=tournament_data
        )
        return response.json()
    
    def join_tournament(self, tournament_id: int) -> Dict[str, Any]:
        """Join a tournament"""
        response = requests.post(
            f'{self.base_url}/api/tournaments/{tournament_id}/join',
            headers=self._headers()
        )
        return response.json()

# Usage example
client = LFAClient()
result = client.login('demo_user', 'password123')

if result.get('success'):
    tournaments = client.get_tournaments(status='open')
    print(f"Found {len(tournaments['data'])} open tournaments")
```

### Node.js/Express Middleware
```javascript
const axios = require('axios');

class LFAAPIClient {
    constructor(baseURL = 'https://lfa-legacy-go.ew.r.appspot.com') {
        this.baseURL = baseURL;
        this.token = null;
        
        // Create axios instance with defaults
        this.api = axios.create({
            baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Request interceptor to add auth token
        this.api.interceptors.request.use((config) => {
            if (this.token) {
                config.headers.Authorization = `Bearer ${this.token}`;
            }
            return config;
        });
        
        // Response interceptor to handle errors
        this.api.interceptors.response.use(
            (response) => response.data,
            (error) => {
                if (error.response?.status === 401) {
                    this.token = null; // Clear expired token
                }
                throw error;
            }
        );
    }
    
    async login(username, password) {
        try {
            const data = await this.api.post('/api/auth/login', {
                username,
                password
            });
            
            if (data.success) {
                this.token = data.data.access_token;
                return data.data.user;
            }
            
            throw new Error(data.error?.message || 'Login failed');
        } catch (error) {
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }
    
    async getTournaments(params = {}) {
        return this.api.get('/api/tournaments', { params });
    }
    
    async getUserProfile() {
        return this.api.get('/api/auth/me');
    }
}

// Express middleware example
const lfaAuthMiddleware = (req, res, next) => {
    const client = new LFAAPIClient();
    req.lfa = client;
    next();
};

module.exports = { LFAAPIClient, lfaAuthMiddleware };
```

---

## 📱 Mobile Integration

### Flutter/Dart Example
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class LFAApiService {
  static const String baseUrl = 'https://lfa-legacy-go.ew.r.appspot.com';
  String? _token;
  
  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'username': username,
        'password': password,
      }),
    );
    
    final data = json.decode(response.body);
    
    if (data['success']) {
      _token = data['data']['access_token'];
    }
    
    return data;
  }
  
  Future<Map<String, dynamic>> getTournaments() async {
    if (_token == null) throw Exception('Not authenticated');
    
    final response = await http.get(
      Uri.parse('$baseUrl/api/tournaments'),
      headers: {
        'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      },
    );
    
    return json.decode(response.body);
  }
}
```

---

## 🔍 Testing & Debugging

### Health Checks
```bash
# Basic health check (no auth required)
curl https://lfa-legacy-go.ew.r.appspot.com/health

# Detailed system status
curl https://lfa-legacy-go.ew.r.appspot.com/api/status

# Performance metrics
curl https://lfa-legacy-go.ew.r.appspot.com/api/performance
```

### Test Credentials
```
Username: demo_user
Password: password123
```

### Common Issues & Solutions

#### 1. 401 Unauthorized
```javascript
// Check token format
console.log('Token format:', token.startsWith('eyJ') ? 'Valid JWT' : 'Invalid');

// Check token expiry
const payload = JSON.parse(atob(token.split('.')[1]));
const isExpired = Date.now() >= payload.exp * 1000;
console.log('Token expired:', isExpired);
```

#### 2. 429 Rate Limited
```javascript
// Implement retry with backoff
const retryWithBackoff = async (fn, retries = 3) => {
    try {
        return await fn();
    } catch (error) {
        if (error.response?.status === 429 && retries > 0) {
            const delay = Math.pow(2, 3 - retries) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryWithBackoff(fn, retries - 1);
        }
        throw error;
    }
};
```

#### 3. CORS Issues (Development)
```javascript
// For local development, use proxy or enable CORS
// Production API has CORS enabled for web applications
```

---

## 📈 Performance Optimization

### Caching Strategies
```javascript
// Cache user profile (changes infrequently)
const getUserProfile = async () => {
    const cached = localStorage.getItem('user_profile');
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 300000) { // 5 minutes
            return data;
        }
    }
    
    const profile = await apiCall('GET', '/api/auth/me');
    localStorage.setItem('user_profile', JSON.stringify({
        data: profile,
        timestamp: Date.now()
    }));
    
    return profile;
};
```

### Batch Requests
```javascript
// Instead of multiple individual requests
// Combine related data fetches where possible
const getDashboardData = async () => {
    const [profile, tournaments, friends] = await Promise.all([
        apiCall('GET', '/api/auth/me'),
        apiCall('GET', '/api/tournaments?limit=10'),
        apiCall('GET', '/api/social/friends')
    ]);
    
    return { profile, tournaments, friends };
};
```

---

## 🆘 Support & Resources

### Documentation
- **Interactive Docs:** https://lfa-legacy-go.ew.r.appspot.com/docs
- **Alternative Docs:** https://lfa-legacy-go.ew.r.appspot.com/redoc
- **OpenAPI Spec:** https://lfa-legacy-go.ew.r.appspot.com/openapi.json

### Development Tools
- **Postman Collection:** Import `LFA_Legacy_GO_Postman_Collection.json`
- **Environment File:** Import `LFA_Legacy_GO_Postman_Environment.json`
- **Status Page:** https://lfa-legacy-go.ew.r.appspot.com/health

### Contact
- **Email:** support@lfa-legacy-go.com
- **API Version:** 3.0.0
- **Last Updated:** August 21, 2025

---

## 📝 Changelog

### Version 3.0.0 (Current)
- ✅ Production deployment on Google Cloud
- ✅ 11/11 routers active and documented
- ✅ Comprehensive OpenAPI documentation
- ✅ Standardized response formats
- ✅ JWT authentication with 30-day expiry
- ✅ Rate limiting (100 req/60s)
- ✅ Complete Postman collection
- ✅ Health monitoring endpoints
- ✅ Performance metrics and monitoring

### Upcoming Features
- PostgreSQL database migration
- Real-time notifications via WebSocket
- Advanced tournament brackets
- Mobile push notifications
- Payment integration for credits
- Advanced analytics dashboard

---

**🚀 Ready to build amazing football gaming experiences!**