from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="StormCash API")

# ── CORS ──────────────────────────────────────────────────────────────────────
# Production origin is hardcoded so a missing or misconfigured CORS_ORIGINS
# env var on Railway never silently blocks the deployed Vercel frontend.
# Env var values are still read and merged on top of the baseline.

_PRODUCTION_ORIGINS = [
    "https://stormcash.vercel.app",
]

_DEV_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
]

_env_raw = os.getenv("CORS_ORIGINS", "")
_env_origins = [o.strip() for o in _env_raw.split(",") if o.strip()]

# Merge: env var → production baseline → dev origins (deduplicated, order preserved)
_all_origins = list(dict.fromkeys(
    _env_origins + _PRODUCTION_ORIGINS + _DEV_ORIGINS))

# CORSMiddleware must be added before any routes are registered.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_all_origins,
    # Covers Vercel preview deployments: https://<hash>-<user>.vercel.app
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(router, prefix="/api", tags=["transactions"])


@app.get("/")
async def root():
    return {"message": "StormCash API"}
