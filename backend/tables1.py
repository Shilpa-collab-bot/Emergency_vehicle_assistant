from sqlalchemy import Column,Integer,String,ForeignKey,Float,Boolean,Text
from .database1 import *
from sqlalchemy.orm import relationship
class User(Base):
    __tablename__="users"
    id=Column(Integer,primary_key=True,autoincrement=True,index=True)
    full_name=Column(String,nullable=False)
    phone=Column(String,unique=True)
    email=Column(String,unique=True,nullable=False)
    password=Column(String,nullable=False)
    role=Column(String,nullable=False)
    latitude=Column(Float)
    longitude=Column(Float)
    mechanic=relationship("Mechanic",back_populates="user",
                          uselist=False)
    requests=relationship("Request",back_populates="user")

class Mechanic(Base):
    __tablename__="mechanics"
    id=Column(Integer,primary_key=True,autoincrement=True)
    user_id=Column(Integer,ForeignKey("users.id"),unique=True)
    shop_name=Column(String)
    address=Column(String)
    phone=Column(String)
    specialization=Column(String)
    experience_year=Column(Integer)
    latitude=Column(Float)
    longitude=Column(Float)
    availability=Column(Boolean,default=True)
    rating=Column(Float)
    user=relationship("User",back_populates="mechanic")
    requests=relationship("Request",back_populates="mechanic")

class Request(Base):
    __tablename__="requests"
    id=Column(Integer,primary_key=True,autoincrement=True)
    user_id=Column(Integer,ForeignKey("users.id"),nullable=False)
    mechanic_id=Column(Integer,ForeignKey("mechanics.id"),nullable=True)
    vehicle_type=Column(String)
    vehicle_number=Column(String)
    issue_type=Column(String)
    issue_description=Column(Text)
    latitude=Column(Float)
    longitude=Column(Float)
    status=Column(String,default="pending")

    rating=Column(Integer)

    comment=Column(Text)
    user=relationship("User",back_populates="requests")

    mechanic=relationship("Mechanic",back_populates="requests")

Base.metadata.create_all(bind=engine)