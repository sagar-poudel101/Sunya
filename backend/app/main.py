# app/main.py
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth, incidents, whistleblow, assistant, news, directory

# Create SQLite tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Antara Backend API")

# Allow Vite frontend (port 5173) to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(incidents.router)
app.include_router(whistleblow.router)
app.include_router(assistant.router)
app.include_router(news.router)
app.include_router(directory.router)

@app.get("/")
def root():
    return {"status": "Antara API Server is live"}