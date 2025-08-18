# === backend/app/routers/locations.py ===
# TELJES JAVÍTOTT LOCATIONS ROUTER - List import hozzáadva

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional  # ✅ List import hozzáadva
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import math
import logging

from ..database import get_db
from ..models.user import User
from ..models.location import Location, GameDefinition, LocationType, LocationResponse
from ..routers.auth import get_current_user

# Configure logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(tags=["Locations"])

# === PYDANTIC SCHEMAS ===

class LocationCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    address: str = Field(..., min_length=5, max_length=200)
    city: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    capacity: int = Field(..., ge=1, le=100)
    location_type: LocationType
    base_cost_per_hour: float = Field(0.0, ge=0)
    weather_protected: bool = False
    facilities: Optional[Dict[str, Any]] = None

class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    address: Optional[str] = Field(None, min_length=5, max_length=200)
    city: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    capacity: Optional[int] = Field(None, ge=1, le=100)
    base_cost_per_hour: Optional[float] = Field(None, ge=0)
    weather_protected: Optional[bool] = None
    facilities: Optional[Dict[str, Any]] = None

class NearbyLocationSearch(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(10.0, ge=0.1, le=100)
    limit: int = Field(20, ge=1, le=100)

class AvailabilitySlot(BaseModel):
    time: str
    available: bool
    cost: float
    is_peak: bool = False
    weather_suitable: bool = True

class LocationAvailability(BaseModel):
    location_id: int
    date: str
    slots: List[AvailabilitySlot]
    total_slots: int
    available_slots: int
    weather_warnings: List[str] = []

# === HELPER FUNCTIONS ===

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in kilometers"""
    # Haversine formula
    R = 6371  # Earth's radius in kilometers
    
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    
    a = (math.sin(dLat/2) * math.sin(dLat/2) + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dLon/2) * math.sin(dLon/2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    return distance

def generate_availability_slots(location: Location, date: str) -> List[AvailabilitySlot]:
    """Generate availability slots for a location on a specific date"""
    slots = []
    
    # Generate slots from 6:00 to 22:00
    for hour in range(6, 22):
        time_str = f"{hour:02d}:00"
        
        # Simulate availability (in real implementation, check bookings)
        available = True  # Default available
        
        # Peak hours (18:00-21:00) cost more
        is_peak = 18 <= hour < 21
        cost = location.base_cost_per_hour * (1.5 if is_peak else 1.0)
        
        slots.append(AvailabilitySlot(
            time=time_str,
            available=available,
            cost=cost,
            is_peak=is_peak,
            weather_suitable=True
        ))
    
    return slots

def convert_location_to_response(location: Location) -> LocationResponse:
    """Convert Location model to LocationResponse"""
    return LocationResponse(
        id=location.id,
        name=location.name,
        address=location.address,
        city=location.city,
        capacity=location.capacity,
        price_per_hour=location.price_per_hour or location.base_cost_per_hour,
        rating=location.rating or 4.0,
        amenities=location.amenities or [],
        available_slots=location.available_slots or [],
        image_url=location.image_url,
        latitude=location.latitude,
        longitude=location.longitude
    )

# === LOCATION ENDPOINTS ===

@router.get("/", response_model=List[LocationResponse])
async def get_all_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    city: Optional[str] = Query(None),
    location_type: Optional[LocationType] = Query(None),
    db: Session = Depends(get_db)
):
    """📍 Get all locations with optional filtering"""
    try:
        query = db.query(Location).filter(Location.is_active == True)
        
        # Apply filters
        if city:
            query = query.filter(Location.city.ilike(f"%{city}%"))
        
        if location_type:
            query = query.filter(Location.location_type == location_type)
        
        locations = query.offset(skip).limit(limit).all()
        
        # Convert to response format
        response_locations = [convert_location_to_response(loc) for loc in locations]
        
        return response_locations
        
    except Exception as e:
        logger.error(f"❌ Error getting locations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve locations"
        )

@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: int,
    db: Session = Depends(get_db)
):
    """📍 Get a specific location by ID"""
    try:
        location = db.query(Location).filter(
            Location.id == location_id,
            Location.is_active == True
        ).first()
        
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )
        
        return convert_location_to_response(location)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting location {location_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve location"
        )

@router.post("/", response_model=LocationResponse)
async def create_location(
    location_data: LocationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """📍 Create a new location (admin only)"""
    try:
        # Check admin permissions
        if current_user.user_type not in ["admin", "moderator"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Create location
        location = Location(
            location_id=f"loc_{int(datetime.utcnow().timestamp())}",
            name=location_data.name,
            address=location_data.address,
            city=location_data.city,
            description=location_data.description,
            latitude=location_data.latitude,
            longitude=location_data.longitude,
            capacity=location_data.capacity,
            location_type=location_data.location_type,
            base_cost_per_hour=location_data.base_cost_per_hour,
            price_per_hour=location_data.base_cost_per_hour,
            weather_protected=location_data.weather_protected,
            facilities=location_data.facilities or {},
            rating=4.0,
            amenities=[],
            available_slots=[],
            created_at=datetime.utcnow()
        )
        
        db.add(location)
        db.commit()
        db.refresh(location)
        
        logger.info(f"✅ Location created: {location.name} by user {current_user.id}")
        
        return convert_location_to_response(location)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error creating location: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create location"
        )

@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: int,
    location_data: LocationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """📍 Update a location (admin only)"""
    try:
        # Check admin permissions
        if current_user.user_type not in ["admin", "moderator"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Get location
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )
        
        # Update fields
        update_data = location_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(location, field, value)
        
        location.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(location)
        
        logger.info(f"✅ Location updated: {location.name} by user {current_user.id}")
        
        return convert_location_to_response(location)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error updating location {location_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update location"
        )

@router.post("/nearby", response_model=List[Dict])
async def find_nearby_locations(
    search_data: NearbyLocationSearch,
    db: Session = Depends(get_db)
):
    """🗺️ Find locations near given coordinates"""
    try:
        # Get all active locations
        locations = db.query(Location).filter(Location.is_active == True).all()
        
        nearby_locations = []
        for location in locations:
            try:
                distance = calculate_distance(
                    search_data.latitude, search_data.longitude,
                    location.latitude, location.longitude
                )
                
                if distance <= search_data.radius_km:
                    location_dict = convert_location_to_response(location).dict()
                    location_dict["distance_km"] = round(distance, 2)
                    nearby_locations.append(location_dict)
            except:
                continue
        
        # Sort by distance
        nearby_locations.sort(key=lambda x: x["distance_km"])
        
        # Limit results
        nearby_locations = nearby_locations[:search_data.limit]
        
        return nearby_locations
        
    except Exception as e:
        logger.error(f"❌ Error finding nearby locations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to find nearby locations"
        )

@router.get("/{location_id}/availability")
async def get_location_availability(
    location_id: int,
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    """📅 Get availability for a location on a specific date"""
    try:
        # Validate location
        location = db.query(Location).filter(
            Location.id == location_id,
            Location.is_active == True
        ).first()
        
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )
        
        # Validate date format
        try:
            date_obj = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
        
        # Generate availability slots
        slots = generate_availability_slots(location, date)
        available_count = sum(1 for slot in slots if slot.available)
        
        return LocationAvailability(
            location_id=location_id,
            date=date,
            slots=slots,
            total_slots=len(slots),
            available_slots=available_count,
            weather_warnings=[]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting availability for location {location_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get location availability"
        )

@router.get("/games/definitions", response_model=List[Dict])
async def get_game_definitions(db: Session = Depends(get_db)):
    """🎮 Get all available game definitions"""
    try:
        games = db.query(GameDefinition).filter(GameDefinition.is_active == True).all()
        
        game_list = []
        for game in games:
            game_list.append({
                "id": game.id,
                "game_id": game.game_id,
                "name": game.name,
                "description": game.description,
                "min_players": game.min_players,
                "max_players": game.max_players,
                "duration_minutes": game.duration_minutes,
                "difficulty_level": game.difficulty_level,
                "base_credit_cost": game.base_credit_cost,
                "max_possible_score": game.max_possible_score,
                "equipment_required": game.equipment_required,
                "space_requirements": game.space_requirements
            })
        
        return game_list
        
    except Exception as e:
        logger.error(f"❌ Error getting game definitions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve game definitions"
        )

@router.delete("/{location_id}")
async def delete_location(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """🗑️ Delete a location (admin only)"""
    try:
        # Check admin permissions
        if current_user.user_type not in ["admin", "moderator"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Get location
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )
        
        # Soft delete (mark as inactive)
        location.is_active = False
        location.updated_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"✅ Location deleted: {location.name} by user {current_user.id}")
        
        return {
            "success": True,
            "message": f"Location {location.name} has been deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error deleting location {location_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete location"
        )

# === STATISTICS ENDPOINTS ===

@router.get("/stats/overview")
async def get_locations_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """📊 Get location statistics overview"""
    try:
        total_locations = db.query(Location).filter(Location.is_active == True).count()
        
        # Count by type
        outdoor_count = db.query(Location).filter(
            Location.is_active == True,
            Location.location_type == LocationType.OUTDOOR
        ).count()
        
        indoor_count = db.query(Location).filter(
            Location.is_active == True,
            Location.location_type == LocationType.INDOOR
        ).count()
        
        # Get average rating
        locations = db.query(Location).filter(Location.is_active == True).all()
        avg_rating = sum(loc.rating or 4.0 for loc in locations) / len(locations) if locations else 0
        
        return {
            "total_locations": total_locations,
            "outdoor_locations": outdoor_count,
            "indoor_locations": indoor_count,
            "average_rating": round(avg_rating, 1),
            "cities_covered": len(set(loc.city for loc in locations if loc.city)),
            "total_capacity": sum(loc.capacity for loc in locations)
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting location stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve location statistics"
        )

# === HEALTH CHECK ===

@router.get("/health")
async def locations_health_check():
    """🏥 Locations service health check"""
    return {
        "status": "healthy",
        "service": "locations",
        "features": {
            "location_management": "active",
            "availability_check": "active",
            "nearby_search": "active",
            "game_definitions": "active",
            "admin_operations": "active"
        }
    }

# Export router
print("✅ Locations router imported successfully")