from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router
from database import engine, Base

app = FastAPI(title="StormCash API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
