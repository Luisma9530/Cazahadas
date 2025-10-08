from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
from datetime import datetime, timedelta
import jwt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "https://cazahadas.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración JWT
load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "tu-clave-secreta-muy-segura-cambiala")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

PUBLIC_KEY = os.getenv("PUBLIC_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
PROJECT_ID = os.getenv("PROJECT_ID")

security = HTTPBearer()


@app.get("/")
def home():
    return {"message": "Todo OK"}


class User(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    username: str


def create_access_token(data: dict):
    """Crea un token JWT"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verifica el token JWT y devuelve el username"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


@app.post("/create-user")
def create_user(user: User):
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
        return False


@app.post("/login", response_model=Token)
def login(user: User):
    """Login que devuelve un JWT token"""
    if authenticate_user(user.username, user.password):
        access_token = create_access_token(data={"sub": user.username})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "username": user.username
        }
    else:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")


class ScoreUpdate(BaseModel):
    username: str
    password: str


@app.post("/add-score")
def add_score(username: str = Depends(verify_token)):
    """Añade un punto al usuario autenticado mediante JWT"""
    try:
        mongo_uri = f"mongodb+srv://{os.getenv('MONGO_RW_USERNAME')}:{os.getenv('MONGO_RW_PASSWORD')}@cluster0.hufeuvx.mongodb.net/Cazahadas?retryWrites=true&w=majority"
        client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
        db = client.Cazahadas
        collection = db.Score

        existing_user = collection.find_one({"username": username})

        if existing_user:
            new_score = existing_user.get("score", 0) + 1
            collection.update_one(
                {"username": username}, {"$set": {"score": new_score}}
            )
            return {"message": "Puntaje actualizado", "new_score": new_score}
        else:
            collection.insert_one({"username": username, "score": 1})
            return {"message": "Nuevo jugador añadido", "score": 1}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Error accediendo a la base de datos"
        )


class ScoreOut(BaseModel):
    username: str
    score: int


@app.get("/get-scores", response_model=List[ScoreOut])
def get_scores(username: str = Depends(verify_token)):
    """Obtiene las puntuaciones (requiere autenticación)"""
    try:
        mongo_uri = f"mongodb+srv://{os.getenv('MONGO_RW_USERNAME')}:{os.getenv('MONGO_RW_PASSWORD')}@cluster0.hufeuvx.mongodb.net/Cazahadas?retryWrites=true&w=majority"
        client = MongoClient(mongo_uri, tlsCAFile=certifi.where())

        db = client.Cazahadas
        collection = db.Score

        # Obtener todos los documentos ordenados por score descendente
        scores = list(collection.find({}, {"_id": 0}).sort("score", -1))

        return scores

    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener puntuaciones")