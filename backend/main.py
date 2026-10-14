import os
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from pydantic import BaseModel
from typing import Optional

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://127.0.0.1/terraces_db")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String)
    social_link = Column(String)
    floorplan = Column(String)
    budget = Column(Integer)
    strict_budget = Column(Boolean, default=False)
    is_group = Column(Boolean, default=False)
    move_in = Column(String)
    cleanliness = Column(String)
    sleep_schedule = Column(String)
    work_setup = Column(String)
    pets = Column(Boolean)
    smoking = Column(Boolean)
    bio = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)
app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware, 
    allow_origins=[FRONTEND_URL],
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ProfileCreate(BaseModel):
    name: str
    email: str
    social_link: Optional[str] = "" # <--- Made optional here
    floorplan: str
    budget: int
    strict_budget: bool
    is_group: bool
    move_in: str
    cleanliness: str
    sleep_schedule: str
    work_setup: str
    pets: bool
    smoking: bool
    bio: str
    bot_check: Optional[str] = ""

@app.on_event("startup")
def populate_dummy_data():
    db = SessionLocal()
    if db.query(Profile).count() == 0:
        db.add_all([
            Profile(name="Alex", email="alex@rice.edu", social_link="linkedin.com/in/alex", floorplan="2 Bed / 2 Bath", budget=1300, strict_budget=True, is_group=False, move_in="2026-11-01", cleanliness="Spotless", sleep_schedule="Early Bird", work_setup="Hybrid", pets=False, smoking=False, bio="Incoming MBA at Rice. Study-focused during the week, need a quiet environment.", created_at=datetime.utcnow()),
            Profile(name="Jordan", email="jordan.tech@gmail.com", social_link="instagram.com/jordan", floorplan="Open to Any", budget=1100, strict_budget=False, is_group=False, move_in="2026-11-15", cleanliness="Lived-in", sleep_schedule="Night Owl", work_setup="Remote", pets=True, smoking=False, bio="Software engineer working from home. I have a 15lb Corgi. Super laid back on weekends.", created_at=datetime.utcnow()),
            Profile(name="Casey & Sam", email="casey@mbb.com", social_link="linkedin.com/in/casey", floorplan="3 Bed / 3 Bath", budget=1200, strict_budget=False, is_group=True, move_in="2026-12-01", cleanliness="Spotless", sleep_schedule="9-to-5", work_setup="In-Office", pets=False, smoking=False, bio="We are two friends looking for a third roommate to split a massive 3-bedroom unit.", created_at=datetime.utcnow()),
            Profile(name="Taylor", email="taylor.med@tmc.edu", social_link="", floorplan="3 Bed / 2 Bath", budget=1250, strict_budget=False, is_group=False, move_in="2026-11-01", cleanliness="Messy", sleep_schedule="Night Owl", work_setup="In-Office", pets=False, smoking=True, bio="Medical resident at TMC. Crazy hours, rarely home. Just need a place to crash and shower.", created_at=datetime.utcnow())
        ])
        db.commit()
    db.close()

@app.get("/profiles")
def get_profiles(db: Session = Depends(get_db)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    return db.query(Profile).filter(Profile.created_at >= thirty_days_ago).order_by(Profile.id.desc()).all()

@app.post("/profiles")
def create_profile(profile: ProfileCreate, db: Session = Depends(get_db)):
    if profile.bot_check:
        return {"message": "Success"}
    
    profile_data = profile.dict(exclude={"bot_check"})
    db_profile = Profile(**profile_data)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

@app.delete("/profiles/{profile_id}")
def delete_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    db.delete(profile)
    db.commit()
    return {"message": "Profile deleted successfully"}
