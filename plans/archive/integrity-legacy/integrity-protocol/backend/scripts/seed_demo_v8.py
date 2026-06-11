import os
import time
from eth_account import Account
from web3 import Web3
from services.blockchain_service import IntegrityBlockchainService
from services.database import SessionLocal, Agent, UserProfile, Base, engine
import datetime

# Xibalba Solutions: Demo Fleet Seeding Script (v8.3)
# This script initializes the master agent and demo fleet with real wallets and tokens.

def seed_demo_fleet():
    blockchain = IntegrityBlockchainService()
    db = SessionLocal()
    
    master_addr = os.getenv("XIBALBA_ORACLE_ADDRESS")
    if not master_addr:
        print("CRITICAL: XIBALBA_ORACLE_ADDRESS missing.")
        return

    # 1. Ensure Master Agent Profile exists
    master_profile = db.query(UserProfile).filter(UserProfile.owner_uid == "jacob_v_universe_master").first()
    if not master_profile:
        master_profile = UserProfile(
            owner_uid="jacob_v_universe_master",
            handle="xibalba",
            itk_balance=1000000.0, # Master balance
            app_wallet_address=master_addr
        )
        db.add(master_profile)
        db.commit()
        print(f"✅ Master Profile @xibalba initialized.")

    # 2. Seed Demo Accounts
    demo_configs = [
        {"uid": "demo_alpha_uid", "handle": "alpha", "alias": "Alpha Sentinel"},
        {"uid": "demo_omega_uid", "handle": "omega", "alias": "Omega Witness"}
    ]

    for cfg in demo_configs:
        profile = db.query(UserProfile).filter(UserProfile.owner_uid == cfg["uid"]).first()
        if not profile:
            new_acc = Account.create()
            profile = UserProfile(
                owner_uid=cfg["uid"],
                handle=cfg["handle"],
                itk_balance=10000.0,
                app_wallet_address=new_acc.address,
                encrypted_wallet_key=new_acc.key.hex()
            )
            db.add(profile)
            db.commit()
            print(f"✅ Demo Profile @{cfg['handle']} initialized: {new_acc.address}")
            
            # Send real ITK on testnet
            blockchain.faucet_drop(new_acc.address, amount_itk=10000.0)
            print(f"💰 Sent 10,000 ITK to @{cfg['handle']}")
        
        # Ensure Agent identity exists
        agent = db.query(Agent).filter(Agent.owner_uid == cfg["uid"]).first()
        if not agent:
            agent = Agent(
                eth_address=profile.app_wallet_address,
                alias=cfg["alias"],
                xns_handle=f"{cfg['handle']}.intg",
                verification_tier=2,
                current_ais=800,
                owner_uid=cfg["uid"],
                is_active=True
            )
            db.add(agent)
            db.commit()
            print(f"🤖 Agent identity created for @{cfg['handle']}")

    db.close()

if __name__ == "__main__":
    seed_demo_fleet()
