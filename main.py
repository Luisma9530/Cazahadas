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

"""
Proxy FastAPI de Cazahadas.
Actúa como intermediario entre el frontend React y MongoDB Atlas, resolviendo
las restricciones de seguridad CORS que impiden al navegador acceder directamente
a la base de datos. Gestiona la autenticación de usuarios mediante JWT, la creación
de cuentas en MongoDB Atlas a través de su API de administración, y las operaciones
de lectura y escritura de puntuaciones en la colección Score.
"""

app = FastAPI()

# Configuración de CORS para permitir peticiones desde el cliente React,
# tanto en desarrollo local como desde el dominio de producción en Render.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "https://cazahadas.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración JWT cargada desde variables de entorno.
# SECRET_KEY se utiliza para firmar y verificar los tokens.
# ACCESS_TOKEN_EXPIRE_MINUTES define la validez del token en minutos (24 horas).
load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "tu-clave-secreta-muy-segura-cambiala")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

# Credenciales de la API de administración de MongoDB Atlas,
# utilizadas para crear nuevos usuarios en la base de datos.
PUBLIC_KEY = os.getenv("PUBLIC_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
PROJECT_ID = os.getenv("PROJECT_ID")

# Esquema de seguridad Bearer para extracción del token JWT
# de la cabecera Authorization en los endpoints protegidos.
security = HTTPBearer()


@app.get("/")
def home():
    """
    Endpoint de comprobación de disponibilidad del servicio.
    Devuelve un mensaje de confirmación para verificar que el proxy está activo.
    """
    return {"message": "Todo OK"}


class User(BaseModel):
    """
    Modelo de datos para las peticiones de autenticación y registro.

    Attributes:
        username: Nombre de usuario único que identifica al jugador.
        password: Contraseña del usuario utilizada para autenticar
            la conexión a MongoDB Atlas.
    """
    username: str
    password: str


class Token(BaseModel):
    """
    Modelo de datos para la respuesta del endpoint de login.

    Attributes:
        access_token: Token JWT firmado con validez de 24 horas.
        token_type: Tipo de token, siempre "bearer".
        username: Nombre del usuario autenticado.
    """
    access_token: str
    token_type: str
    username: str


def create_access_token(data: dict):
    """
    Genera un token JWT firmado con los datos proporcionados y una
    fecha de expiración calculada a partir de ACCESS_TOKEN_EXPIRE_MINUTES.

    Args:
        data: Diccionario con los datos a incluir en el payload del token.
            Normalmente contiene la clave "sub" con el nombre de usuario.

    Returns:
        Token JWT codificado como cadena de texto.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Dependencia de FastAPI que verifica la validez del token JWT incluido
    en la cabecera Authorization de la petición. Extrae y devuelve el nombre
    de usuario si el token es válido, o lanza una excepción HTTP 401 si
    el token es inválido o ha expirado.

    Args:
        credentials: Credenciales Bearer extraídas automáticamente por FastAPI
            del esquema de seguridad HTTPBearer.

    Returns:
        Nombre de usuario extraído del campo "sub" del payload del token.

    Raises:
        HTTPException: Con código 401 si el token ha expirado, es inválido
            o no contiene el campo "sub".
    """
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
    """
    Crea un nuevo usuario en MongoDB Atlas mediante la API de administración.
    El usuario se crea con permisos de lectura sobre la colección Score de la
    base de datos Cazahadas, utilizando sus propias credenciales para autenticar
    las consultas de ranking. La autenticación con la API de Atlas se realiza
    mediante HTTP Digest con las claves pública y privada del proyecto.

    Args:
        user: Objeto con el nombre de usuario y contraseña del nuevo jugador.

    Returns:
        Mensaje de confirmación si el usuario se creó correctamente.

    Raises:
        HTTPException: Con el código de estado y detalle devueltos por la API
            de MongoDB Atlas si la creación falla, por ejemplo si el usuario
            ya existe.
    """
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
    """
    Verifica las credenciales de un usuario intentando establecer una conexión
    real a MongoDB Atlas con su nombre de usuario y contraseña. Si la conexión
    y la consulta de prueba tienen éxito, las credenciales son válidas.

    Args:
        username: Nombre de usuario a autenticar.
        password: Contraseña del usuario.

    Returns:
        True si las credenciales son correctas y la conexión se establece
        con éxito, False en cualquier otro caso.
    """
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
    """
    Autentica a un usuario verificando sus credenciales contra MongoDB Atlas
    y genera un token JWT con validez de 24 horas si la autenticación es exitosa.

    Args:
        user: Objeto con el nombre de usuario y contraseña a autenticar.

    Returns:
        Token JWT, tipo de token y nombre de usuario autenticado.

    Raises:
        HTTPException: Con código 401 si las credenciales son incorrectas.
    """
    if authenticate_user(user.username, user.password):
        access_token = create_access_token(data={"sub": user.username})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "username": user.username
        }
    else:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")


@app.post("/add-score")
def add_score(username: str = Depends(verify_token)):
    """
    Incrementa en una unidad el contador de hadas capturadas del usuario
    autenticado. Si el usuario no tiene todavía entrada en la colección Score,
    crea un nuevo documento con puntuación inicial de 1. Utiliza credenciales
    de administrador con permisos de escritura almacenadas en variables de
    entorno, distintas de las credenciales del usuario autenticado.

    Args:
        username: Nombre de usuario extraído del token JWT mediante
            la dependencia verify_token.

    Returns:
        Mensaje de confirmación y nueva puntuación del usuario.

    Raises:
        HTTPException: Con código 500 si se produce un error al acceder
            a la base de datos.
    """
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
    """
    Modelo de datos para la respuesta del endpoint de puntuaciones.

    Attributes:
        username: Nombre del jugador.
        score: Número total de hadas capturadas acumuladas por el jugador.
    """
    username: str
    score: int


@app.get("/get-scores", response_model=List[ScoreOut])
def get_scores():
    """
    Obtiene la lista completa de puntuaciones de todos los jugadores registrados,
    ordenada de mayor a menor número de hadas capturadas. Este endpoint no
    requiere autenticación, permitiendo que cualquier usuario consulte el ranking.

    Returns:
        Lista de objetos ScoreOut con el nombre y puntuación de cada jugador,
        ordenada de forma descendente por puntuación.

    Raises:
        HTTPException: Con código 500 si se produce un error al acceder
            a la base de datos.
    """
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