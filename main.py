from fastapi import FastAPI, HTTPException, Body, Depends
from pydantic import BaseModel
import requests
from requests.auth import HTTPDigestAuth
import json
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import certifi
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "https://cazahadas.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Todo OK"}


load_dotenv()

PUBLIC_KEY = os.getenv("PUBLIC_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
PROJECT_ID = os.getenv("PROJECT_ID")


class User(BaseModel):
    username: str
    password: str


@app.post("/create-user")
def create_user(user: User):
    print(PUBLIC_KEY, PRIVATE_KEY, PROJECT_ID)

    url = f"https://cloud.mongodb.com/api/atlas/v1.0/groups/{PROJECT_ID}/databaseUsers"

    payload = {
        "databaseName": "admin",
        "groupId": PROJECT_ID,
        "roles": [
            {
                "databaseName": "Cazahadas",
                "collectionName": "Score",
                "roleName": "read",
            }
        ],
        "username": user.username,
        "password": user.password,
    }

    response = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        auth=HTTPDigestAuth(PUBLIC_KEY, PRIVATE_KEY),
        data=json.dumps(payload),
    )

    if response.status_code == 201:
        return {"message": "Usuario creado con éxito"}
    else:
        raise HTTPException(status_code=response.status_code, detail=response.json())


def authenticate_user(username: str, password: str) -> bool:
    try:
        mongo_uri = f"mongodb+srv://{username}:{password}@cluster0.hufeuvx.mongodb.net/Cazahadas?retryWrites=true&w=majority"
        client = MongoClient(mongo_uri, tlsCAFile=certifi.where())

        # Prueba de lectura
        db = client.Cazahadas
        collection = db.Score
        collection.find_one()

        return True
    except Exception as e:
        print(f"❌ Error autenticando usuario: {e}")
        return False


@app.post("/login")
def login(user: User):
    if authenticate_user(user.username, user.password):
        return {"message": "Login exitoso", "username": user.username}
    else:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")


class ScoreUpdate(BaseModel):
    username: str
    password: str


@app.post("/add-score")
def add_score(data: ScoreUpdate):
    try:
        mongo_uri = f"mongodb+srv://{os.getenv('MONGO_RW_USERNAME')}:{os.getenv('MONGO_RW_PASSWORD')}@cluster0.hufeuvx.mongodb.net/Cazahadas?retryWrites=true&w=majority"
        client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
        db = client.Cazahadas
        collection = db.Score

        existing_user = collection.find_one({"username": data.username})

        if existing_user:
            new_score = existing_user.get("score", 0) + 1
            collection.update_one(
                {"username": data.username}, {"$set": {"score": new_score}}
            )
            return {"message": "Puntaje actualizado", "new_score": new_score}
        else:
            collection.insert_one({"username": data.username, "score": 1})
            return {"message": "Nuevo jugador añadido", "score": 1}

    except Exception as e:
        print(f"❌ Error actualizando score: {e}")
        raise HTTPException(
            status_code=500, detail="Error accediendo a la base de datos"
        )

class ScoreOut(BaseModel):
    username: str
    score: int

@app.get("/get-scores", response_model=List[ScoreOut])
def get_scores():
    try:
        mongo_uri = f"mongodb+srv://{os.getenv('MONGO_RW_USERNAME')}:{os.getenv('MONGO_RW_PASSWORD')}@cluster0.hufeuvx.mongodb.net/Cazahadas?retryWrites=true&w=majority"
        client = MongoClient(mongo_uri, tlsCAFile=certifi.where())

        db = client.Cazahadas
        collection = db.Score

        # Obtener todos los documentos ordenados por fairies_captured descendente
        scores = list(collection.find({}, {"_id": 0}).sort("fairies_captured", -1))

        return scores

    except Exception as e:
        print(f"❌ Error al obtener puntuaciones: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener puntuaciones")
