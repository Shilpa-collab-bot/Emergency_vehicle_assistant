#Emergency vehicle Assistant
 When a vehicle breaks down on the road , the owner is stuck in an unfamiliar place and doesn't know which nearby mechanic can be trusted. 
 this app connects stranded vehicle owners to trusted mechanics near their location .


 ## Tech Stack
 -Backend : Python FastAPI SQLAlchemy
 -Database: SQL
 -Frontend: HTML CSS JavaScript 

 ### How it works
 - Vehicle owners and mechanics are stored in the database.
 - the backend matches an owner to nearby mechanics by location

### Run Locally 
1.clone the repository 
2.uvicorn backend.main1:app --reload
3.for the frontend 
4.py -m http.server 5500 --directory .\frontend


### What i would improve next
- upgrade with AI 
- build the trust with users when there is no mechanic 

