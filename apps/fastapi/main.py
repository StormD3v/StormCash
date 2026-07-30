from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router
from database import engine, Base
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="StormCash API")

# CORS middleware - configure allowed origins from env var
# For Railway, set CORS_ORIGINS to your frontend domain(s), comma-separated
# Example: CORS_ORIGINS=https://your-frontend.vercel.app,https://localhost:3000
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",") if os.getenv("CORS_ORIGINS") else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api", tags=["transactions"])

# Create tables on startup
@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)

@app.get("/")
async def root():
    return {"message": "StormCash API"}
