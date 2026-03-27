import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# --- FIREBASE SETUP ---
# GitHub Secrets में आपने जो नाम रखा है (जैसे FIREBASEFINDER) वही यहाँ लिखें
secret_name = "FIREBASEFINDER" 
firebase_creds_json = os.getenv(secret_name)

if firebase_creds_json:
    try:
        creds_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(creds_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase Connected Successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print(f"⚠️ Warning: Secret '{secret_name}' not found.")

# --- DATA MODEL ---
class User(BaseModel):
    name: str
    email: str
    phone: str

@app.get("/")
async def root():
    return {"message": "Finde R Backend is Live!"}

# --- ENDPOINT TO SAVE DATA ---
@app.post("/add-user")
async def add_user(user: User):
    try:
        doc_ref = db.collection("users").document()
        doc_ref.set(user.dict())
        return {"status": "success", "user_id": doc_ref.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
