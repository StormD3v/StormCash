from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="StormCash API")

# CORS middleware - configure allowed origins from env var
# For Railway, set CORS_ORIGINS to your frontend domain(s), comma-separated
# Example: CORS_ORIGINS=https://your-frontend.vercel.app,https://localhost:3000
# This will fail loudly if CORS_ORIGINS is not set
cors_origins_env = os.getenv("CORS_ORIGINS")
if not cors_origins_env:
    # Default to common development ports for local development
    cors_origins_env = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002"
cors_origins = cors_origins_env.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api", tags=["transactions"])

@app.get("/")
async def root():
    return {"message": "StormCash API"}
