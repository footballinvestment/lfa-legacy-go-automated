# === create_test_tournaments.py ===
# Script to create test tournament data

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from app.database import SessionLocal, engine
from app.models.tournament import Tournament, TournamentType, TournamentFormat, TournamentStatus
from app.models.user import User
from app.models.location import Location

def create_test_tournaments():
    """Create test tournaments for development"""
    
    db = SessionLocal()
    
    try:
        # Ellenőrizzük hogy van-e organizer user (admin)
        organizer = db.query(User).filter(User.user_type == "admin").first()
        if not organizer:
            # Létrehozunk egy teszt admin usert
            organizer = User(
                username="admin",
                email="admin@test.com",
                hashed_password="$2b$12$dummy_hash",  # placeholder
                full_name="System Admin",
                user_type="admin",
                level=10,
                credits=1000
            )
            db.add(organizer)
            db.commit()
            db.refresh(organizer)
            print("✅ Created admin organizer")
        
        # Ellenőrizzük hogy van-e location
        location = db.query(Location).first()
        if not location:
            # Létrehozunk egy teszt location-t
            location = Location(
                location_id="LOC_TEST_001",
                name="Test Arena",
                address="Test Street 123, Budapest",
                latitude=47.4979,
                longitude=19.0402,
                location_type="indoor",
                status="active",
                capacity=50,
                hourly_rate=1000.0
            )
            db.add(location)
            db.commit()
            db.refresh(location)
            print("✅ Created test location")
        
        # Létrehozunk teszt tournament-eket
        tomorrow = datetime.now() + timedelta(days=1)
        tournaments_data = [
            {
                "tournament_id": "TOURN_TEST_001", 
                "name": "Daily Challenge",
                "description": "Daily test tournament for development",
                "tournament_type": TournamentType.DAILY_CHALLENGE,
                "game_type": "GAME1",
                "format": TournamentFormat.SINGLE_ELIMINATION,
                "location_id": location.id,
                "start_time": tomorrow.replace(hour=18, minute=0, second=0, microsecond=0),
                "end_time": tomorrow.replace(hour=20, minute=0, second=0, microsecond=0), 
                "registration_deadline": tomorrow.replace(hour=16, minute=0, second=0, microsecond=0),
                "min_participants": 4,
                "max_participants": 16,
                "entry_fee_credits": 0,
                "prize_distribution": {"1st": 50, "2nd": 30, "3rd": 20},
                "organizer_id": organizer.id,
                "status": TournamentStatus.REGISTRATION
            },
            {
                "tournament_id": "TOURN_TEST_002",
                "name": "Weekend Championship", 
                "description": "Weekend test tournament",
                "tournament_type": TournamentType.WEEKLY_CUP,
                "game_type": "GAME2",
                "format": TournamentFormat.SINGLE_ELIMINATION,
                "location_id": location.id,
                "start_time": tomorrow.replace(hour=14, minute=0, second=0, microsecond=0) + timedelta(days=5),
                "end_time": tomorrow.replace(hour=18, minute=0, second=0, microsecond=0) + timedelta(days=5),
                "registration_deadline": tomorrow.replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=5),
                "min_participants": 8,
                "max_participants": 32,
                "entry_fee_credits": 10,
                "prize_distribution": {"1st": 40, "2nd": 30, "3rd": 20, "4th": 10},
                "organizer_id": organizer.id,
                "status": TournamentStatus.REGISTRATION
            }
        ]
        
        created_count = 0
        for tournament_data in tournaments_data:
            # Ellenőrizzük hogy már létezik-e
            existing = db.query(Tournament).filter(
                Tournament.tournament_id == tournament_data["tournament_id"]
            ).first()
            
            if not existing:
                tournament = Tournament(**tournament_data)
                db.add(tournament)
                created_count += 1
                print(f"✅ Created tournament: {tournament_data['name']}")
            else:
                print(f"⚠️ Tournament already exists: {tournament_data['name']}")
        
        db.commit()
        print(f"\n🎉 Successfully created {created_count} test tournaments!")
        
        # Listázzuk az összes tournament-et
        all_tournaments = db.query(Tournament).all()
        print(f"\n📋 Total tournaments in database: {len(all_tournaments)}")
        for t in all_tournaments:
            print(f"  - {t.name} ({t.status.value})")
            
    except Exception as e:
        print(f"❌ Error creating test tournaments: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🏆 Creating test tournament data...")
    create_test_tournaments()