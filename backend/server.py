from fastapi import FastAPI, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import random
import string
import asyncio
from dotenv import load_dotenv
import cloudinary
import cloudinary.utils
import time

load_dotenv()

app = FastAPI(title="Finde R API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "finder_db")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
rooms_collection = db["rooms"]
chats_collection = db["chats"]
messages_collection = db["messages"]
bookings_collection = db["bookings"]
favorites_collection = db["favorites"]
otp_collection = db["otps"]
notifications_collection = db["notifications"]

# JWT settings
JWT_SECRET = os.environ.get("JWT_SECRET", "finder_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = 7  # days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Cloudinary setup
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

# WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.typing_users: Dict[str, str] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.typing_users:
            del self.typing_users[user_id]
    
    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)
    
    async def broadcast_to_chat(self, message: dict, chat_id: str, exclude_user: str = None):
        chat = await chats_collection.find_one({"_id": ObjectId(chat_id)})
        if chat:
            for user_id in chat.get("participants", []):
                if user_id != exclude_user and user_id in self.active_connections:
                    await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

# Pydantic models
class UserCreate(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None

class OTPVerify(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    otp: str

class ProfileSetup(BaseModel):
    name: str
    gender: str
    occupation: str
    profile_image: Optional[str] = None

class RoomCreate(BaseModel):
    title: str
    description: str
    room_type: str  # PG, Flat, Shared, Hostel
    price: int
    deposit: int
    maintenance: Optional[int] = 0
    electricity: Optional[str] = "Included"
    location: Dict[str, Any]  # {address, city, area, lat, lng}
    amenities: List[str] = []
    rules: List[str] = []
    furnishing: str  # Furnished, Semi-Furnished, Unfurnished
    gender_preference: str  # Male, Female, Any
    images: List[str] = []
    available_from: Optional[str] = None
    owner_type: str  # Owner, Broker

class RoomFilter(BaseModel):
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    room_type: Optional[str] = None
    gender: Optional[str] = None
    furnishing: Optional[str] = None
    amenities: Optional[List[str]] = None
    city: Optional[str] = None
    area: Optional[str] = None
    owner_type: Optional[str] = None

class BookingCreate(BaseModel):
    room_id: str
    date: str
    time_slot: str
    message: Optional[str] = None

class MessageCreate(BaseModel):
    chat_id: str
    content: str
    message_type: str = "text"  # text, image, voice

# Helper functions
def serialize_doc(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

async def get_current_user(token: str = Query(..., alias="token")):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return serialize_doc(user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

# Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Auth routes
@app.post("/api/auth/send-otp")
async def send_otp(user: UserCreate):
    identifier = user.phone or user.email
    if not identifier:
        raise HTTPException(status_code=400, detail="Phone or email required")
    
    # Rate limiting check
    recent_otp = await otp_collection.find_one({
        "$or": [{"phone": user.phone}, {"email": user.email}],
        "created_at": {"$gte": datetime.now(timezone.utc) - timedelta(seconds=60)}
    })
    if recent_otp:
        raise HTTPException(status_code=429, detail="Please wait before requesting another OTP")
    
    otp = generate_otp()
    await otp_collection.insert_one({
        "phone": user.phone,
        "email": user.email,
        "otp": otp,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
    })
    
    # Mock OTP - in production, send via Twilio/email
    return {"message": "OTP sent successfully", "otp_for_testing": otp}

@app.post("/api/auth/verify-otp")
async def verify_otp(data: OTPVerify):
    identifier = data.phone or data.email
    if not identifier:
        raise HTTPException(status_code=400, detail="Phone or email required")
    
    otp_record = await otp_collection.find_one({
        "$or": [{"phone": data.phone}, {"email": data.email}],
        "otp": data.otp,
        "expires_at": {"$gte": datetime.now(timezone.utc)}
    })
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Delete used OTP
    await otp_collection.delete_one({"_id": otp_record["_id"]})
    
    # Find or create user
    query = {"phone": data.phone} if data.phone else {"email": data.email}
    user = await users_collection.find_one(query)
    
    is_new_user = False
    if not user:
        is_new_user = True
        user_doc = {
            "phone": data.phone,
            "email": data.email,
            "name": None,
            "profile_complete": False,
            "role": "user",
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        result = await users_collection.insert_one(user_doc)
        user = await users_collection.find_one({"_id": result.inserted_id})
    
    token = create_token(str(user["_id"]))
    return {
        "token": token,
        "user": serialize_doc(user),
        "is_new_user": is_new_user
    }

@app.put("/api/auth/profile")
async def setup_profile(profile: ProfileSetup, user: dict = Depends(get_current_user)):
    await users_collection.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {
            "name": profile.name,
            "gender": profile.gender,
            "occupation": profile.occupation,
            "profile_image": profile.profile_image,
            "profile_complete": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    updated_user = await users_collection.find_one({"_id": ObjectId(user["id"])})
    return {"user": serialize_doc(updated_user)}

@app.get("/api/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"user": user}

@app.delete("/api/auth/account")
async def delete_account(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    await users_collection.delete_one({"_id": ObjectId(user_id)})
    await rooms_collection.delete_many({"owner_id": user_id})
    await favorites_collection.delete_many({"user_id": user_id})
    await bookings_collection.delete_many({"$or": [{"user_id": user_id}, {"owner_id": user_id}]})
    return {"message": "Account deleted successfully"}

# Room routes
@app.post("/api/rooms")
async def create_room(room: RoomCreate, user: dict = Depends(get_current_user)):
    room_doc = {
        **room.model_dump(),
        "owner_id": user["id"],
        "owner_name": user.get("name", "Owner"),
        "owner_phone": user.get("phone"),
        "status": "active",
        "verified": False,
        "views": 0,
        "clicks": 0,
        "leads": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await rooms_collection.insert_one(room_doc)
    created_room = await rooms_collection.find_one({"_id": result.inserted_id})
    return {"room": serialize_doc(created_room)}

@app.get("/api/rooms")
async def get_rooms(
    page: int = 1,
    limit: int = 20,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    room_type: Optional[str] = None,
    gender: Optional[str] = None,
    furnishing: Optional[str] = None,
    city: Optional[str] = None,
    area: Optional[str] = None,
    owner_type: Optional[str] = None,
    amenities: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: int = -1
):
    query = {"status": "active"}
    
    if min_price:
        query["price"] = {"$gte": min_price}
    if max_price:
        query.setdefault("price", {})["$lte"] = max_price
    if room_type:
        query["room_type"] = room_type
    if gender:
        query["gender_preference"] = {"$in": [gender, "Any"]}
    if furnishing:
        query["furnishing"] = furnishing
    if city:
        query["location.city"] = {"$regex": city, "$options": "i"}
    if area:
        query["location.area"] = {"$regex": area, "$options": "i"}
    if owner_type:
        query["owner_type"] = owner_type
    if amenities:
        amenity_list = amenities.split(",")
        query["amenities"] = {"$all": amenity_list}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"location.area": {"$regex": search, "$options": "i"}},
            {"location.city": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    cursor = rooms_collection.find(query, {"_id": 1, "title": 1, "price": 1, "deposit": 1, 
                                            "location": 1, "room_type": 1, "images": 1, 
                                            "verified": 1, "gender_preference": 1, "furnishing": 1,
                                            "amenities": 1, "created_at": 1})
    cursor = cursor.sort(sort_by, sort_order).skip(skip).limit(limit)
    rooms = await cursor.to_list(length=limit)
    total = await rooms_collection.count_documents(query)
    
    return {
        "rooms": serialize_docs(rooms),
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/rooms/{room_id}")
async def get_room(room_id: str):
    room = await rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Increment views
    await rooms_collection.update_one(
        {"_id": ObjectId(room_id)},
        {"$inc": {"views": 1}}
    )
    
    return {"room": serialize_doc(room)}

@app.put("/api/rooms/{room_id}")
async def update_room(room_id: str, room: RoomCreate, user: dict = Depends(get_current_user)):
    existing = await rooms_collection.find_one({"_id": ObjectId(room_id), "owner_id": user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Room not found or not authorized")
    
    await rooms_collection.update_one(
        {"_id": ObjectId(room_id)},
        {"$set": {**room.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated = await rooms_collection.find_one({"_id": ObjectId(room_id)})
    return {"room": serialize_doc(updated)}

@app.delete("/api/rooms/{room_id}")
async def delete_room(room_id: str, user: dict = Depends(get_current_user)):
    result = await rooms_collection.delete_one({"_id": ObjectId(room_id), "owner_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Room not found or not authorized")
    return {"message": "Room deleted successfully"}

@app.get("/api/rooms/owner/my-rooms")
async def get_my_rooms(user: dict = Depends(get_current_user)):
    cursor = rooms_collection.find({"owner_id": user["id"]})
    rooms = await cursor.to_list(length=100)
    return {"rooms": serialize_docs(rooms)}

@app.get("/api/rooms/owner/analytics")
async def get_analytics(user: dict = Depends(get_current_user)):
    cursor = rooms_collection.find({"owner_id": user["id"]})
    rooms = await cursor.to_list(length=100)
    
    total_views = sum(r.get("views", 0) for r in rooms)
    total_clicks = sum(r.get("clicks", 0) for r in rooms)
    total_leads = sum(r.get("leads", 0) for r in rooms)
    
    return {
        "total_rooms": len(rooms),
        "total_views": total_views,
        "total_clicks": total_clicks,
        "total_leads": total_leads,
        "conversion_rate": round((total_leads / total_views * 100), 2) if total_views > 0 else 0
    }

# Favorites routes
@app.post("/api/favorites/{room_id}")
async def add_favorite(room_id: str, user: dict = Depends(get_current_user)):
    existing = await favorites_collection.find_one({"user_id": user["id"], "room_id": room_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")
    
    await favorites_collection.insert_one({
        "user_id": user["id"],
        "room_id": room_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Added to favorites"}

@app.delete("/api/favorites/{room_id}")
async def remove_favorite(room_id: str, user: dict = Depends(get_current_user)):
    result = await favorites_collection.delete_one({"user_id": user["id"], "room_id": room_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not in favorites")
    return {"message": "Removed from favorites"}

@app.get("/api/favorites")
async def get_favorites(user: dict = Depends(get_current_user)):
    cursor = favorites_collection.find({"user_id": user["id"]})
    favorites = await cursor.to_list(length=100)
    room_ids = [ObjectId(f["room_id"]) for f in favorites]
    
    if not room_ids:
        return {"rooms": []}
    
    cursor = rooms_collection.find({"_id": {"$in": room_ids}})
    rooms = await cursor.to_list(length=100)
    return {"rooms": serialize_docs(rooms)}

# Chat routes
@app.post("/api/chats")
async def create_or_get_chat(room_id: str, user: dict = Depends(get_current_user)):
    room = await rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    owner_id = room["owner_id"]
    user_id = user["id"]
    
    if owner_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")
    
    # Check existing chat
    existing = await chats_collection.find_one({
        "room_id": room_id,
        "participants": {"$all": [user_id, owner_id]}
    })
    
    if existing:
        return {"chat": serialize_doc(existing)}
    
    # Create new chat
    chat_doc = {
        "room_id": room_id,
        "room_title": room["title"],
        "participants": [user_id, owner_id],
        "last_message": None,
        "last_message_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await chats_collection.insert_one(chat_doc)
    
    # Increment leads
    await rooms_collection.update_one({"_id": ObjectId(room_id)}, {"$inc": {"leads": 1}})
    
    chat = await chats_collection.find_one({"_id": result.inserted_id})
    return {"chat": serialize_doc(chat)}

@app.get("/api/chats")
async def get_chats(user: dict = Depends(get_current_user)):
    cursor = chats_collection.find({"participants": user["id"]}).sort("last_message_at", -1)
    chats = await cursor.to_list(length=100)
    
    # Get participant details
    for chat in chats:
        other_id = next((p for p in chat["participants"] if p != user["id"]), None)
        if other_id:
            other_user = await users_collection.find_one({"_id": ObjectId(other_id)})
            chat["other_user"] = serialize_doc(other_user) if other_user else None
    
    return {"chats": serialize_docs(chats)}

@app.get("/api/chats/{chat_id}/messages")
async def get_messages(chat_id: str, user: dict = Depends(get_current_user)):
    chat = await chats_collection.find_one({"_id": ObjectId(chat_id)})
    if not chat or user["id"] not in chat["participants"]:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    cursor = messages_collection.find({"chat_id": chat_id}).sort("created_at", 1)
    messages = await cursor.to_list(length=500)
    
    # Mark as seen
    await messages_collection.update_many(
        {"chat_id": chat_id, "sender_id": {"$ne": user["id"]}, "seen": False},
        {"$set": {"seen": True, "seen_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"messages": serialize_docs(messages)}

@app.post("/api/chats/{chat_id}/messages")
async def send_message(chat_id: str, message: MessageCreate, user: dict = Depends(get_current_user)):
    chat = await chats_collection.find_one({"_id": ObjectId(chat_id)})
    if not chat or user["id"] not in chat["participants"]:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    msg_doc = {
        "chat_id": chat_id,
        "sender_id": user["id"],
        "sender_name": user.get("name", "User"),
        "content": message.content,
        "message_type": message.message_type,
        "seen": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await messages_collection.insert_one(msg_doc)
    
    # Update chat
    await chats_collection.update_one(
        {"_id": ObjectId(chat_id)},
        {"$set": {"last_message": message.content, "last_message_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    created_msg = await messages_collection.find_one({"_id": result.inserted_id})
    serialized = serialize_doc(created_msg)
    
    # Broadcast via WebSocket
    await manager.broadcast_to_chat({
        "type": "new_message",
        "message": serialized
    }, chat_id, user["id"])
    
    return {"message": serialized}

# Booking routes
@app.post("/api/bookings")
async def create_booking(booking: BookingCreate, user: dict = Depends(get_current_user)):
    room = await rooms_collection.find_one({"_id": ObjectId(booking.room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    booking_doc = {
        "room_id": booking.room_id,
        "room_title": room["title"],
        "user_id": user["id"],
        "user_name": user.get("name", "User"),
        "user_phone": user.get("phone"),
        "owner_id": room["owner_id"],
        "date": booking.date,
        "time_slot": booking.time_slot,
        "message": booking.message,
        "status": "pending",  # pending, approved, rejected, completed
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await bookings_collection.insert_one(booking_doc)
    created = await bookings_collection.find_one({"_id": result.inserted_id})
    return {"booking": serialize_doc(created)}

@app.get("/api/bookings")
async def get_bookings(user: dict = Depends(get_current_user)):
    cursor = bookings_collection.find({
        "$or": [{"user_id": user["id"]}, {"owner_id": user["id"]}]
    }).sort("created_at", -1)
    bookings = await cursor.to_list(length=100)
    return {"bookings": serialize_docs(bookings)}

@app.put("/api/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: str, user: dict = Depends(get_current_user)):
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if status not in ["approved", "rejected", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": f"Booking {status}"}

# Notifications
@app.get("/api/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    cursor = notifications_collection.find({"user_id": user["id"]}).sort("created_at", -1).limit(50)
    notifications = await cursor.to_list(length=50)
    return {"notifications": serialize_docs(notifications)}

@app.put("/api/notifications/read")
async def mark_notifications_read(user: dict = Depends(get_current_user)):
    await notifications_collection.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "Notifications marked as read"}

# Cloudinary signature
@app.get("/api/cloudinary/signature")
async def get_cloudinary_signature(
    resource_type: str = Query("image", enum=["image", "video"]),
    folder: str = "rooms"
):
    allowed_folders = ("rooms", "users", "chat")
    if folder not in allowed_folders:
        raise HTTPException(status_code=400, detail="Invalid folder")
    
    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "folder": f"finder/{folder}",
        "resource_type": resource_type
    }
    
    api_secret = os.environ.get("CLOUDINARY_API_SECRET")
    if not api_secret:
        raise HTTPException(status_code=500, detail="Cloudinary not configured")
    
    signature = cloudinary.utils.api_sign_request(params, api_secret)
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.environ.get("CLOUDINARY_API_KEY"),
        "folder": f"finder/{folder}",
        "resource_type": resource_type
    }

# AI search (using OpenAI)
@app.post("/api/ai/search")
async def ai_search(query: str = Query(...), user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    try:
        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            session_id=f"search_{user['id']}",
            system_message="""You are a room search assistant. Extract search parameters from natural language queries.
            Return a JSON object with these fields (only include if mentioned):
            - min_price: number
            - max_price: number
            - room_type: "PG", "Flat", "Shared", or "Hostel"
            - gender: "Male", "Female", or "Any"
            - city: string
            - area: string
            - amenities: array of strings
            - furnishing: "Furnished", "Semi-Furnished", or "Unfurnished"
            
            Example: "room under ₹8000 near metro" -> {"max_price": 8000, "amenities": ["Near Metro"]}
            """
        ).with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=query))
        
        import json
        # Try to parse JSON from response
        try:
            # Find JSON in response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start >= 0 and end > start:
                params = json.loads(response[start:end])
            else:
                params = {}
        except:
            params = {}
        
        return {"query": query, "parsed_params": params}
    except Exception as e:
        return {"query": query, "parsed_params": {}, "error": str(e)}

# AI recommendations
@app.get("/api/ai/recommendations")
async def get_recommendations(user: dict = Depends(get_current_user)):
    # Get user's search history and favorites
    favorites = await favorites_collection.find({"user_id": user["id"]}).to_list(length=10)
    
    # Simple recommendation: get similar rooms based on favorites
    if favorites:
        fav_room_ids = [ObjectId(f["room_id"]) for f in favorites]
        fav_rooms = await rooms_collection.find({"_id": {"$in": fav_room_ids}}).to_list(length=10)
        
        if fav_rooms:
            # Get rooms with similar price range and type
            avg_price = sum(r.get("price", 0) for r in fav_rooms) // len(fav_rooms)
            room_types = list(set(r.get("room_type") for r in fav_rooms))
            
            cursor = rooms_collection.find({
                "_id": {"$nin": fav_room_ids},
                "status": "active",
                "price": {"$gte": avg_price - 2000, "$lte": avg_price + 2000},
                "room_type": {"$in": room_types} if room_types else {"$exists": True}
            }).limit(10)
            
            recommendations = await cursor.to_list(length=10)
            return {"rooms": serialize_docs(recommendations), "reason": "Based on your favorites"}
    
    # Default: return recent popular rooms
    cursor = rooms_collection.find({"status": "active"}).sort("views", -1).limit(10)
    rooms = await cursor.to_list(length=10)
    return {"rooms": serialize_docs(rooms), "reason": "Popular rooms"}

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "typing":
                chat_id = data.get("chat_id")
                await manager.broadcast_to_chat({
                    "type": "typing",
                    "user_id": user_id,
                    "chat_id": chat_id
                }, chat_id, user_id)
            
            elif data.get("type") == "seen":
                chat_id = data.get("chat_id")
                await messages_collection.update_many(
                    {"chat_id": chat_id, "sender_id": {"$ne": user_id}, "seen": False},
                    {"$set": {"seen": True, "seen_at": datetime.now(timezone.utc).isoformat()}}
                )
                await manager.broadcast_to_chat({
                    "type": "seen",
                    "chat_id": chat_id,
                    "user_id": user_id
                }, chat_id, user_id)
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Seed data endpoint (for testing)
@app.post("/api/seed")
async def seed_data():
    # Check if already seeded
    count = await rooms_collection.count_documents({})
    if count > 0:
        return {"message": "Data already seeded", "rooms_count": count}
    
    sample_rooms = [
        {
            "title": "Spacious 1BHK near Metro Station",
            "description": "Fully furnished 1BHK apartment with modern amenities. Walking distance to metro station. Perfect for working professionals.",
            "room_type": "Flat",
            "price": 12000,
            "deposit": 24000,
            "maintenance": 1000,
            "electricity": "Extra",
            "location": {
                "address": "Block A, Sector 15",
                "city": "Noida",
                "area": "Sector 15",
                "lat": 28.5855,
                "lng": 77.3097
            },
            "amenities": ["WiFi", "AC", "Parking", "Near Metro", "Gym", "Power Backup"],
            "rules": ["No Smoking", "No Pets", "No Loud Music after 10 PM"],
            "furnishing": "Furnished",
            "gender_preference": "Any",
            "images": ["https://images.pexels.com/photos/5417293/pexels-photo-5417293.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"],
            "available_from": "2024-02-01",
            "owner_type": "Owner",
            "owner_id": "system",
            "owner_name": "Rahul Sharma",
            "owner_phone": "+91 9876543210",
            "status": "active",
            "verified": True,
            "views": 245,
            "clicks": 89,
            "leads": 12,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "title": "Cozy PG for Girls - All Meals Included",
            "description": "Safe and secure PG accommodation for girls. Home-cooked meals, laundry service, and 24/7 security.",
            "room_type": "PG",
            "price": 8500,
            "deposit": 8500,
            "maintenance": 0,
            "electricity": "Included",
            "location": {
                "address": "Model Town",
                "city": "Delhi",
                "area": "Model Town",
                "lat": 28.7153,
                "lng": 77.1925
            },
            "amenities": ["WiFi", "Meals", "Laundry", "Security", "Power Backup"],
            "rules": ["Girls Only", "Visitors allowed till 8 PM", "Gate closes at 10 PM"],
            "furnishing": "Furnished",
            "gender_preference": "Female",
            "images": ["https://images.pexels.com/photos/7683897/pexels-photo-7683897.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"],
            "available_from": "2024-01-15",
            "owner_type": "Owner",
            "owner_id": "system",
            "owner_name": "Mrs. Gupta",
            "owner_phone": "+91 9876543211",
            "status": "active",
            "verified": True,
            "views": 189,
            "clicks": 67,
            "leads": 23,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "title": "Shared Room - Budget Friendly",
            "description": "Sharing room in 2BHK flat. Suitable for students and freshers. Rent includes WiFi and maid service.",
            "room_type": "Shared",
            "price": 5500,
            "deposit": 5500,
            "maintenance": 500,
            "electricity": "Extra",
            "location": {
                "address": "Koramangala",
                "city": "Bangalore",
                "area": "Koramangala",
                "lat": 12.9352,
                "lng": 77.6245
            },
            "amenities": ["WiFi", "Maid", "Washing Machine", "Kitchen"],
            "rules": ["No Smoking", "Vegetarian Preferred"],
            "furnishing": "Semi-Furnished",
            "gender_preference": "Male",
            "images": ["https://images.pexels.com/photos/36411037/pexels-photo-36411037.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"],
            "available_from": "2024-01-20",
            "owner_type": "Broker",
            "owner_id": "system",
            "owner_name": "Property Solutions",
            "owner_phone": "+91 9876543212",
            "status": "active",
            "verified": False,
            "views": 312,
            "clicks": 134,
            "leads": 45,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "title": "Premium Hostel near IT Park",
            "description": "Modern hostel with single and double occupancy rooms. Food court, gym, and recreation room available.",
            "room_type": "Hostel",
            "price": 7000,
            "deposit": 14000,
            "maintenance": 0,
            "electricity": "Included",
            "location": {
                "address": "Hinjewadi Phase 1",
                "city": "Pune",
                "area": "Hinjewadi",
                "lat": 18.5912,
                "lng": 73.7389
            },
            "amenities": ["WiFi", "Gym", "Food Court", "Recreation Room", "Laundry", "Parking"],
            "rules": ["ID Required", "Guest Entry Register"],
            "furnishing": "Furnished",
            "gender_preference": "Any",
            "images": ["https://images.unsplash.com/photo-1749703824872-3548e51ebdf2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2ODh8MHwxfHNlYXJjaHwzfHxtaW5pbWFsaXN0JTIwYmVkcm9vbSUyMG1vZGVybnxlbnwwfHx8fDE3NzQzMzkxMjZ8MA&ixlib=rb-4.1.0&q=85"],
            "available_from": "2024-02-01",
            "owner_type": "Owner",
            "owner_id": "system",
            "owner_name": "Stay Hub",
            "owner_phone": "+91 9876543213",
            "status": "active",
            "verified": True,
            "views": 156,
            "clicks": 78,
            "leads": 18,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "title": "2BHK Apartment in Gated Society",
            "description": "Spacious 2BHK in premium gated society with swimming pool, clubhouse, and 24/7 security.",
            "room_type": "Flat",
            "price": 18000,
            "deposit": 50000,
            "maintenance": 2500,
            "electricity": "Extra",
            "location": {
                "address": "Whitefield",
                "city": "Bangalore",
                "area": "Whitefield",
                "lat": 12.9698,
                "lng": 77.7500
            },
            "amenities": ["Swimming Pool", "Gym", "Clubhouse", "Parking", "Security", "Power Backup", "AC"],
            "rules": ["Family Preferred", "No Pets"],
            "furnishing": "Furnished",
            "gender_preference": "Any",
            "images": ["https://images.pexels.com/photos/5417293/pexels-photo-5417293.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"],
            "available_from": "2024-02-15",
            "owner_type": "Owner",
            "owner_id": "system",
            "owner_name": "Vinay Kumar",
            "owner_phone": "+91 9876543214",
            "status": "active",
            "verified": True,
            "views": 89,
            "clicks": 34,
            "leads": 8,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "title": "Budget Room near University",
            "description": "Affordable single room perfect for students. Close to university campus with study-friendly environment.",
            "room_type": "PG",
            "price": 4500,
            "deposit": 4500,
            "maintenance": 0,
            "electricity": "Included",
            "location": {
                "address": "Vijay Nagar",
                "city": "Delhi",
                "area": "Vijay Nagar",
                "lat": 28.6945,
                "lng": 77.2063
            },
            "amenities": ["WiFi", "Study Table", "Power Backup"],
            "rules": ["Students Only", "No Smoking"],
            "furnishing": "Semi-Furnished",
            "gender_preference": "Male",
            "images": ["https://images.pexels.com/photos/7683897/pexels-photo-7683897.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"],
            "available_from": "2024-01-25",
            "owner_type": "Owner",
            "owner_id": "system",
            "owner_name": "Suresh Ji",
            "owner_phone": "+91 9876543215",
            "status": "active",
            "verified": False,
            "views": 423,
            "clicks": 198,
            "leads": 67,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await rooms_collection.insert_many(sample_rooms)
    return {"message": "Seed data created", "rooms_count": len(sample_rooms)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
