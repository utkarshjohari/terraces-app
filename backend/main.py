from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from pydantic import BaseModel

SQLALCHEMY_DATABASE_URL = "postgresql+psycopg2://127.0.0.1/terraces_db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    budget = Column(Integer)
    move_in = Column(String)
    pets = Column(Boolean)
    bio = Column(String)

Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ProfileCreate(BaseModel):
    name: str
    budget: int
    move_in: str
    pets: bool
    bio: str

@app.on_event("startup")
def populate_dummy_data():
    db = SessionLocal()
    if db.query(Profile).count() == 0:
        db.add_all([
            Profile(name="Alex", budget=1200, move_in="August", pets=False, bio="Incoming MBA at Rice. Quiet during the week, study-focused. Clean common areas are a must."),
            Profile(name="Jordan", budget=1000, move_in="August", pets=True, bio="Works in tech. I have a 10lb French Bulldog. Love cooking on weekends."),
            Profile(name="Casey", budget=1500, move_in="September", pets=False, bio="Management Consultant. Traveling Mon-Thu, so you basically get the place to yourself most of the week.")
        ])
        db.commit()
    db.close()

@app.get("/profiles")
def get_profiles(db: Session = Depends(get_db)):
    # Order by ID descending so the newest profiles show up first!
    return db.query(Profile).order_by(Profile.id.desc()).all()

@app.post("/profiles")
def create_profile(profile: ProfileCreate, db: Session = Depends(get_db)):
    db_profile = Profile(**profile.dict())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile
