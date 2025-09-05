# LFA Legacy GO - Football Gaming Platform

⚡ **Production Deployment** - Updated: 2025-09-05 15:54 UTC

## Current Progress

### ✅ Phase 1: Authentication System
- Complete user authentication with JWT tokens
- Registration, login, password reset functionality
- Role-based access control

### ✅ Phase 2: Core Gaming Features  
- Tournament system with brackets and matches
- Game results tracking and leaderboards
- Weather integration for location-based games
- Social features and friend systems

### ✅ Phase 3: Administration & Management
- Complete admin dashboard with 5-tab interface
- User management with violation tracking
- Bulk operations with progress reporting
- Moderation tools and audit logging
- Migration system with rollback support

## Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
python run_migrations.py up

# Start server
python -m app.main
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Admin Features
After starting both backend and frontend:
1. Login as admin user
2. Navigate to `/admin` for user management
3. Access moderation tools at `/admin/moderation`

## Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/test_moderation_simple.py -v
```

### Frontend Tests
```bash
cd frontend
npm test -- --testPathPattern="moderation-basic"
```

## Database Migrations

### Check Status
```bash
cd backend
python run_migrations.py status
```

### Apply Migration
```bash
python run_migrations.py up
```

### Rollback Migration
```bash
python run_migrations.py down
```

## Documentation
- [Admin System Documentation](docs/admin.md)
- [API Reference](docs/admin.md#api-endpoints)  
- [Database Schema](docs/admin.md#database-schema)

---

**Latest Update**: Phase 3 Administration & Management System - Production Ready ✅
Force rebuild - 2025 Sze  5 Pén 17:42:29 CEST
