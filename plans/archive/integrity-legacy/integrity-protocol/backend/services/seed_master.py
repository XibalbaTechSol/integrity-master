from database import SessionLocal, Agent, UserProfile, Base, engine
import datetime
import uuid

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    master_addr = "0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556"
    master_uid = "master_agent_uid"
    
    # Check if exists
    exists = db.query(Agent).filter(Agent.eth_address == master_addr).first()
    if not exists:
        print(f"Seeding Master Agent: {master_addr}")
        master = Agent(
            agent_id=uuid.uuid4(),
            eth_address=master_addr,
            alias="Xibalba Core",
            controller_entity="Xibalba Solutions LLC",
            verification_tier=3,
            current_ais=920,
            grounding_score=95,
            entropy_score=92,
            sacrifice_score=88,
            performance_entropy=0.012,
            staked_amount_itk=5000.0,
            owner_uid=master_uid,
            xns_handle="xibalba.intg",
            is_active=True,
            last_active_at=datetime.datetime.utcnow()
        )
        db.add(master)
        
        # Also seed user profile for master
        profile = UserProfile(
            profile_id=uuid.uuid4(),
            owner_uid=master_uid,
            handle="@xibalba",
            itk_balance=15000.0,
            app_wallet_address=master_addr,
            created_at=datetime.datetime.utcnow()
        )
        db.add(profile)
        
        db.commit()
        print("Master Agent & Profile seeded successfully.")
    else:
        print("Master Agent already exists in database.")
    
    db.close()

if __name__ == "__main__":
    seed()
