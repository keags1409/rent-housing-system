from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, date

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="AURA Forest Lake Resort API")
api_router = APIRouter(prefix="/api")

VILLAS = [
    {
        "id": "villa-01", "tag": "Villa 01", "name": "The Glass A-Frame",
        "tagline": "Panoramic lakefront sanctuary with sky-facing glass ridge",
        "price_per_night": 650, "bedrooms": 2, "bathrooms": 2, "max_guests": 4,
        "sqft": 1450, "rating": 4.96,
        "features": ["Private Sauna", "Deep Soaking Tub", "Glass Observatory Roof", "Deck Kayaks"],
        "images": [
            "https://images.unsplash.com/photo-1762568702039-9ef749e06152?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjBmb3Jlc3QlMjB2aWxsYSUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlJTIwbGFrZSUyMHJldHJlYXR8ZW58MHx8fHwxNzg3MDcyNzYzfDA&ixlib=rb-4.1.0&q=85",
            "https://images.unsplash.com/photo-1768072308445-37bb1b4c9b0e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBmb3Jlc3QlMjB2aWxsYSUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlJTIwbGFrZSUyMHJldHJlYXR8ZW58MHx8fHwxNzg3MDcyNzYzfDA&ixlib=rb-4.1.0&q=85",
            "https://images.pexels.com/photos/30547660/pexels-photo-30547660.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        ],
    },
    {
        "id": "villa-02", "tag": "Villa 02", "name": "Pine Haven Lodge",
        "tagline": "Elevated forest canopy chalet tucked among giant hemlocks",
        "price_per_night": 520, "bedrooms": 3, "bathrooms": 2, "max_guests": 6,
        "sqft": 1980, "rating": 4.92,
        "features": ["Heated Plunge Pool", "Outdoor Firepit", "Cantilevered Balcony", "Chef Kitchen"],
        "images": [
            "https://images.pexels.com/photos/33747710/pexels-photo-33747710.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            "https://images.unsplash.com/photo-1762568702039-9ef749e06152?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjBmb3Jlc3QlMjB2aWxsYSUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlJTIwbGFrZSUyMHJldHJlYXR8ZW58MHx8fHwxNzg3MDcyNzYzfDA&ixlib=rb-4.1.0&q=85",
            "https://images.unsplash.com/photo-1768072308445-37bb1b4c9b0e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBmb3Jlc3QlMjB2aWxsYSUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlJTIwbGFrZSUyMHJldHJlYXR8ZW58MHx8fHwxNzg3MDcyNzYzfDA&ixlib=rb-4.1.0&q=85",
        ],
    },
    {
        "id": "villa-03", "tag": "Villa 03", "name": "Lakefront Sanctuary",
        "tagline": "Overwater pavilion with glass floor viewing harbor",
        "price_per_night": 890, "bedrooms": 4, "bathrooms": 3, "max_guests": 8,
        "sqft": 2650, "rating": 4.99,
        "features": ["Direct Water Dock", "Private Chef Service", "Infrared Sauna", "Zero-G Loungers"],
        "images": [
            "https://images.unsplash.com/photo-1761549148430-85b7abf00f33?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmb3Jlc3QlMjB2aWxsYSUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlJTIwbGFrZSUyMHJldHJlYXR8ZW58MHx8fHwxNzg3MDcyNzYzfDA&ixlib=rb-4.1.0&q=85",
            "https://images.unsplash.com/photo-1768072308445-37bb1b4c9b0e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBmb3Jlc3QlMjB2aWxsYSUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlJTIwbGFrZSUyMHJldHJlYXR8ZW58MHx8fHwxNzg3MDcyNzYzfDA&ixlib=rb-4.1.0&q=85",
            "https://images.pexels.com/photos/33747710/pexels-photo-33747710.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        ],
    },
    {
        "id": "villa-04", "tag": "Villa 04", "name": "Overlook Treehouse",
        "tagline": "Architectural cantilever villa perched high above the cove",
        "price_per_night": 480, "bedrooms": 1, "bathrooms": 1, "max_guests": 2,
        "sqft": 880, "rating": 4.95,
        "features": ["Stargazing Telescope", "360 Forest Glass", "Suspended Hammock Net", "Wine Cellar"],
        "images": [
            "https://images.pexels.com/photos/30547660/pexels-photo-30547660.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            "https://images.unsplash.com/photo-1761549148430-85b7abf00f33?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmb3Jlc3QlMjB2aWxsYSUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlJTIwbGFrZSUyMHJldHJlYXR8ZW58MHx8fHwxNzg3MDcyNzYzfDA&ixlib=rb-4.1.0&q=85",
            "https://images.unsplash.com/photo-1762568702039-9ef749e06152?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjBmb3Jlc3QlMjB2aWxsYSUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlJTIwbGFrZSUyMHJldHJlYXR8ZW58MHx8fHwxNzg3MDcyNzYzfDA&ixlib=rb-4.1.0&q=85",
        ],
    },
    {
        "id": "villa-05", "tag": "Villa 05", "name": "Emerald Cliff Chalet",
        "tagline": "Monolithic stone and timber estate on the sunset ridge",
        "price_per_night": 1150, "bedrooms": 5, "bathrooms": 4, "max_guests": 10,
        "sqft": 4200, "rating": 5.0,
        "features": ["Infinity Edge Pool", "Private Helipad Access", "Outdoor Cinema", "Wine Tasting Lounge"],
        "images": [
            "https://images.unsplash.com/photo-1764346040439-375f6a87019c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBmb3Jlc3QlMjB2aWxsYSUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlJTIwbGFrZSUyMHJldHJlYXR8ZW58MHx8fHwxNzg3MDcyNzYzfDA&ixlib=rb-4.1.0&q=85",
            "https://images.unsplash.com/photo-1768072308445-37bb1b4c9b0e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBmb3Jlc3QlMjB2aWxsYSUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlJTIwbGFrZSUyMHJldHJlYXR8ZW58MHx8fHwxNzg3MDcyNzYzfDA&ixlib=rb-4.1.0&q=85",
            "https://images.pexels.com/photos/33747710/pexels-photo-33747710.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        ],
    },
]

RESORT_FEE = 75


class ReservationCreate(BaseModel):
    villa_id: str
    guest_name: str = Field(min_length=1)
    guest_email: EmailStr
    check_in: date
    check_out: date
    guests: int = Field(ge=1)
    special_requests: Optional[str] = None


class Reservation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    villa_id: str
    villa_name: str
    guest_name: str
    guest_email: str
    check_in: str
    check_out: str
    guests: int
    nights: int
    total_price: int
    special_requests: Optional[str] = None
    status: str = "confirmed"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def overlap_query(villa_id: str, check_in: str, check_out: str):
    return {"villa_id": villa_id, "check_in": {"$lt": check_out}, "check_out": {"$gt": check_in}}


@api_router.get("/")
async def root():
    return {"message": "AURA Forest Lake Resort API"}


@api_router.get("/villas")
async def get_villas():
    return VILLAS


@api_router.get("/availability")
async def get_availability(check_in: str = Query(...), check_out: str = Query(...)):
    if check_out <= check_in:
        raise HTTPException(status_code=400, detail="check_out must be after check_in")
    booked = set()
    for v in VILLAS:
        exists = await db.reservations.find_one(overlap_query(v["id"], check_in, check_out), {"_id": 0, "id": 1})
        if exists:
            booked.add(v["id"])
    return {"booked_villa_ids": sorted(booked)}


@api_router.post("/reservations", response_model=Reservation)
async def create_reservation(payload: ReservationCreate):
    villa = next((v for v in VILLAS if v["id"] == payload.villa_id), None)
    if not villa:
        raise HTTPException(status_code=404, detail="Villa not found")
    if payload.check_out <= payload.check_in:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")
    if payload.guests > villa["max_guests"]:
        raise HTTPException(status_code=400, detail=f"Max {villa['max_guests']} guests for this villa")
    ci, co = payload.check_in.isoformat(), payload.check_out.isoformat()
    conflict = await db.reservations.find_one(overlap_query(payload.villa_id, ci, co))
    if conflict:
        raise HTTPException(status_code=409, detail="Villa is already reserved for these dates")
    nights = (payload.check_out - payload.check_in).days
    reservation = Reservation(
        villa_id=villa["id"], villa_name=villa["name"],
        guest_name=payload.guest_name.strip(), guest_email=payload.guest_email,
        check_in=ci, check_out=co, guests=payload.guests, nights=nights,
        total_price=nights * villa["price_per_night"] + RESORT_FEE,
        special_requests=payload.special_requests,
    )
    await db.reservations.insert_one(reservation.model_dump())
    return reservation


@api_router.get("/reservations", response_model=List[Reservation])
async def list_reservations():
    docs = await db.reservations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.delete("/reservations/{reservation_id}")
async def delete_reservation(reservation_id: str):
    result = await db.reservations.delete_one({"id": reservation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return {"deleted": True}


@api_router.get("/stats")
async def get_stats():
    docs = await db.reservations.find({}, {"_id": 0}).to_list(1000)
    revenue = sum(d.get("total_price", 0) for d in docs)
    return {
        "total_bookings": len(docs),
        "total_revenue": revenue,
        "unique_guests": len({d["guest_email"] for d in docs}),
        "villas_count": len(VILLAS),
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
