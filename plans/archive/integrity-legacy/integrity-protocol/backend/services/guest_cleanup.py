import time
import os
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, UserProfile
from blockchain_service import IntegrityBlockchainService

# Xibalba Solutions: Guest Cleanup & Token Recovery (v1.0)
# This script identifies guest accounts that haven't converted to full accounts
# within a certain timeframe and recovers their ITK tokens back to the Master Agent.

class GuestCleanup:
    def __init__(self):
        self.blockchain = IntegrityBlockchainService()
        self.cleanup_threshold_hours = 24 # Recover tokens after 24h of inactivity

    def run(self):
        print("--------------------------------------------------")
        print("🚀 GUEST CLEANUP & TOKEN RECOVERY STARTED")
        print("--------------------------------------------------")

        while True:
            try:
                self.process_cleanup()
            except Exception as e:
                print(f"[CLEANUP ERROR] {e}")
            
            time.sleep(3600) # Check once per hour

    def process_cleanup(self):
        db = SessionLocal()
        try:
            # Find guests with app wallets and no full handle (still guest_ prefix)
            cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=self.cleanup_threshold_hours)
            old_guests = db.query(UserProfile).filter(
                UserProfile.owner_uid.like("guest_%"),
                UserProfile.created_at < cutoff,
                UserProfile.app_wallet_address != None
            ).all()

            if not old_guests:
                return

            print(f"[CLEANUP] Found {len(old_guests)} inactive guest wallets.")

            for guest in old_guests:
                print(f"[CLEANUP] Recovering tokens from {guest.app_wallet_address} (@{guest.handle})...")
                
                # We need the guest's private key (it's stored encrypted in the DB for the demo)
                # In this demo setup, we'll assume we can decrypt it or it was stored for this purpose.
                # WARNING: In a real system, the master should not have keys to guest wallets.
                # However, for a "demo sponsorship" model, this is the requested behavior.
                
                tx_hash = self.blockchain.sweep_tokens_back(
                    from_address=guest.app_wallet_address,
                    from_private_key=guest.encrypted_wallet_key # Demo: Stored in DB
                )

                if tx_hash:
                    print(f"[CLEANUP] Successfully recovered ITK to Master. Tx: {tx_hash}")
                    # Delete the profile or mark as recovered
                    db.delete(guest)
                    db.commit()
                else:
                    print(f"[CLEANUP] Failed to recover tokens from {guest.app_wallet_address}. Will retry.")

        finally:
            db.close()

if __name__ == "__main__":
    worker = GuestCleanup()
    worker.run()
