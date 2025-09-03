# backend/app/routers/locations.py
# 📍 LFA Legacy GO - Simple Locations Router (No External Dependencies)

from fastapi import APIRouter, Query
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# 📍 SIMPLE DATA STRUCTURES (No Pydantic dependencies)

# Mock locations data - Production ready for Budapest
LOCATIONS_DATA = [
    {
        "id": 1,
        "name": "Budapest Football Arena",
        "address": "Váci út 1-3",
        "city": "Budapest",
        "latitude": 47.4979,
        "longitude": 19.0402,
        "phone": "+36 1 234 5678",
        "email": "info@bfaarena.hu",
        "website": "https://bfaarena.hu",
        "description": "Premium indoor football facility with professional lighting",
        "capacity": 22,
        "price_per_hour": 75.0,
        "facilities": ["Changing rooms", "Parking", "Equipment rental", "LED lighting"],
        "opening_hours": {
            "monday": "06:00-23:00",
            "tuesday": "06:00-23:00", 
            "wednesday": "06:00-23:00",
            "thursday": "06:00-23:00",
            "friday": "06:00-24:00",
            "saturday": "08:00-24:00",
            "sunday": "08:00-22:00"
        },
        "is_active": True,
        "created_at": "2025-01-15T10:30:00Z",
        "rating": 4.8,
        "total_bookings": 156
    },
    {
        "id": 2,
        "name": "Buda Sports Center",
        "address": "Bartók Béla út 89",
        "city": "Budapest",
        "latitude": 47.4850,
        "longitude": 19.0570,
        "phone": "+36 1 345 6789",
        "email": "contact@budasports.hu",
        "website": "https://budasports.hu",
        "description": "Modern football complex with outdoor and indoor pitches",
        "capacity": 18,
        "price_per_hour": 60.0,
        "facilities": ["2 indoor courts", "1 outdoor field", "Parking", "Showers"],
        "opening_hours": {
            "monday": "07:00-22:00",
            "tuesday": "07:00-22:00",
            "wednesday": "07:00-22:00", 
            "thursday": "07:00-22:00",
            "friday": "07:00-23:00",
            "saturday": "09:00-23:00",
            "sunday": "09:00-21:00"
        },
        "is_active": True,
        "created_at": "2025-01-12T14:15:00Z",
        "rating": 4.5,
        "total_bookings": 89
    },
    {
        "id": 3,
        "name": "Pest Football Club",
        "address": "Üllői út 129",
        "city": "Budapest", 
        "latitude": 47.4735,
        "longitude": 19.0965,
        "phone": "+36 1 456 7890",
        "email": "booking@pestfc.hu",
        "website": "https://pestfc.hu",
        "description": "Professional-grade football facility for teams and players",
        "capacity": 24,
        "price_per_hour": 85.0,
        "facilities": ["Professional turf", "Floodlights", "Spectator seating", "Medical room"],
        "opening_hours": {
            "monday": "06:00-22:00",
            "tuesday": "06:00-22:00",
            "wednesday": "06:00-22:00",
            "thursday": "06:00-22:00", 
            "friday": "06:00-23:00",
            "saturday": "08:00-23:00",
            "sunday": "08:00-21:00"
        },
        "is_active": True,
        "created_at": "2025-01-10T09:45:00Z",
        "rating": 4.9,
        "total_bookings": 203
    },
    {
        "id": 4,
        "name": "Green Valley Football Park",
        "address": "Kerepesi út 234",
        "city": "Budapest",
        "latitude": 47.5073,
        "longitude": 19.1045,
        "phone": "+36 1 567 8901",
        "email": "info@greenvalley.hu",
        "website": "https://greenvalley.hu",
        "description": "Eco-friendly football complex with natural grass facilities",
        "capacity": 20,
        "price_per_hour": 55.0,
        "facilities": ["Natural grass", "Solar lighting", "Eco-friendly facilities", "Café"],
        "opening_hours": {
            "monday": "08:00-21:00",
            "tuesday": "08:00-21:00",
            "wednesday": "08:00-21:00",
            "thursday": "08:00-21:00",
            "friday": "08:00-22:00",
            "saturday": "09:00-22:00", 
            "sunday": "09:00-20:00"
        },
        "is_active": True,
        "created_at": "2025-01-08T16:20:00Z",
        "rating": 4.3,
        "total_bookings": 67
    },
    {
        "id": 5,
        "name": "Urban Football Hub",
        "address": "Széchenyi rakpart 5",
        "city": "Budapest",
        "latitude": 47.5015,
        "longitude": 19.0454,
        "phone": "+36 1 678 9012",
        "email": "play@urbanhub.hu", 
        "website": "https://urbanhub.hu",
        "description": "City center facility with rooftop pitches and panoramic views",
        "capacity": 14,
        "price_per_hour": 95.0,
        "facilities": ["Rooftop courts", "City views", "Premium equipment", "Restaurant"],
        "opening_hours": {
            "monday": "10:00-23:00",
            "tuesday": "10:00-23:00",
            "wednesday": "10:00-23:00",
            "thursday": "10:00-23:00",
            "friday": "10:00-24:00",
            "saturday": "10:00-24:00",
            "sunday": "10:00-22:00"
        },
        "is_active": True,
        "created_at": "2025-01-05T11:30:00Z",
        "rating": 4.7,
        "total_bookings": 134
    }
]

# 📍 API ENDPOINTS

@router.get("", tags=["Locations"])
@router.get("/", tags=["Locations"])
async def get_locations(
    city: Optional[str] = Query(None, description="Filter by city"),
    min_price: Optional[float] = Query(None, description="Minimum price per hour"),
    max_price: Optional[float] = Query(None, description="Maximum price per hour"),
    search: Optional[str] = Query(None, description="Search in name and description")
):
    """
    📍 Get all football locations with optional filtering
    
    **Features:**
    - City-based filtering
    - Price range filtering  
    - Text search in name/description
    
    **Returns:**
    - List of locations matching criteria
    """
    try:
        # Start with all active locations
        locations = [loc for loc in LOCATIONS_DATA if loc["is_active"]]
        
        # Apply filters
        if city:
            locations = [loc for loc in locations if loc["city"].lower() == city.lower()]
            
        if min_price is not None:
            locations = [loc for loc in locations if loc["price_per_hour"] >= min_price]
            
        if max_price is not None:
            locations = [loc for loc in locations if loc["price_per_hour"] <= max_price]
            
        if search:
            search_lower = search.lower()
            locations = [
                loc for loc in locations 
                if search_lower in loc["name"].lower() or 
                   search_lower in loc.get("description", "").lower()
            ]
        
        logger.info(f"📍 Retrieved {len(locations)} locations")
        return locations
        
    except Exception as e:
        logger.error(f"📍 Error fetching locations: {str(e)}")
        return {"error": "Failed to fetch locations", "details": str(e)}

@router.get("/health", tags=["Locations"])
async def locations_health_check():
    """📍 Locations service health check"""
    try:
        active_count = len([loc for loc in LOCATIONS_DATA if loc["is_active"]])
        return {
            "status": "healthy",
            "service": "locations",
            "total_locations": len(LOCATIONS_DATA),
            "active_locations": active_count,
            "cities": len(set(loc["city"] for loc in LOCATIONS_DATA)),
            "timestamp": "2025-09-02T12:00:00Z",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"📍 Locations health check failed: {str(e)}")
        return {"status": "unhealthy", "error": str(e)}

@router.get("/cities/list", tags=["Locations"])
async def get_cities():
    """📍 Get list of all cities with locations"""
    try:
        city_stats = {}
        for location in LOCATIONS_DATA:
            if location["is_active"]:
                city = location["city"]
                if city not in city_stats:
                    city_stats[city] = {
                        "name": city,
                        "location_count": 0,
                        "avg_price": 0
                    }
                city_stats[city]["location_count"] += 1
        
        # Calculate average prices
        for city_name, stats in city_stats.items():
            city_locations = [loc for loc in LOCATIONS_DATA if loc["city"] == city_name and loc["is_active"]]
            if city_locations:
                avg_price = sum(loc["price_per_hour"] for loc in city_locations) / len(city_locations)
                stats["avg_price"] = round(avg_price, 2)
        
        logger.info(f"📍 Retrieved {len(city_stats)} cities")
        return {
            "cities": list(city_stats.values()),
            "total_cities": len(city_stats),
            "total_locations": sum(stats["location_count"] for stats in city_stats.values())
        }
        
    except Exception as e:
        logger.error(f"📍 Error fetching cities: {str(e)}")
        return {"error": "Failed to fetch cities", "details": str(e)}

@router.get("/{location_id}", tags=["Locations"])
async def get_location(location_id: int):
    """📍 Get specific location by ID"""
    try:
        location = next((loc for loc in LOCATIONS_DATA if loc["id"] == location_id), None)
        
        if not location:
            return {"error": f"Location with ID {location_id} not found"}
        
        logger.info(f"📍 Retrieved location {location_id}: {location['name']}")
        return location
        
    except Exception as e:
        logger.error(f"📍 Error fetching location {location_id}: {str(e)}")
        return {"error": "Failed to fetch location", "details": str(e)}