import hashlib
import hmac
import os
import secrets
from datetime import datetime,timedelta,timezone

import jwt
from fastapi import FastAPI,HTTPException,Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials,HTTPBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .database1 import SessionLocal
from .tables1 import User,Mechanic,Request
from .schema1 import(
    Register_user,
    Register_mechanic,
    Login_user,
    Update_request_status,
    Request_feedback,
    Update_profile,
    Create_request,
    Update_availability,
    Update_location,
)
app=FastAPI(title="Emergency Vehicle Assistant")
JWT_SECRET=os.getenv("EVA_JWT_SECRET") or secrets.token_urlsafe(32)
JWT_ALGORITHM="HS256"
bearer_scheme=HTTPBearer()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.netlify.app","http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def hash_password(password:str)->str:
    salt=secrets.token_bytes(16)
    digest=hashlib.pbkdf2_hmac("sha256",password.encode(),salt,600000)
    return f"{salt.hex()}${digest.hex()}"

def verify_password(password:str,stored_password:str)->bool:
    try:
        salt_hex,digest_hex=stored_password.split("$",1)
        digest=hashlib.pbkdf2_hmac(
            "sha256",password.encode(),bytes.fromhex(salt_hex),600000)
        return hmac.compare_digest(digest.hex(),digest_hex)
    except (ValueError,TypeError):
        return False

def create_token(user):
    return jwt.encode(
        {"sub":str(user.id),"role":user.role,
         "exp":datetime.now(timezone.utc)+timedelta(hours=8)},
        JWT_SECRET,algorithm=JWT_ALGORITHM
    )

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials:HTTPAuthorizationCredentials=Depends(bearer_scheme),
    db:Session=Depends(get_db)
):
    try:
        payload=jwt.decode(credentials.credentials,JWT_SECRET,algorithms=[JWT_ALGORITHM])
        user_id=int(payload.get("sub"))
    except (jwt.InvalidTokenError,TypeError,ValueError):
        raise HTTPException(status_code=401,detail="Invalid or expired token")
    user=db.query(User).filter(User.id==user_id).first()
    if not user:
        raise HTTPException(status_code=404,detail="User not found")
    return user

def require_admin(user=Depends(get_current_user)):
    if user.role!="admin":
        raise HTTPException(status_code=403,detail="Admin access required")
    return user
@app.post("/users/register")
def register_user(data:Register_user,db:Session=Depends(get_db)):
    record=db.query(User).filter(User.email==data.email).first()
    if record:
        raise HTTPException(status_code=401,detail="Email already registered")
    user=User(full_name=data.full_name,
              phone=data.phone,
              email=data.email,
              password=hash_password(data.password),
              role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "success":True,
        "message":"User Registered successfully",
        "user_id":user.id
    }



@app.post("/mechanic/register")
def register_mechanic(data:Register_mechanic,db:Session=Depends(get_db)):
    record=db.query(User).filter(User.email==data.email).first()
    if record:
        raise HTTPException(status_code=400,detail="Email already registered")
    new_user=User(full_name=data.full_name,phone=data.phone,email=data.email,password=hash_password(data.password),role="mechanic")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    new_mechanic=Mechanic(
        user_id=new_user.id,
        phone=data.phone,
        shop_name=data.shop_name,
        address=data.address,
        specialization=data.specialization,
        experience_year=data.experience_year,
        latitude=data.latitude,
        longitude=data.longitude,
        availability=True,
        rating=0
    )
    db.add(new_mechanic)
    db.commit()
    db.refresh(new_mechanic)
    return {
        "success":True,
        "message":"Mechanic registered successfully",
        "user":{
            "id":new_user.id,
            "full_name":new_user.full_name,
            "email":new_user.email,
            "role":new_user.role
        },
        "mechanic":{
            "id":new_mechanic.id,
            "shop_name":new_mechanic.shop_name,
            "latitude":new_mechanic.latitude,
            "longitude":new_mechanic.longitude,
            "availability":new_mechanic.availability
        }
    }


@app.post("/login")
def login(data:Login_user,db:Session=Depends(get_db)):
    user=db.query(User).filter(User.email==data.email).first()
    if not user:
        raise HTTPException(status_code=401,detail="Invalid email or password")
    valid_password=verify_password(data.password,user.password)
    if not valid_password:
        raise HTTPException(status_code=401,detail="Invalid Email or Password")
    mechanic=db.query(Mechanic).filter(Mechanic.user_id==user.id).first()
    return {
        "success":True,
        "message":"Login Successful",
        "user":{
            "id":user.id,
            "full_name":user.full_name,
            "email":user.email,
            "role":user.role
        },
        "mechanic_id":mechanic.id if mechanic else None,
        "token":create_token(user)
    }
@app.post("/requests")
def create_request(data:Create_request,user_id:int,db:Session=Depends(get_db),current_user=Depends(get_current_user)):
    if user_id!=current_user.id or current_user.role!="user":
        raise HTTPException(status_code=403,detail="User access required")
    rec=db.query(Mechanic).filter(Mechanic.availability==True).all()
    if not rec:
        raise HTTPException(status_code=401,detail="No available mchanic found")
    nearest_mechanic=None
    shortest_distance=float("inf")
    for i in rec:
        distance=((i.latitude-data.latitude)**2+(i.longitude-data.longitude)**2)
        if distance<shortest_distance:
            shortest_distance=distance
            nearest_mechanic=i
    request=Request(
        user_id=user_id,
        mechanic_id=nearest_mechanic.id,
        vehicle_type=data.vehicle_type,
        vehicle_number=data.vehicle_number,
        issue_type=data.issue_type,
        issue_description=data.issue_description,
        latitude=data.latitude,
        longitude=data.longitude,
        status="pending")
    db.add(request)
    db.commit()
    db.refresh(request)
    return {
        "success":True,
        "message":"Emergency request created",
        "request_id":request.id,
        "mechanic_id":nearest_mechanic.id,
        "mechanic_name":nearest_mechanic.shop_name
    }

@app.patch("/mechanic/availability")
def update_availability(
    data:Update_availability,
    mechanic_id:int,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    mechanic=db.query(Mechanic).filter(Mechanic.id==mechanic_id).first()
    if not mechanic or mechanic.user_id!=current_user.id or current_user.role!="mechanic":
        raise HTTPException(status_code=404,detail="Mechanic not found")
    mechanic.availability=data.availability
    db.commit()
    return {"success":True,"availability":mechanic.availability}

@app.patch("/mechanic/location")
def update_location(
    data:Update_location,
    mechanic_id:int,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    mechanic=db.query(Mechanic).filter(
        Mechanic.id==mechanic_id,
        Mechanic.user_id==current_user.id
    ).first()
    if not mechanic or current_user.role!="mechanic":
        raise HTTPException(status_code=403,detail="Mechanic access required")
    mechanic.latitude=data.latitude
    mechanic.longitude=data.longitude
    db.commit()
    return {"success":True,"message":"Location updated"}

@app.get("/display")
def display_users(db:Session=Depends(get_db),admin=Depends(require_admin)):
    record=db.query(User).all()
    return {"records":[{"id":user.id,"full_name":user.full_name,"phone":user.phone,
        "email":user.email,"role":user.role} for user in record]}

@app.get("/admins")
def display_admins(db:Session=Depends(get_db),admin=Depends(require_admin)):
    records=db.query(User).filter(User.role=="admin").all()
    return {"success":True,"records":[
        {
            "id":admin.id,
            "full_name":admin.full_name,
            "phone":admin.phone,
            "email":admin.email,
            "role":admin.role
        } for admin in records
    ]}

@app.get("/profile")
def get_profile(user_id:int,db:Session=Depends(get_db),current_user=Depends(get_current_user)):
    if user_id!=current_user.id:
        raise HTTPException(status_code=403,detail="Cannot access another profile")
    user=db.query(User).filter(User.id==user_id).first()
    if not user:
        raise HTTPException(status_code=404,detail="User not found")
    return {
        "success":True,
        "user":{
            "id":user.id,
            "full_name":user.full_name,
            "phone":user.phone,
            "email":user.email,
            "role":user.role
        }
    }

@app.put("/profile")
def update_profile(user_id:int,data:Update_profile,db:Session=Depends(get_db),current_user=Depends(get_current_user)):
    if user_id!=current_user.id:
        raise HTTPException(status_code=403,detail="Cannot update another profile")
    user=db.query(User).filter(User.id==user_id).first()
    if not user:
        raise HTTPException(status_code=404,detail="User not found")
    duplicate=db.query(User).filter(
        User.email==data.email,
        User.id!=user_id
    ).first()
    if duplicate:
        raise HTTPException(status_code=400,detail="Email already registered")
    user.full_name=data.full_name
    user.email=data.email
    user.phone=data.phone
    db.commit()
    return {"success":True,"message":"Profile updated successfully"}

@app.get("/mechanics")
def display_mechanics(db:Session=Depends(get_db),admin=Depends(require_admin)):
    rec=db.query(Mechanic).all()
    if rec:
        return {"records":[
            {
                "id":mechanic.id,
                "user_id":mechanic.user_id,
                "shop_name":mechanic.shop_name,
                "address":mechanic.address,
                "phone":mechanic.phone,
                "email":mechanic.user.email if mechanic.user else None,
                "specialization":mechanic.specialization,
                "experience_year":mechanic.experience_year,
                "latitude":mechanic.latitude,
                "longitude":mechanic.longitude,
                "availability":mechanic.availability,
                "rating":mechanic.rating
            } for mechanic in rec
        ]}
    else:
        raise HTTPException(status_code=401 ,detail="Mechanics Not found")

@app.get("/requests/my")
def get_my_requests(user_id:int,db:Session=Depends(get_db),current_user=Depends(get_current_user)):
    if user_id!=current_user.id:
        raise HTTPException(status_code=403,detail="Cannot access another user's requests")
    requests=(db.query(Request).filter(Request.user_id==user_id).order_by(Request.id.desc()).all())
    result=[]
    for request in requests:
        mechanic=db.query(Mechanic).filter(Mechanic.id==request.mechanic_id).first()
        result.append({
            "id":request.id,
            "user_id":request.user_id,
            "mechanic_id":request.mechanic_id,
            "vehicle_type":request.vehicle_type,
            "vehicle_number":request.vehicle_number,
            "issue_type":request.issue_type,
            "issue_description":request.issue_description,
            "latitude":request.latitude,
            "longitude":request.longitude,
            "status":request.status,
            "rating":request.rating,
            "comment":request.comment,
            "mechanic":{
                "shop_name":mechanic.shop_name,
                "phone":mechanic.phone,
                "address":mechanic.address,
                "latitude":mechanic.latitude,
                "longitude":mechanic.longitude
            } if mechanic else None
        })
    return {"success":True,"count":len(result),"requests":result}

@app.put("/requests/{request_id}/cancel")
def cancel_request(
    request_id:int,
    user_id:int,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if user_id!=current_user.id or current_user.role!="user":
        raise HTTPException(status_code=403,detail="User access required")
    request=db.query(Request).filter(
        Request.id==request_id,
        Request.user_id==user_id
    ).first()
    if not request:
        raise HTTPException(status_code=404,detail="Request not found")
    if request.status not in ["pending","accepted"]:
        raise HTTPException(status_code=400,detail="This request cannot be cancelled")
    request.status="cancelled"
    if request.mechanic_id:
        mechanic=db.query(Mechanic).filter(Mechanic.id==request.mechanic_id).first()
        if mechanic:
            mechanic.availability=True
    db.commit()
    return {"success":True,"message":"Request cancelled successfully"}

@app.post("/requests/{request_id}/feedback")
def submit_feedback(
    request_id:int,
    user_id:int,
    data:Request_feedback,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if user_id!=current_user.id or current_user.role!="user":
        raise HTTPException(status_code=403,detail="User access required")
    request=db.query(Request).filter(
        Request.id==request_id,
        Request.user_id==user_id
    ).first()
    if not request:
        raise HTTPException(status_code=404,detail="Request not found")
    if request.status != "completed":
        raise HTTPException(status_code=400,detail="Feedback is available after completion")
    if request.rating is not None:
        raise HTTPException(status_code=400,detail="Feedback already submitted")
    request.rating=data.rating
    request.comment=data.comment.strip()
    mechanic=db.query(Mechanic).filter(Mechanic.id==request.mechanic_id).first()
    if mechanic:
        ratings=db.query(Request.rating).filter(
            Request.mechanic_id==mechanic.id,
            Request.rating.isnot(None),
            Request.id!=request.id
        ).all()
        mechanic.rating=(sum(row[0] for row in ratings)+data.rating)/(len(ratings)+1)
    db.commit()
    return {"success":True,"message":"Feedback submitted successfully"}

@app.get("/requests/mechanic")
def get_mechanic_requests(mechanic_id:int,db:Session=Depends(get_db),current_user=Depends(get_current_user)):
    mechanic=db.query(Mechanic).filter(Mechanic.id==mechanic_id,Mechanic.user_id==current_user.id).first()
    if not mechanic or current_user.role!="mechanic":
        raise HTTPException(status_code=403,detail="Mechanic access required")
    req=(db.query(Request).filter(Request.mechanic_id==mechanic_id).order_by(Request.id.desc()).all())
    return {
        "success":True,
        "count":len(req),
        "requests":req
    }

@app.get("/all/requests")
def admin(db:Session=Depends(get_db),admin=Depends(require_admin)):
    req=(db.query(Request).order_by(Request.id.desc()).all())
    result=[]
    for j in req:
        user=db.query(User).filter(User.id==j.user_id).first()
        mechanic=None
        if j.mechanic_id:
            mechanic=db.query(Mechanic).filter(Mechanic.id==j.mechanic_id).first()
        result.append({
            "request_id":j.id,
            "user":{
                "id":user.id if user else None,
                "full_name":user.full_name if user else None,
                "phone":user.phone if user else None
            },
            "mechanic":{
                "id":mechanic.id if mechanic else None,
                "shop_name":mechanic.shop_name if mechanic else None,
                "phone":mechanic.phone if mechanic else None
            } if mechanic else None,
            "vehicle_type":j.vehicle_type,
            "vehicle_number":j.vehicle_number,
            "issue_type":j.issue_type,
            "issue_description":j.issue_description,
            "latitude":j.latitude,
            "longitude":j.longitude,
            "status":j.status,
            "rating":j.rating,
            "comment":j.comment
        })
    return {
        "success":True,
        "count":len(result),
        "requests":result
    }


@app.put("/requests/{request_id}/accept")
def accept_requests(request_id:int ,mechanic_id:int,db:Session=Depends(get_db),current_user=Depends(get_current_user)):
    mechanic=db.query(Mechanic).filter(Mechanic.id==mechanic_id,Mechanic.user_id==current_user.id).first()
    if not mechanic or current_user.role!="mechanic":
        raise HTTPException(status_code=403,detail="Mechanic access required")
    request=db.query(Request).filter(Request.id==request_id).first()
    if not request:
        raise HTTPException(status_code=404,detail="request not found")
    if request.mechanic_id!=mechanic_id:
        raise HTTPException(status_code=403,detail="This request is not assigned to this mechanic")
    if request.status!="pending":
        raise HTTPException(status_code=400,detail=
                            f"Request is already {request.status}")
    request.status="accepted"
    if mechanic:
        mechanic.availability=False
    db.commit()
    db.refresh(request)
    return {
        "success":True,
        "message":"Request accepted successfully",
        "request":{
            "id":request.id,
            "user_id":request.user_id,
            "mechanic_id":request.mechanic_id,
            "status":request.status
        }
    }
@app.put("/requests/{request_id}/reject")
def reject_request(
    request_id: int,
    mechanic_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    mechanic = db.query(Mechanic).filter(
        Mechanic.id == mechanic_id,
        Mechanic.user_id == current_user.id
    ).first()
    if not mechanic or current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Mechanic access required")
    request = db.query(Request).filter(
        Request.id == request_id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    if request.mechanic_id != mechanic_id:
        raise HTTPException(
            status_code=403,
            detail="This request is not assigned to this mechanic"
        )

    if request.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Request is already {request.status}"
        )

    request.status = "rejected"

    # Make mechanic available again
    if mechanic:
        mechanic.availability = True

    db.commit()
    db.refresh(request)

    return {
        "success": True,
        "message": "Request rejected successfully",
        "request": {
            "id": request.id,
            "user_id": request.user_id,
            "mechanic_id": request.mechanic_id,
            "status": request.status
        }
    }

@app.put("/requests/{request_id}/complete")
def complete_request(
    request_id: int,
    mechanic_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    mechanic = db.query(Mechanic).filter(
        Mechanic.id == mechanic_id,
        Mechanic.user_id == current_user.id
    ).first()
    if not mechanic or current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Mechanic access required")
    request = db.query(Request).filter(
        Request.id == request_id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    if request.mechanic_id != mechanic_id:
        raise HTTPException(
            status_code=403,
            detail="This request is not assigned to this mechanic"
        )

    if request.status not in ["accepted", "in_progress"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot complete request with status '{request.status}'"
        )

    request.status = "completed"

    # Mechanic is available for another emergency
    if mechanic:
        mechanic.availability = True

    db.commit()
    db.refresh(request)

    return {
        "success": True,
        "message": "Request completed successfully",
        "request": {
            "id": request.id,
            "user_id": request.user_id,
            "mechanic_id": request.mechanic_id,
            "status": request.status
        }
    }