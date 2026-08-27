from pydantic import BaseModel

# USER LOGIN
class Login_user(BaseModel):
    email:str
    password:str


#USER REGISTRATION
class Register_user(BaseModel):
    full_name:str
    phone:str
    email:str
    password:str
    role:str="user"
    
class Register_mechanic(BaseModel):
    full_name:str
    phone:str
    email:str
    password:str
    shop_name:str
    address:str
    specialization:str
    experience_year:int
    latitude:float 
    longitude:float 

class Create_request(BaseModel):
    vehicle_type:str
    vehicle_number:str

    issue_type:str
    issue_description:str

    latitude:float
    longitude:float

class Update_request_status(BaseModel):
    status:str

class Request_feedback(BaseModel):
    rating:int
    comment:str

class Update_profile(BaseModel):
    full_name:str
    email:str
    phone:str

class Update_availability(BaseModel):
    availability:bool

class Update_location(BaseModel):
    latitude:float
    longitude:float

